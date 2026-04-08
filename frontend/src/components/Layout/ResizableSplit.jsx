import { useRef, useState, useCallback, useEffect } from 'react';

export default function ResizableSplit({ left, right, defaultLeftPct = 45, minPct = 20, maxPct = 80 }) {
  const containerRef = useRef(null);
  const [leftPct, setLeftPct] = useState(defaultLeftPct);
  const dragging = useRef(false);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(maxPct, Math.max(minPct, pct)));
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [minPct, maxPct]);

  return (
    <div ref={containerRef} className="flex flex-1 overflow-hidden h-full">
      {/* Left panel */}
      <div style={{ width: `${leftPct}%` }} className="flex flex-col overflow-hidden">
        {left}
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={onMouseDown}
        className="w-1 shrink-0 bg-gray-800 hover:bg-blue-500 active:bg-blue-500 cursor-col-resize transition-colors relative group"
        title="Drag to resize"
      >
        {/* Visual grip dots */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {[0,1,2].map(i => (
            <div key={i} className="w-1 h-1 rounded-full bg-blue-400" />
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: `${100 - leftPct}%` }} className="flex flex-col overflow-hidden">
        {right}
      </div>
    </div>
  );
}
