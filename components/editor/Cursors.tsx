/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { useRemoteCursorOverlayPositions } from "@slate-yjs/react";

type SelectionProps = {
  data: any;
  selectionRects: Array<Record<string, any>>;
  caretPosition: Record<string, any> | null;
};

function Selection({ data, selectionRects, caretPosition }: SelectionProps) {
  if (!data) {
    return null;
  }

  const selectionStyle = {
    backgroundColor: data.color,
  };

  return (
    <>
      {selectionRects.map((position, i) => (
        <div
          style={{ ...selectionStyle, ...position }}
          className="selection"
          key={i}
        />
      ))}
      {caretPosition && <Caret caretPosition={caretPosition} data={data} />}
    </>
  );
}

type CaretProps = {
  caretPosition: Record<string, any>;
  data: any;
};

function Caret({ caretPosition, data }: CaretProps) {
  const caretStyle = {
    ...caretPosition,
    background: data.color,
  };

  const labelStyle = {
    transform: "translateY(-100%)",
    background: data.color,
  };

  return (
    <div style={caretStyle} className="caretMarker">
      <div className="caret" style={labelStyle}>
        {data.name}
      </div>
    </div>
  );
}

const Cursors: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const containerRef = React.useRef<HTMLElement>(null);
  const [cursors] = useRemoteCursorOverlayPositions({
    containerRef: containerRef as React.RefObject<HTMLElement>,
  });

  return (
    <div className="cursors" ref={containerRef as any}>
      {children}
      {cursors.map((cursor) => (
        <Selection
          key={cursor.clientId}
          {...cursor}
          data={cursor.data ?? { color: "#ccc", name: "Unknown" }}
        />
      ))}
    </div>
  );
};

export default Cursors;
