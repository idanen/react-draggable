import React, { useRef, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useDraggable } from './lib';

function App() {
  const [rect, setRect] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const bounding = useRef(null);
  const { targetRef, handleRef, getTargetProps, delta } = useDraggable({
    controlStyle: true,
    rectLimits: rect,
  });

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const { top, left, width, height } =
        bounding.current.getBoundingClientRect();
      setRect({
        top,
        left,
        right: left + width,
        bottom: top + height,
      });
    });

    if (!bounding.current) {
      observer.disconnect();
      return;
    }

    observer.observe(bounding.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className='bounding'
      ref={bounding}
      style={{
        margin: '20px 0 0 20px',
        height: '80vh',
        width: '75vw',
        background: 'lavender',
        resize: 'both',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          userSelect: 'none',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'flex-end',
          width: 320,
          height: 180,
          margin: '18px auto',
          backgroundColor: 'hotpink',
        }}
        ref={targetRef}
        {...getTargetProps()}
      >
        <span style={{ color: 'white' }}>
          ({delta.x}, {delta.y})
        </span>
        <button ref={handleRef}>Grab me</button>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
