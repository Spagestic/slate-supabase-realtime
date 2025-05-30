"use client";

import "./styles.css";
import React from "react";
import Link from "next/link";
import { useCollaboration } from "@/hooks/use-collaboration";
import { CollaborativeEditor } from "@/components/editor/CollaborativeEditor";

export default function SlateEditorPage() {
  const { connected, activeUsers, sharedType, provider, username } =
    useCollaboration();

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
            <CollaborativeEditor
              sharedType={sharedType}
              provider={provider}
              username={username}
            />
          </div>
        </div>
      </div>

      <footer className="">
        <p className="text-muted-foreground text-xs text-center py-4">
          This is a temporary collaborative editor, please be aware that your
          changes may not be saved. For persistent storage, please visit{" "}
          <Link href="/documents" className="text-blue-500 hover:underline">
            here
          </Link>
        </p>
      </footer>
    </div>
  );
}
