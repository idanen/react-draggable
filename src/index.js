import React from 'react';
import { render } from 'react-dom';
import { useDraggable } from './lib';

function App() {
  const { targetRef, handleRef, getTargetProps } = useDraggable({
    controlStyle: true,
    viewport: true
  });
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        width: 640,
        height: 320,
        margin: '18px auto',
        backgroundColor: 'hotpink'
      }}
      ref={targetRef}
      {...getTargetProps()}
    >
      <button ref={handleRef}>Grab me</button>
    </div>
  );
}

render(<App />, document.getElementById('root'));
