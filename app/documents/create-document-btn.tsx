"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function CreateDocumentBtn() {
  const supabase = createClient();
  const router = useRouter();
  const createDocument = async () => {
    const { data, error } = await supabase
      .from("document")
      .insert({ title: "", content: JSON.stringify([]) })
      .select()
      .single();

    if (error) {
      console.error("Error creating document:", error);
      return;
    }
    router.push(`/documents/${data.id}`);
  };
  return (
    <Button
      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      onClick={createDocument}
    >
      Create New Document
    </Button>
  );
}
