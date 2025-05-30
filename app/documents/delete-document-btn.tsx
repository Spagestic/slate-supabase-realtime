"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteDocumentBtn({ id }: { id: string }) {
  const supabase = createClient();
  const router = useRouter();
  const deleteDocument = async () => {
    const { error } = await supabase.from("document").delete().eq("id", id);
    if (error) {
      console.error("Error deleting document:", error);
      return;
    }
    router.push("/documents");
  };
  return (
    <Button
      className="px-4 py-2 bg-destructive rounded-md hover:bg-destructive/90 transition-colors "
      onClick={deleteDocument}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
