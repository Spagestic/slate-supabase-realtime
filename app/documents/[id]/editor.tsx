"use client";

import "@/app/styles.css";
import React from "react";
import { Descendant } from "slate";
import { useCollaboration } from "@/hooks/use-collaboration";
import { CollaborativeEditor } from "@/components/editor/CollaborativeEditor";
import initialValue from "@/lib/editor/initialValue";

export function SlateEditor({
  id,
  content,
}: {
  id: string;
  content: string | Descendant[] | null;
}) {
  const documentId = id;

  // Parse content if it's a string (from JSON in database)
  const initialContent = React.useMemo(() => {
    if (!content) return initialValue;
    if (typeof content === "string") {
      try {
        return JSON.parse(content) as Descendant[];
      } catch (e) {
        console.error("Failed to parse document content:", e);
        return initialValue;
      }
    }
    return content;
  }, [content]);

  // Use the collaboration hook with database saving enabled
  const collaboration = useCollaboration({
    documentId,
    enableDatabaseSaving: true,
  });

  // If content is null or undefined, don't display the editor
  if (!content) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-900 text-white">
        <div>Loading document...</div>
      </div>
    );
  }

  // Show loading state while connecting
  if (
    !collaboration.connected ||
    !collaboration.sharedType ||
    !collaboration.provider
  ) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-900 text-white">
        <div>Loading collaborative editor...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-white antialiased">
      {/* Header with active users */}
      <div className="flex gap-2 flex-wrap absolute top-4 right-4 z-10">
        {collaboration.activeUsers.map((user, index) => (
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
            <CollaborativeEditor
              sharedType={collaboration.sharedType}
              provider={collaboration.provider}
              username={collaboration.username}
              initialContent={initialContent}
              onSave={collaboration.saveDocument}
              isFirstUser={collaboration.isFirstUser}
              className="min-h-full p-4 focus:outline-none text-neutral-200"
              style={{
                fontSize: "16px",
                fontFamily: "'Inter', sans-serif",
                lineHeight: "1.6",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
