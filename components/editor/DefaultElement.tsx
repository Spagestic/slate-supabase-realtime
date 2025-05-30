/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

const DefaultElement = (props: any) => (
  <p {...props.attributes}>{props.children}</p>
);

export default DefaultElement;
