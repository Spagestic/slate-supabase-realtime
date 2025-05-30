/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import * as Y from "yjs";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
} from "y-protocols/awareness";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Descendant } from "slate";
import initialValue from "@/lib/editor/initialValue";

// Channel name - using a unique ID to ensure both instances connect to the same channel
const CHANNEL = "slate-editor-example-6mp9vmt";

type ActiveUser = { username: string; [key: string]: any };

export interface CollaborationState {
  connected: boolean;
  sharedType: Y.XmlText | null;
  provider: any | null;
  activeUsers: ActiveUser[];
  username: string;
  documentLoaded: boolean;
  initialContent: Descendant[];
  saveDocument?: (content: Descendant[]) => void;
  isFirstUser: boolean;
}

export interface CollaborationHookOptions {
  channelName?: string;
  documentId?: string;
  enableDatabaseSaving?: boolean;
}

export function useCollaboration(options: CollaborationHookOptions = {}) {
  const supabase = createClient();
  const [username, setUsername] = useState("");
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [connected, setConnected] = useState(false);
  const [sharedType, setSharedType] = useState<Y.XmlText | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const [initialContent, setInitialContent] =
    useState<Descendant[]>(initialValue);
  const [isFirstUser, setIsFirstUser] = useState(true);
  const channelRef = React.useRef<RealtimeChannel | null>(null);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Document saving function with debouncing
  const saveDocument = useCallback(
    async (content: Descendant[]) => {
      if (!options.documentId || !options.enableDatabaseSaving) return;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set a very short timeout to batch rapid changes while maintaining responsiveness
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          console.log("Saving document content:", content);

          // For jsonb column, we can directly store the JavaScript object
          const { error } = await supabase
            .from("document")
            .update({
              content: content, // Store as jsonb directly, no need to stringify
              updated_at: new Date().toISOString(),
            })
            .eq("id", options.documentId);

          if (error) {
            console.error("Error saving document:", error);
          } else {
            console.log("Document saved successfully to database");
          }
        } catch (error) {
          console.error("Error saving document:", error);
        }
      }, 100); // Very short debounce (100ms) for real-time feel
    },
    [options.documentId, options.enableDatabaseSaving, supabase]
  );

  // Load document from database
  useEffect(() => {
    async function loadDocument() {
      if (!options.documentId || !options.enableDatabaseSaving) {
        setDocumentLoaded(true);
        return;
      }

      try {
        // Load document from database
        const { data: document, error } = await supabase
          .from("document")
          .select("*")
          .eq("id", options.documentId)
          .single();

        if (error) {
          console.error("Error loading document:", error);
          setDocumentLoaded(true);
          return;
        }

        if (document?.content) {
          try {
            // Since content is stored as jsonb, it's already parsed by Supabase
            let parsedContent = document.content;

            // If it's still a string (legacy data), parse it
            if (typeof parsedContent === "string") {
              parsedContent = JSON.parse(parsedContent);
            }

            // Validate the content is a valid Slate document
            if (Array.isArray(parsedContent) && parsedContent.length > 0) {
              console.log(
                "Loaded document content from database:",
                parsedContent
              );
              setInitialContent(parsedContent);
            } else {
              console.log(
                "Document content is empty or invalid, using default"
              );
              setInitialContent(initialValue);
            }
          } catch (error) {
            console.error("Error parsing document content:", error);
            setInitialContent(initialValue);
          }
        } else {
          console.log("No document content found, using default");
          setInitialContent(initialValue);
        }

        setDocumentLoaded(true);
      } catch (error) {
        console.error("Error loading document:", error);
        setDocumentLoaded(true);
      }
    }

    loadDocument();
  }, [options.documentId, options.enableDatabaseSaving, supabase]);

  // Generate random username
  useEffect(() => {
    const adjectives = ["Happy", "Clever", "Brave", "Bright", "Kind"];
    const nouns = ["Panda", "Tiger", "Eagle", "Dolphin", "Fox"];
    const randomName = `${
      adjectives[Math.floor(Math.random() * adjectives.length)]
    }${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(
      Math.random() * 100
    )}`;
    setUsername(randomName);
  }, []); // Set up Yjs provider and document
  useEffect(() => {
    if (!documentLoaded) return;

    const yDoc = new Y.Doc();
    const sharedDoc = yDoc.get("slate", Y.XmlText);
    const awareness = new Awareness(yDoc);

    // Use document-specific channel if documentId is provided
    const channelName = options.documentId
      ? `slate-editor-example-${options.documentId}`
      : options.channelName || CHANNEL;

    // Set up Supabase channel as our "provider"
    const channel = supabase.channel(channelName);
    channelRef.current = channel; // Handle presence for user list
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const users: ActiveUser[] = [];

      Object.keys(state).forEach((key) => {
        const presences = state[key];
        presences.forEach((presence: any) => {
          if (presence.username) {
            users.push(presence as ActiveUser);
          }
        });
      });

      setActiveUsers(users);
      // Determine if we're the first user (only counting others, not ourselves)
      const otherUsers = users.filter((user) => user.username !== username);
      setIsFirstUser(otherUsers.length === 0);

      if (otherUsers.length > 0) {
        console.log("Other users present, will sync from existing state");
      }
    });

    // Handle document updates via broadcast
    channel.on("broadcast", { event: "yjs-update" }, (payload) => {
      // Skip if this is our own update
      if (payload.payload.sender === yDoc.clientID) return;

      try {
        console.log("Received Yjs update from client:", payload.payload.sender);
        // Apply YJS update - payload.update should be base64 encoded
        const update = new Uint8Array(
          atob(payload.payload.update)
            .split("")
            .map((c) => c.charCodeAt(0))
        );
        Y.applyUpdate(yDoc, update, "remote");
        console.log("Applied Yjs update successfully");
      } catch (error) {
        console.error("Error applying Yjs update:", error);
      }
    });

    // Handle state requests from new clients
    channel.on("broadcast", { event: "request-yjs-state" }, (payload) => {
      // Skip if this is our own request
      if (payload.payload.sender === yDoc.clientID) return;

      // Send current state to the requesting client
      const currentState = Y.encodeStateAsUpdate(yDoc);
      const base64State = btoa(String.fromCharCode(...currentState));

      channel.send({
        type: "broadcast",
        event: "yjs-state-response",
        payload: {
          state: base64State,
          sender: yDoc.clientID,
          recipient: payload.payload.sender,
        },
      });
    }); // Handle state responses
    channel.on("broadcast", { event: "yjs-state-response" }, (payload) => {
      // Only process if this response is for us
      if (payload.payload.recipient !== yDoc.clientID) return;

      try {
        console.log(
          "Received state response from client:",
          payload.payload.sender
        );
        // Apply the received state
        const state = new Uint8Array(
          atob(payload.payload.state)
            .split("")
            .map((c) => c.charCodeAt(0))
        );
        Y.applyUpdate(yDoc, state, "remote");
        console.log("Applied state response successfully");
      } catch (error) {
        console.error("Error applying state response:", error);
      }
    });

    // Handle awareness updates via broadcast
    channel.on("broadcast", { event: "awareness-update" }, (payload) => {
      // Skip if this is our own update
      if (payload.payload.sender === yDoc.clientID) return;

      try {
        console.log(
          "Received awareness update from client:",
          payload.payload.sender
        );
        const update = new Uint8Array(
          atob(payload.payload.update)
            .split("")
            .map((c) => c.charCodeAt(0))
        );
        applyAwarenessUpdate(awareness, update, "remote");
        console.log("Applied awareness update successfully");
      } catch (error) {
        console.error("Error applying awareness update:", error);
      }
    });

    // Listen to Yjs document updates to broadcast them
    const updateHandler = (update: Uint8Array, origin: any) => {
      // Only broadcast if the update didn't come from remote
      if (origin !== "remote") {
        console.log(
          "Broadcasting Yjs update, origin:",
          origin,
          "size:",
          update.length
        );
        // Convert Uint8Array to base64 string for JSON serialization
        const base64Update = btoa(String.fromCharCode(...update));

        // Send update via Supabase
        channel.send({
          type: "broadcast",
          event: "yjs-update",
          payload: {
            update: base64Update,
            sender: yDoc.clientID,
          },
        });
      } else {
        console.log("Skipping broadcast for remote update");
      }
    };

    // Listen to awareness updates to broadcast them
    const awarenessUpdateHandler = (
      {
        added,
        updated,
        removed,
      }: { added: number[]; updated: number[]; removed: number[] },
      origin: any
    ) => {
      if (origin !== "remote") {
        const changedClients = added.concat(updated, removed);
        if (changedClients.length > 0) {
          console.log(
            "Broadcasting awareness update for clients:",
            changedClients
          );
          const update = encodeAwarenessUpdate(awareness, changedClients);
          const base64Update = btoa(String.fromCharCode(...update));

          channel.send({
            type: "broadcast",
            event: "awareness-update",
            payload: {
              update: base64Update,
              sender: yDoc.clientID,
            },
          });
        }
      }
    };

    yDoc.on("update", updateHandler);
    awareness.on("update", awarenessUpdateHandler);

    // Subscribe to channel
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        // Track presence
        await channel.track({
          user_id: yDoc.clientID,
          username: username,
          online_at: new Date().getTime(),
        });

        // Set local awareness state for cursor information
        awareness.setLocalStateField("user", {
          name: username,
          color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
        });

        // Request current state from other clients (if any)
        channel.send({
          type: "broadcast",
          event: "request-yjs-state",
          payload: {
            sender: yDoc.clientID,
          },
        });

        setConnected(true);
      }
    });

    setSharedType(sharedDoc);
    setProvider({ awareness });

    return () => {
      yDoc.off("update", updateHandler);
      awareness.off("update", awarenessUpdateHandler);
      if (channel) {
        channel.unsubscribe();
      }
      awareness.destroy();
      yDoc.destroy();
    };
  }, [
    supabase,
    username,
    options.channelName,
    options.documentId,
    documentLoaded,
  ]);

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }
    setConnected(false);
    setSharedType(null);
    setProvider(null);
    setActiveUsers([]);
  }, []);
  return {
    connected,
    sharedType,
    provider,
    activeUsers,
    username,
    documentLoaded,
    initialContent,
    saveDocument: options.enableDatabaseSaving ? saveDocument : undefined,
    isFirstUser,
    disconnect,
  };
}

// Helper function to generate user color
export function generateUserColor(): string {
  return `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`;
}

// Helper function to create user data for awareness
export function createUserData(name: string, color?: string) {
  return {
    name,
    color: color || generateUserColor(),
  };
}
