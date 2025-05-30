/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

const CodeElement = (props: any) => (
  <pre
    {...props.attributes}
    style={{ backgroundColor: "#f4f4f4", padding: "8px" }}
  >
    <code>{props.children}</code>
  </pre>
);

export default CodeElement;
