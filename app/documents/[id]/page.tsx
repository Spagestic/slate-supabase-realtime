import React from "react";
import SlateEditor from "./editor";

interface DocumentPageProps {
  params: {
    id: Promise<string>;
  };
}

export default async function page({ params }: DocumentPageProps) {
  const { id } = await params;
  return <div>{id && <SlateEditor id={id} />}</div>;
}
