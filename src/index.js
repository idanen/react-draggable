import React, { useRef, useEffect, useState } from 'react';
import { render } from 'react-dom';
import { useDraggable } from './lib';

function App() {
  const [rect, setRect] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const bounding = useRef(null);
  const { targetRef, handleRef, getTargetProps, delta } = useDraggable({
    controlStyle: true,
    rectLimits: rect
  });

  useEffect(() => {
    const {
      top,
      left,
      right,
      bottom
    } = bounding.current.getBoundingClientRect();
    setRect({
      top,
      left,
      right,
      bottom
    });
  }, []);

  return (
    <div
      className='bounding'
      ref={bounding}
      style={{
        margin: '20px 0 0 20px',
        padding: '200px',
        height: '80vh',
        width: '75vw',
        background: 'lavender'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'flex-end',
          width: 320,
          height: 180,
          margin: '18px auto',
          backgroundColor: 'hotpink'
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

render(<App />, document.getElementById('root'));
