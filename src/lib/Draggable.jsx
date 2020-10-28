/* eslint-disable id-length */
import { useEffect, useRef, useState, useCallback } from 'react';
import { func, bool, shape, number } from 'prop-types';

export function Draggable({ children, ...rest }) {
  return children(useDraggable(rest));
}

export function useDraggable({
  controlStyle,
  viewport = false,
  rectLimits
} = {}) {
  const targetRef = useRef(null);
  const handleRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [prev, setPrev] = useState({ x: 0, y: 0 });
  const [delta, setDelta] = useState({ x: 0, y: 0 });
  const initial = useRef({ x: 0, y: 0 });
  const limits = useRef(null);

  useEffect(() => {
    const handle = handleRef.current || targetRef.current;
    handle.addEventListener('mousedown', startDragging);
    handle.addEventListener('touchstart', startDragging);

    return () => {
      handle.removeEventListener('mousedown', startDragging);
      handle.removeEventListener('touchstart', startDragging);
    };

    function startDragging(event) {
      event.preventDefault();
      setDragging(true);
      const source = (event.touches && event.touches[0]) || event;
      const { clientX, clientY } = source;
      initial.current = { x: clientX, y: clientY };
      if (controlStyle) {
        targetRef.current.style.willChange = 'transform';
      }
      if (viewport || rectLimits) {
        const {
          left,
          top,
          width,
          height
        } = targetRef.current.getBoundingClientRect();

        if (viewport) {
          limits.current = {
            minX: -left + delta.x,
            maxX: window.innerWidth - width - left + delta.x,
            minY: -top + delta.y,
            maxY: window.innerHeight - height - top + delta.y
          };
        } else {
          limits.current = {
            minX: rectLimits.left - left + delta.x,
            maxX: rectLimits.right - width - left + delta.x,
            minY: rectLimits.top - top + delta.y,
            maxY: rectLimits.bottom - height - top + delta.y
          };
        }
      }
    }
  }, [controlStyle, viewport, delta, rectLimits]);

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
      event.preventDefault();
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
      const x = clientX - initial.current.x + prev.x;
      const y = clientY - initial.current.y + prev.y;

      const newDelta = calcDelta({
        x,
        y,
        limits: limits.current
      });
      setDelta(newDelta);

      return newDelta;
    }
  }, [dragging, prev, controlStyle, viewport, rectLimits]);

  useEffect(() => {
    if (controlStyle) {
      targetRef.current.style.transform = `translate(${delta.x}px, ${delta.y}px)`;
    }
  }, [delta, controlStyle]);

  const getTargetProps = useCallback(
    () => ({
      'aria-grabbed': dragging || null
    }),
    [dragging]
  );

  const resetState = useCallback(() => {
    setDelta({ x: 0, y: 0 });
    setPrev({ x: 0, y: 0 });
  }, [setDelta, setPrev]);

  return { targetRef, handleRef, getTargetProps, dragging, delta, resetState };
}

function calcDelta({ x, y, limits }) {
  if (!limits) {
    return { x, y };
  }

  const { minX, maxX, minY, maxY } = limits;

  return {
    x: Math.min(Math.max(x, minX), maxX),
    y: Math.min(Math.max(y, minY), maxY)
  };
}

useDraggable.propTypes = {
  controlStyle: bool,
  rectLimits: shape({
    left: number,
    right: number,
    top: number,
    bottom: number
  }),
  viewport: bool
};

Draggable.propTypes = {
  ...useDraggable.propTypes,
  children: func.isRequired
};
