import React from "react";
import SlateEditor from "./editor";
import { createClient } from "@/lib/supabase/server";

interface DocumentPageProps {
  params: {
    id: Promise<string>;
  };
}

export default async function page({ params }: DocumentPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: document, error } = await supabase
    .from("document")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    console.error("Error fetching document:", error);
    return <div>Error loading document</div>;
  }
  return (
    <div>
      {document && <SlateEditor id={document.id} content={document?.content} />}
    </div>
  );
}
