/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import "@/app/styles.css";
import React, { useCallback, useMemo, useEffect, useState } from "react";
import { createEditor, Descendant, Editor, Transforms } from "slate";
import { Slate, Editable, withReact } from "slate-react";
import { withHistory } from "slate-history";
import { withCursors, withYjs, YjsEditor } from "@slate-yjs/core";
import { useRemoteCursorOverlayPositions } from "@slate-yjs/react";
import { createClient } from "@/lib/supabase/client";
import * as Y from "yjs";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
} from "y-protocols/awareness";
import type { RealtimeChannel } from "@supabase/supabase-js";

// Define the initial value for the editor
const initialValue: Descendant[] = [
  {
    children: [{ text: "" }],
  },
];

// Define custom element components
const CodeElement = (props: any) => {
  return (
    <pre
      {...props.attributes}
      style={{ backgroundColor: "#f4f4f4", padding: "8px" }}
    >
      <code>{props.children}</code>
    </pre>
  );
};

const DefaultElement = (props: any) => {
  return <p {...props.attributes}>{props.children}</p>;
};

// Define custom leaf components
const Leaf = (props: any) => {
  return (
    <span
      {...props.attributes}
      style={{ fontWeight: props.leaf.bold ? "bold" : "normal" }}
    >
      {props.children}
    </span>
  );
};

// Cursors component for multiplayer functionality
function Cursors({ children }: { children: React.ReactNode }) {
  const containerRef = React.useRef<HTMLElement>(null);
  const [cursors] = useRemoteCursorOverlayPositions({
    containerRef: containerRef as React.RefObject<HTMLElement>,
  });

  return (
    <div className="cursors" ref={containerRef as any}>
      {children}
      {cursors.map((cursor) => (
        <Selection key={cursor.clientId} {...cursor} />
      ))}
    </div>
  );
}

function Selection({ data, selectionRects, caretPosition }: any) {
  if (!data) {
    return null;
  }

  const selectionStyle = {
    backgroundColor: data.color,
  };

  return (
    <>
      {selectionRects.map((position: any, i: number) => (
        <div
          style={{ ...selectionStyle, ...position }}
          className="selection"
          key={i}
        />
      ))}
      {caretPosition && <Caret caretPosition={caretPosition} data={data} />}
    </>
  );
}

function Caret({ caretPosition, data }: any) {
  const caretStyle = {
    ...caretPosition,
    background: data?.color,
  };

  const labelStyle = {
    transform: "translateY(-100%)",
    background: data?.color,
  };

  return (
    <div style={caretStyle} className="caretMarker">
      <div className="caret" style={labelStyle}>
        {data?.name}
      </div>
    </div>
  );
}

// Define custom editor commands
const CustomEditor = {
  isBoldMarkActive(editor: any) {
    const marks = Editor.marks(editor);
    return marks ? (marks as any).bold === true : false;
  },

  isCodeBlockActive(editor: any) {
    const [match] = Editor.nodes(editor, {
      match: (n: any) => n.type === "code",
    });

    return !!match;
  },

  toggleBoldMark(editor: any) {
    const isActive = CustomEditor.isBoldMarkActive(editor);
    if (isActive) {
      Editor.removeMark(editor, "bold");
    } else {
      Editor.addMark(editor, "bold", true);
    }
  },

  toggleCodeBlock(editor: any) {
    const isActive = CustomEditor.isCodeBlockActive(editor);
    Transforms.setNodes(editor, { type: isActive ? null : "code" } as any, {
      match: (n: any) => Editor.isBlock(editor, n),
    });
  },
};

