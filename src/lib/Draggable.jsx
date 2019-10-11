/* eslint-disable id-length */
import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

export function Draggable({ children, ...rest }) {
  return children(useDraggable(rest));
}

Draggable.propTypes = {
  children: PropTypes.func.isRequired,
  controlStyle: PropTypes.bool,
  viewport: PropTypes.bool
};

export function useDraggable({ controlStyle, viewport } = {}) {
  const targetRef = useRef(null);
  const handleRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [prev, setPrev] = useState({ x: 0, y: 0 });
  const [delta, setDelta] = useState({ x: 0, y: 0 });
  const initial = useRef({ x: 0, y: 0 });
  const viewportLimits = useRef({});

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
      if (viewport) {
        const targetRectangle = targetRef.current.getBoundingClientRect();
        viewportLimits.current = {
          left: prev.x - targetRectangle.left,
          top: prev.y - targetRectangle.top,
          right:
            document.documentElement.clientWidth -
            targetRectangle.width -
            targetRectangle.left +
            prev.x,
          bottom:
            document.documentElement.clientHeight -
            targetRectangle.height -
            targetRectangle.top +
            prev.y
        };
      }
      const source = (event.touches && event.touches[0]) || event;
      const { clientX, clientY } = source;
      initial.current = { x: clientX, y: clientY };
      if (controlStyle) {
        targetRef.current.style.willChange = 'transform';
      }
    }
  }, [controlStyle, viewport, prev]);

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
      setDragging(false);
      const newDelta = reposition(event);
      setPrev(newDelta);
      if (controlStyle) {
        targetRef.current.style.willChange = '';
      }
    }

    function reposition(event) {
      const source =
        (event.changedTouches && event.changedTouches[0]) ||
        (event.touches && event.touches[0]) ||
        event;
      const { clientX, clientY } = source;

      const calculatedX = clientX - initial.current.x;
      const calculatedY = clientY - initial.current.y;

      let newXPosition = calculatedX + prev.x;
      let newYPosition = calculatedY + prev.y;
      if (viewport) {
        newXPosition = Math.max(
          viewportLimits.current.left,
          Math.min(newXPosition, viewportLimits.current.right)
        );
        newYPosition = Math.max(
          viewportLimits.current.top,
          Math.min(newYPosition, viewportLimits.current.bottom)
        );
      }
      const newDelta = { x: newXPosition, y: newYPosition };
      setDelta(newDelta);
      return newDelta;
    }
  }, [dragging, prev, controlStyle, viewport]);

  useEffect(() => {
    if (controlStyle) {
      targetRef.current.style.transform = `translate(${delta.x}px, ${delta.y}px)`;
    }
  }, [delta, controlStyle]);

  const getTargetProps = () => ({
    'aria-grabbed': dragging || null
  });

  return { targetRef, handleRef, getTargetProps, dragging, delta };
}
