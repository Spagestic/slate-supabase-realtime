/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useEffect, useCallback, useRef } from "react";
import { createEditor, Editor, Transforms, Descendant } from "slate";
import {
  Slate,
  Editable,
  withReact,
  RenderElementProps,
  RenderLeafProps,
} from "slate-react";
import { withHistory } from "slate-history";
import { withCursors, withYjs, YjsEditor } from "@slate-yjs/core";
import { generateUserColor } from "@/hooks/use-collaboration";
import Cursors from "@/components/editor/Cursors";
import CodeElement from "@/components/editor/CodeElement";
import DefaultElement from "@/components/editor/DefaultElement";
import Leaf from "@/components/editor/Leaf";
import CustomEditor from "@/components/editor/CustomEditor";
import initialValue from "@/lib/editor/initialValue";

interface CollaborativeEditorProps {
  sharedType: any;
  provider: any;
  username: string;
  className?: string;
  style?: React.CSSProperties;
  initialContent?: Descendant[];
  onSave?: (content: Descendant[]) => void;
  isFirstUser?: boolean;
}

export function CollaborativeEditor({
  sharedType,
  provider,
  username,
  className = "min-h-full p-4 focus:outline-none text-neutral-200",
  style = {
    fontSize: "16px",
    fontFamily: "'Inter', sans-serif",
    lineHeight: "1.6",
  },
  initialContent = initialValue,
  onSave,
  isFirstUser = false,
}: CollaborativeEditorProps) {
  // Create a ref to track the current editor value
  const currentEditorValue = useRef<Descendant[]>(initialContent);
  // Track if we've already initialized the document
  const initializedRef = useRef<boolean>(false);

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
          color: generateUserColor(),
        },
      })
    ); // Ensure editor always has at least 1 valid child
    const { normalizeNode } = e;
    e.normalizeNode = (entry) => {
      const [node] = entry;

      if (!Editor.isEditor(node) || node.children.length > 0) {
        return normalizeNode(entry);
      }

      // Only initialize if:
      // 1. The Yjs document is empty
      // 2. We haven't already initialized
      // 3. We are the first user (to prevent duplication when joining existing sessions)
      if (
        sharedType &&
        sharedType.length === 0 &&
        !initializedRef.current &&
        isFirstUser
      ) {
        console.log(
          "First user with empty Yjs document, initializing with content"
        );
        initializedRef.current = true;
        Transforms.insertNodes(e, initialContent, { at: [0] });
      } else if (!isFirstUser && sharedType && sharedType.length === 0) {
        console.log("Not first user, waiting for content from other clients");
      }
    };
    console.log("Collaborative editor created successfully");
    return e;
  }, [sharedType, provider, username, initialContent, isFirstUser]);

  // Connect/disconnect YjsEditor
  useEffect(() => {
    if (sharedType && editor && !YjsEditor.connected(editor as any)) {
      console.log("Connecting YjsEditor to document");
      YjsEditor.connect(editor as any);

      // Listen for Yjs document updates
      const onYjsUpdate = () => {
        // After Yjs updates, we've definitely initialized
        initializedRef.current = true;
      };

      if (sharedType.observeDeep) {
        sharedType.observeDeep(onYjsUpdate);
      }

      return () => {
        console.log("Disconnecting YjsEditor from document");
        if (sharedType.unobserveDeep) {
          sharedType.unobserveDeep(onYjsUpdate);
        }
        YjsEditor.disconnect(editor as any);
      };
    }
  }, [editor, sharedType]);
  // Define element and leaf rendering functions
  const renderElement = useCallback((props: RenderElementProps) => {
    const element = props.element as any;
    switch (element.type) {
      case "code":
        return <CodeElement {...props} />;
      default:
        return <DefaultElement {...props} />;
    }
  }, []);

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    return <Leaf {...props} />;
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
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
    },
    [editor]
  );
  const handleChange = useCallback(
    (value: Descendant[]) => {
      // Always update our ref with the latest value
      currentEditorValue.current = value;

      if (onSave) {
        // Check if this is an actual content change, not just a selection change
        const isAstChange = editor.operations.some(
          (op) => "set_selection" !== op.type
        );

        console.log("Slate onChange triggered:", {
          isAstChange,
          operationsCount: editor.operations.length,
          operations: editor.operations.map((op) => op.type),
          valueLength: value.length,
        });

        if (isAstChange) {
          // For collaborative editing, we should save all local changes
          // The YJS layer will handle merging and conflict resolution
          // We use a short debounce to batch rapid typing while maintaining real-time feel
          console.log("Content change detected, triggering save...");
          onSave(value);
        } else {
          console.log("Selection-only change, skipping save");
        }
      }
    },
    [editor, onSave]
  );

  // Use an empty initial value for collaborative editing
  // Yjs will properly sync content after connection
  const slateInitialValue = useMemo(() => {
    if (sharedType && provider) {
      return [{ children: [{ text: "" }] }];
    }
    return initialContent;
  }, [sharedType, provider, initialContent]);

  return (
    <Slate
      editor={editor}
      initialValue={slateInitialValue}
      onChange={handleChange}
    >
      <Cursors>
        <Editable
          className={className}
          style={style}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={handleKeyDown}
        />
      </Cursors>
    </Slate>
  );
}
