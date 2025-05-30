/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useEffect, useCallback } from "react";
import { createEditor, Editor, Transforms } from "slate";
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
}: CollaborativeEditorProps) {
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
    );

    // Ensure editor always has at least 1 valid child
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

  return (
    <Slate editor={editor} initialValue={initialValue}>
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

export default CollaborativeEditor;
