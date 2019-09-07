/* eslint-disable id-length */
import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

function Draggable({ children, ...rest }) {
  return children(useDraggable(rest));
}

Draggable.propTypes = {
  children: PropTypes.func.isRequired,
  controlStyle: PropTypes.bool
};

export default Draggable;

export function useDraggable({ controlStyle } = {}) {
  const targetRef = useRef(null);
  const handleRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [prev, setPrev] = useState({ x: 0, y: 0 });
  const [delta, setDelta] = useState({ x: 0, y: 0 });
  const initial = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handle = handleRef.current || targetRef.current;
    handle.addEventListener('mousedown', startDragging);
    handle.addEventListener('touchstart', startDragging);

    return () => {
      handle.removeEventListener('mousedown', startDragging);
      handle.removeEventListener('touchstart', startDragging);
    };

    function startDragging(event) {
      setDragging(true);
      const { clientX, clientY } = event;
      initial.current = { x: clientX, y: clientY };
    }
  }, [controlStyle]);

  useEffect(() => {
    const handle = handleRef.current || targetRef.current;
    if (dragging) {
      document.addEventListener('mousemove', reposition, { passive: true });
      document.addEventListener('touchmove', reposition, { passive: true });
      document.addEventListener('mouseup', stopDragging);
      document.addEventListener('touchend', stopDragging);
    } else {
      document.removeEventListener('mousemove', reposition, { passive: true });
      document.removeEventListener('mouseup', stopDragging);
      document.removeEventListener('touchmove', reposition, { passive: true });
      document.removeEventListener('touchend', stopDragging);
    }

    if (controlStyle) {
      handle.style.cursor = dragging ? 'grabbing' : 'grab';
    }

    return () => {
      if (controlStyle) {
        handle.style.cursor = '';
      }
      document.removeEventListener('mousemove', reposition, { passive: true });
      document.removeEventListener('mouseup', stopDragging);
      document.removeEventListener('touchmove', reposition, { passive: true });
      document.removeEventListener('touchend', stopDragging);
    };

    function stopDragging(event) {
      setDragging(null);
      reposition(event, true);
    }

    function reposition(event, finished) {
      const { clientX, clientY } = event;
      const calculatedX = clientX - initial.current.x;
      const calculatedY = clientY - initial.current.y;
      const newDelta = { x: calculatedX + prev.x, y: calculatedY + prev.y };
      setDelta(newDelta);
      if (finished) {
        setPrev(newDelta);
      }
    }
  }, [dragging, prev, controlStyle]);

  useEffect(() => {
    if (controlStyle) {
      targetRef.current.style.transform = `translate(${delta.x}px, ${delta.y}px)`;
    }
  }, [delta, controlStyle]);

  const getTargetProps = () => ({
    'aria-grabbed': dragging
  });

  return { targetRef, handleRef, getTargetProps, dragging, delta };
}
