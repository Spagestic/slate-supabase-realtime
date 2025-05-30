/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

const Leaf = (props: any) => (
  <span
    {...props.attributes}
    style={{ fontWeight: props.leaf.bold ? "bold" : "normal" }}
  >
    {props.children}
  </span>
);

export default Leaf;
