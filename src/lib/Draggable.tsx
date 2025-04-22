import { useEffect, useRef, useState, useCallback } from 'react';

export type DraggableProps = {
  controlStyle?: boolean;
  viewport?: boolean;
  rectLimits?: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
};

export function Draggable<
  ElementType extends HTMLElement,
  HandleType extends HTMLElement
>({
  children,
  ...rest
}: DraggableProps & {
  children: (
    props: ReturnType<typeof useDraggable<ElementType, HandleType>>
  ) => React.ReactNode;
}) {
  return children(useDraggable<ElementType, HandleType>(rest));
}

type Limits = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export function useDraggable<
  TargetType extends HTMLElement,
  HandleType extends HTMLElement = HTMLElement
>({ controlStyle, viewport = false, rectLimits }: DraggableProps = {}) {
  const targetRef = useRef<TargetType | null>(null);
  const handleRef = useRef<HandleType | null>(null);
  const [dragging, setDragging] = useState(false);
  const [prev, setPrev] = useState({ x: 0, y: 0 });
  const [delta, setDelta] = useState({ x: 0, y: 0 });
  const initial = useRef({ x: 0, y: 0 });
  const limits = useRef<Limits | null>(null);

  useEffect(() => {
    const handle = handleRef.current || targetRef.current;
    if (!handle) {
      return;
    }

    handle.addEventListener('mousedown', startDragging);
    handle.addEventListener('touchstart', startDragging);

    return () => {
      handle.removeEventListener('mousedown', startDragging);
      handle.removeEventListener('touchstart', startDragging);
    };

    function startDragging(event: MouseEvent | TouchEvent) {
      event.preventDefault();
      if (!targetRef.current) {
        return;
      }

      setDragging(true);
      const source =
        ('touches' in event && event.touches?.[0]) || (event as MouseEvent);
      const { clientX, clientY } = source;
      initial.current = { x: clientX, y: clientY };
      if (controlStyle) {
        targetRef.current.style.willChange = 'transform';
      }
      if (viewport || rectLimits) {
        const { left, top, width, height } =
          targetRef.current.getBoundingClientRect();

        if (viewport) {
          limits.current = {
            minX: -left + delta.x,
            maxX: window.innerWidth - width - left + delta.x,
            minY: -top + delta.y,
            maxY: window.innerHeight - height - top + delta.y,
          };
        } else {
          limits.current = {
            minX: (rectLimits?.left ?? 0) - left + delta.x,
            maxX: (rectLimits?.right ?? 0) - width - left + delta.x,
            minY: (rectLimits?.top ?? 0) - top + delta.y,
            maxY: (rectLimits?.bottom ?? 0) - height - top + delta.y,
          };
        }
      }
    }
  }, [controlStyle, viewport, delta, rectLimits]);

  useEffect(() => {
    const handle = handleRef.current || targetRef.current;
    if (!handle) {
      return;
    }

    if (dragging) {
      document.addEventListener('mousemove', reposition, { passive: true });
      document.addEventListener('touchmove', reposition, { passive: true });
      document.addEventListener('mouseup', stopDragging);
      document.addEventListener('touchend', stopDragging);
    } else {
      document.removeEventListener('mousemove', reposition, {
        passive: true,
      } as EventListenerOptions);
      document.removeEventListener('mouseup', stopDragging);
      document.removeEventListener('touchmove', reposition, {
        passive: true,
      } as EventListenerOptions);
      document.removeEventListener('touchend', stopDragging);
    }

    if (controlStyle) {
      handle.style.cursor = dragging ? 'grabbing' : 'grab';
    }

    return () => {
      if (controlStyle) {
        handle.style.cursor = '';
      }
      document.removeEventListener('mousemove', reposition, {
        passive: true,
      } as EventListenerOptions);
      document.removeEventListener('mouseup', stopDragging);
      document.removeEventListener('touchmove', reposition, {
        passive: true,
      } as EventListenerOptions);
      document.removeEventListener('touchend', stopDragging);
    };

    function stopDragging(event: MouseEvent | TouchEvent) {
      event.preventDefault();
      setDragging(false);
      const newDelta = reposition(event);
      setPrev(newDelta);
      if (controlStyle && targetRef.current) {
        targetRef.current.style.willChange = '';
      }
    }

    function reposition(event: MouseEvent | TouchEvent) {
      const source =
        ('changedTouches' in event && event.changedTouches?.[0]) ||
        ('touches' in event && event.touches?.[0]) ||
        (event as MouseEvent);
      const { clientX, clientY } = source;
      const x = clientX - initial.current.x + prev.x;
      const y = clientY - initial.current.y + prev.y;

      const newDelta = calcDelta({
        x,
        y,
        limits: limits.current,
      });
      setDelta(newDelta);

      return newDelta;
    }
  }, [dragging, prev, controlStyle, viewport, rectLimits]);

  useEffect(() => {
    if (controlStyle && targetRef.current) {
      targetRef.current.style.transform = `translate(${delta.x}px, ${delta.y}px)`;
    }
  }, [delta, controlStyle]);

  const getTargetProps = useCallback(
    () => ({
      'aria-grabbed': dragging || undefined,
    }),
    [dragging]
  );

  const resetState = useCallback(() => {
    setDelta({ x: 0, y: 0 });
    setPrev({ x: 0, y: 0 });
  }, [setDelta, setPrev]);

  return { targetRef, handleRef, getTargetProps, dragging, delta, resetState };
}

function calcDelta({
  x,
  y,
  limits,
}: {
  x: number;
  y: number;
  limits: Limits | null;
}) {
  if (!limits) {
    return { x, y };
  }

  const { minX, maxX, minY, maxY } = limits;

  return {
    x: Math.min(Math.max(x, minX), maxX),
    y: Math.min(Math.max(y, minY), maxY),
  };
}
