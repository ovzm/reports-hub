import { useCallback, useEffect, useRef, useState } from "react";

const MIN = 0.5;
const MAX = 3;
const STEP = 0.15;

const clamp = value => Math.min(MAX, Math.max(MIN, value));

export function useZoomPan() {
  const [zoom, setZoomState] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const start = useRef(null);

  const setZoom = useCallback(value => {
    setZoomState(current => {
      const next = clamp(typeof value === "function" ? value(current) : value);
      if (next <= 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const zoomIn = useCallback(() => setZoom(z => z + STEP), [setZoom]);
  const zoomOut = useCallback(() => setZoom(z => z - STEP), [setZoom]);
  const reset = useCallback(() => setZoom(1), [setZoom]);

  useEffect(() => {
    function onKey(event) {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
      if (event.key === "+" || event.key === "=") zoomIn();
      if (event.key === "-") zoomOut();
      if (event.key === "0") reset();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomIn, zoomOut, reset]);

  useEffect(() => {
    if (!dragging) return;
    function onMove(event) {
      setOffset({ x: event.clientX - start.current.x, y: event.clientY - start.current.y });
    }
    function onUp() {
      setDragging(false);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  const onMouseDown = useCallback(
    event => {
      if (zoom <= 1) return;
      event.preventDefault();
      start.current = { x: event.clientX - offset.x, y: event.clientY - offset.y };
      setDragging(true);
    },
    [zoom, offset]
  );

  return {
    zoom,
    zoomIn,
    zoomOut,
    reset,
    locked: zoom > 1,
    stageProps: {
      onMouseDown,
      style: {
        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
        cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default"
      }
    }
  };
}
