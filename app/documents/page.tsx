import React from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import CreateDocumentBtn from "./components/create-document-btn";
import DeleteDocumentBtn from "./components/delete-document-btn";

export default async function page() {
  const supabase = await createClient();
  const { data: documents } = await supabase.from("document").select("*");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Documents</h1>
        <CreateDocumentBtn />
      </div>

      {documents?.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <p className="text-lg text-muted-foreground">No documents yet</p>
          <p className="mt-2 text-muted-foreground">
            Create a new document to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {documents?.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <Link
                href={`/documents/${doc.id}`}
                className="flex-1 p-5 flex flex-col justify-between"
              >
                <div>
                  <h2 className="font-semibold text-lg truncate">
                    {doc.title || "Untitled Document"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    ID: {doc.id.substring(0, 8)}...
                  </p>
                </div>
                {doc.updated_at && (
                  <div className="text-xs text-muted-foreground mt-4">
                    Last edited: {new Date(doc.updated_at).toLocaleString()}
                  </div>
                )}
              </Link>
              <div className="p-3 border-t flex justify-end">
                <DeleteDocumentBtn id={doc.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
