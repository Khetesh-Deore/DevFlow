import { useRef } from 'react';

export function VDivider({ onDrag, containerRef }) {
  const ref = useRef(null);

  const onPointerDown = (e) => {
    e.preventDefault();
    ref.current.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!ref.current.hasPointerCapture(e.pointerId)) return;
    const el = containerRef?.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.min(75, Math.max(20, ((e.clientX - rect.left) / rect.width) * 100));
    onDrag(pct);
  };

  const onPointerUp = (e) => {
    if (ref.current.hasPointerCapture(e.pointerId))
      ref.current.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="w-[5px] shrink-0 bg-gray-800 hover:bg-blue-500 active:bg-blue-500 cursor-col-resize transition-colors z-10 select-none"
    />
  );
}

export function HDivider({ onDrag, containerRef }) {
  const ref = useRef(null);

  const onPointerDown = (e) => {
    e.preventDefault();
    ref.current.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!ref.current.hasPointerCapture(e.pointerId)) return;
    const el = containerRef?.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.min(85, Math.max(15, ((e.clientY - rect.top) / rect.height) * 100));
    onDrag(pct);
  };

  const onPointerUp = (e) => {
    if (ref.current.hasPointerCapture(e.pointerId))
      ref.current.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="h-[5px] shrink-0 bg-gray-800 hover:bg-blue-500 active:bg-blue-500 cursor-row-resize transition-colors z-10 select-none"
    />
  );
}
