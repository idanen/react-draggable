[![Travis (.org)](https://img.shields.io/travis/idanen/react-draggable)](https://travis-ci.org/idanen/react-draggable)
[![npm](https://img.shields.io/npm/v/use-draggable)](https://www.npmjs.com/package/use-draggable?activeTab=versions)
[![npm](https://img.shields.io/npm/dm/use-draggable)](https://www.npmjs.com/package/use-draggable)
[![GitHub](https://img.shields.io/github/license/idanen/react-draggable)](https://github.com/idanen/react-draggable/blob/master/LICENSE)

# react-draggable

A custom hook to make elements draggable.

## Usage

### Simplest usage:

```javascript
import { useDraggable } from 'react-draggable';

function MyComponent(props) {
  const { targetRef } = useDraggable({ controlStyle });

  return (
    <div ref={targetRef}>
      <h1>You can drag me :)</h1>
    </div>
  );
}
```

### Usage in a class component:

```javascript
import React from 'react';
import { Draggable } from 'react-draggable';

class MyComponent extends React.Component {
  render() {
    return (
      <Draggable>
        {({ targetRef }) => (
          <div ref={targetRef}>
            <h1>You can drag me :)</h1>
          </div>
        )}
      </Draggable>
    );
  }
}
```