export default function SlateEditor({ id }: { id: Promise<string> }) {
  const supabase = createClient();
  const [documentId, setDocumentId] = useState<string>("");
  const [username, setUsername] = useState("");
  type ActiveUser = { username: string; [key: string]: any };
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [connected, setConnected] = useState(false);
  const [sharedType, setSharedType] = useState<Y.XmlText | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [documentLoaded, setDocumentLoaded] = useState(false);
  const [initialContent, setInitialContent] =
    useState<Descendant[]>(initialValue);
  const channelRef = React.useRef<RealtimeChannel | null>(null);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  // Resolve the id Promise and load document
  useEffect(() => {
    async function resolveIdAndLoadDocument() {
      try {
        const resolvedId = await id;
        setDocumentId(resolvedId);

        // Load document from database
        const { data: document, error } = await supabase
          .from("document")
          .select("*")
          .eq("id", resolvedId)
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
        console.error("Error resolving document ID:", error);
        setDocumentLoaded(true);
      }
    }

    resolveIdAndLoadDocument();
  }, [id, supabase]); // Function to save document to database with minimal debouncing for real-time collaboration
  const saveDocument = useCallback(
    async (content: Descendant[]) => {
      if (!documentId) return;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      } // Set a very short timeout to batch rapid changes while maintaining responsiveness
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
            .eq("id", documentId);

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
    [documentId, supabase]
  );

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
  }, []);
  // Set up Yjs provider and document
  useEffect(() => {
    if (!documentId || !documentLoaded) return;

    const CHANNEL = `slate-editor-example-${documentId}`;
    const yDoc = new Y.Doc();
    const sharedDoc = yDoc.get("slate", Y.XmlText);
    const awareness = new Awareness(yDoc);

    // Set up Supabase channel as our "provider"
    const channel = supabase.channel(CHANNEL);
    channelRef.current = channel;

    // Handle presence for user list
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
    }); // Handle document updates via broadcast
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
    });

    // Handle state responses
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
    }); // Handle awareness updates via broadcast
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
    }); // Listen to Yjs document updates to broadcast them
    const updateHandler = (update: Uint8Array, origin: any) => {
      // Handle broadcasting updates
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
        console.log("Processing remote update");
      }
    }; // Listen to awareness updates to broadcast them
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
    awareness.on("update", awarenessUpdateHandler); // Subscribe to channel
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
  }, [supabase, username, documentId, documentLoaded, saveDocument]);
  // Create collaborative editor
  const editor = useMemo(() => {
    if (!sharedType || !provider) {
      console.log("Creating basic editor (no collaboration)");
      return withHistory(withReact(createEditor()));
    }

    console.log("Creating collaborative editor with Yjs integration");
    const e = withReact(
      withCursors(withYjs(createEditor(), sharedType), provider.awareness, {
        data: {
          name: username,
          color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
        },
      })
    ); // Ensure editor always has at least 1 valid child
    const { normalizeNode } = e;
    e.normalizeNode = (entry) => {
      const [node] = entry;

      if (!Editor.isEditor(node) || node.children.length > 0) {
        return normalizeNode(entry);
      }

      Transforms.insertNodes(e, initialValue, { at: [0] });
    };
    console.log("Collaborative editor created successfully");
    return e;
  }, [sharedType, provider, username]);
  // Connect/disconnect YjsEditor
  useEffect(() => {
    if (sharedType && editor && !YjsEditor.connected(editor as any)) {
      console.log("Connecting YjsEditor to document");
      YjsEditor.connect(editor as any);
      return () => {
        console.log("Disconnecting YjsEditor from document");
        YjsEditor.disconnect(editor as any);
      };
    }
  }, [editor, sharedType]);
  // Define element and leaf rendering functions
  const renderElement = useCallback((props: any) => {
    switch (props.element.type) {
      case "code":
        return <CodeElement {...props} />;
      default:
        return <DefaultElement {...props} />;
    }
  }, []);

  const renderLeaf = useCallback((props: any) => {
    return <Leaf {...props} />;
  }, []);

  // Create a ref to track the current editor value
  const currentEditorValue = React.useRef<Descendant[]>(initialValue);

  if (!connected || !sharedType || !provider) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-900 text-white">
        <div>Loading collaborative editor...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-white antialiased">
      {/* Header */}
      <div className="flex gap-2 flex-wrap absolute top-4 right-4">
        {activeUsers.map((user, index) => (
          <div
            key={index}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-800 text-neutral-300 text-xs"
          >
            <div className="w-1 h-1 rounded-full bg-green-400"></div>
            <span>{user.username}</span>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden p-12">
        <div className="max-w-4xl mx-auto h-full">
          <div className="h-full text-neutral-200 overflow-hidden">
            {" "}
            <Slate
              editor={editor}
              initialValue={initialContent}
              onChange={(value) => {
                // Always update our ref with the latest value
                currentEditorValue.current = value;

                // Check if this is an actual content change, not just a selection change
                const isAstChange = editor.operations.some(
                  (op) => "set_selection" !== op.type
                );

                console.log("Slate onChange triggered:", {
                  isAstChange,
                  operationsCount: editor.operations.length,
                  operations: editor.operations.map((op) => op.type),
                  documentId,
                  valueLength: value.length,
                });

                if (isAstChange) {
                  // For collaborative editing, we should save all local changes
                  // The YJS layer will handle merging and conflict resolution
                  // We use a short debounce to batch rapid typing while maintaining real-time feel
                  console.log("Content change detected, triggering save...");
                  saveDocument(value);
                } else {
                  console.log("Selection-only change, skipping save");
                }
              }}
            >
              <Cursors>
                <Editable
                  className="min-h-full p-4 focus:outline-none text-neutral-200"
                  style={{
                    fontSize: "16px",
                    fontFamily: "'Inter', sans-serif",
                    lineHeight: "1.6",
                  }}
                  renderElement={renderElement}
                  renderLeaf={renderLeaf}
                  onKeyDown={(event) => {
                    if (!event.ctrlKey) {
                      return;
                    }

                    switch (event.key) {
                      case "`": {
                        event.preventDefault();
                        CustomEditor.toggleCodeBlock(editor);
                        break;
                      }

                      case "b": {
                        event.preventDefault();
                        CustomEditor.toggleBoldMark(editor);
                        break;
                      }
                    }
                  }}
                />
              </Cursors>
            </Slate>
          </div>
        </div>
      </div>
    </div>
  );
}
