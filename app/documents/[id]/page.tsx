import React from "react";
import { SlateEditor } from "./editor";
import { createClient } from "@/lib/supabase/server";

interface DocumentPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function page({ params }: DocumentPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: document, error } = await supabase
    .from("document")
    .select("id, content, title")
    .eq("id", id)
    .single();
  if (error) {
    console.error("Error fetching document:", error);
    return <div>Error loading document</div>;
  }

  return <SlateEditor id={id} content={document.content} />;
}
