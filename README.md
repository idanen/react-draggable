# react-draggable

A custom hook to make elements draggable.

## Usage

Simplest usage:

```
import {} from 'react-draggable';

function MyComponent(props) {
  const { targetRef } = useDraggable({ controlStyle });

  return (
    <div ref={targetRef}>
      <h1>You can drag me :)</h1>
    </div>
  );
}
```
