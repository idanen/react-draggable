import type { ComponentProps, CSSProperties } from 'react';
import { describe, beforeEach, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useDraggable, Draggable, type DraggableProps } from './';

describe('draggable', () => {
  const defaultStyle: CSSProperties = {
    position: 'fixed',
    top: '11px',
    left: '11px',
  };

  it('should supply proper props to target', () => {
    const { container } = render(<Consumer />);
    expect(container.querySelector('[aria-grabbed]')).not.toBeTruthy();
  });

  describe('starting drag', () => {
    it('should supply proper props to target', async () => {
      const { container } = render(<Consumer />);

      fireEvent.mouseDown(screen.getByText(/handle/));

      expect(container.querySelector('[aria-grabbed]')).toBeTruthy();
    });

    it('should return a delta position', async () => {
      const startAt = { clientX: 10, clientY: 10 };
      const delta = { x: 5, y: 5 };
      render(<Consumer />);

      drag({ start: startAt, delta });

      expect(screen.getByText(`${delta.x}, ${delta.y}`)).toBeVisible();
    });

    it('should return a correct delta position after more drag', () => {
      const startAt = { clientX: 10, clientY: 10 };
      const delta = { x: 5, y: 5 };
      const secondStart = {
        clientX: startAt.clientX + delta.x,
        clientY: startAt.clientY + delta.y,
      };
      render(<Consumer />);

      drag({ start: startAt, delta });
      drag({
        start: secondStart,
        delta,
      });

      expect(screen.getByText(`${2 * delta.x}, ${2 * delta.y}`)).toBeTruthy();
    });

    describe('decorate with styles', () => {
      it("should change target's style when dragging", () => {
        render(<Consumer controlStyle />);

        drag({
          start: { clientX: 3, clientY: 3 },
          delta: { x: 10, y: 15 },
        });

        expect(screen.getByTestId('main').style.transform).toEqual(
          `translate(10px, 15px)`
        );
      });

      it("should change target's style when dragging (touches)", () => {
        render(<Consumer controlStyle />);

        drag({
          start: { clientX: 3, clientY: 3 },
          delta: { x: 10, y: 15 },
          touch: true,
        });

        expect(screen.getByTestId('main').style.transform).toEqual(
          `translate(10px, 15px)`
        );
      });

      it('should set proper cursor', () => {
        render(<Consumer controlStyle />);
        expect(screen.getByText(/handle/i).style.cursor).toEqual('grab');
      });

      it('should change cursor while dragging', () => {
        render(<Consumer controlStyle />);
        fireEvent.mouseDown(screen.getByText(/handle/i));

        expect(screen.getByText(/handle/i).style.cursor).toEqual('grabbing');
      });

      it('should add `will-change: transform` to target', () => {
        render(<Consumer controlStyle />);

        fireEvent.mouseDown(screen.getByText(/handle/));

        expect(screen.getByTestId('main').style.willChange).toEqual(
          'transform'
        );
      });

      it('should remove `will-change: transform` from target', () => {
        render(<Consumer controlStyle />);

        drag({
          start: { clientX: 3, clientY: 3 },
          delta: { x: 10, y: 15 },
        });

        expect(screen.getByTestId('main').style.willChange).toEqual('');
      });
    });

    describe('ending drag', () => {
      it('should supply proper props to target', () => {
        const { container } = render(<Consumer controlStyle />);

        drag();

        expect(container.querySelector('[aria-grabbed]')).not.toBeTruthy();
      });
    });

    describe('limit in viewport', () => {
      const props = {
        controlStyle: true,
        viewport: true,
        style: {
          ...defaultStyle,
          width: '180px',
          left: 'auto',
          right: '0',
        },
      };
      beforeEach(() => {});

      it('should not change transition beyond given rect', () => {
        render(<Consumer {...props} />);
        const targetElement = screen.getByTestId('main');
        const rect = targetElement.getBoundingClientRect();
        const startAt = { clientX: rect.left + 5, clientY: rect.top + 5 };
        const delta = { x: 5, y: 5 };

        drag({ start: startAt, delta });

        expect(targetElement.style.transform).toContain(`translate(0px, 5px)`);
      });

      it('should leave transition as it was before limit', () => {
        render(<Consumer {...props} />);
        const targetElement = screen.getByTestId('main');
        targetElement.style.right = '50px';
        const rect = targetElement.getBoundingClientRect();

        const startAt = { clientX: rect.left + 5, clientY: rect.top + 5 };
        const delta = { x: 5, y: 1 };

        beginDrag(startAt);
        move({
          clientX: startAt.clientX + delta.x,
          clientY: startAt.clientY + delta.y,
        });
        move({
          clientX: startAt.clientX + delta.x + 10,
          clientY: startAt.clientY + delta.y,
        });
        move({
          clientX: startAt.clientX + delta.x + 25,
          clientY: startAt.clientY + delta.y,
        });
        move({
          clientX: startAt.clientX + delta.x + 50,
          clientY: startAt.clientY + delta.y,
        });

        const { left, width } = targetElement.getBoundingClientRect();
        expect(left).toEqual(window.innerWidth - width);
      });

      it('should keep limits when dragging more than once', () => {
        render(<Consumer {...props} />);
        const targetElement = screen.getByTestId('main');
        targetElement.style.right = '50px';
        const rect = targetElement.getBoundingClientRect();

        const startAt = { clientX: rect.left + 5, clientY: rect.top + 5 };
        const delta = { x: 15, y: 1 };

        drag({ start: startAt, delta });
        drag({
          start: {
            clientX: startAt.clientX + delta.x,
            clientY: startAt.clientY + delta.y,
          },
          delta: { x: 50, y: 0 },
        });

        const { left, width } = targetElement.getBoundingClientRect();
        expect(left).toEqual(window.innerWidth - width);
      });
    });

    describe('limit in rect', () => {
      const limits = {
        left: 11,
        right: window.innerWidth - 11,
        top: 5,
        bottom: window.innerHeight - 13,
      };
      const props = {
        controlStyle: true,
        rectLimits: limits,
        style: {
          ...defaultStyle,
          width: '180px',
          left: '20px',
        },
      };

      it('should not change transition beyond given rect', () => {
        render(<Consumer {...props} />);
        const targetElement = screen.getByTestId('main');
        const rect = targetElement.getBoundingClientRect();
        const startAt = { clientX: rect.left + 5, clientY: rect.top + 5 };
        const delta = { x: -50, y: -90 };

        drag({ start: startAt, delta });

        expect(targetElement.getBoundingClientRect()).toEqual(
          expect.objectContaining({
            left: limits.left,
            top: limits.top,
          })
        );
      });

      it('should keep limits when dragging more than once', () => {
        render(<Consumer {...props} />);
        const targetElement = screen.getByTestId('main');
        targetElement.style.right = '50px';
        targetElement.style.left = 'auto';
        const rect = targetElement.getBoundingClientRect();

        const startAt = { clientX: rect.left + 5, clientY: rect.top + 5 };
        const delta = { x: 15, y: 1 };

        drag({ start: startAt, delta });
        drag({
          start: {
            clientX: startAt.clientX + delta.x,
            clientY: startAt.clientY + delta.y,
          },
          delta: { x: 50, y: 0 },
        });

        const { left, width } = targetElement.getBoundingClientRect();
        expect(left).toEqual(limits.right - width);
      });
    });
  });

  describe('using children function', () => {
    it('should call the children function with correct props', () => {
      render(<ChildrenConsumer />);

      const delta = { x: 5, y: 5 };
      drag({ delta });

      expect(screen.getByTestId('main').style.transform).toEqual(
        `translate(${delta.x}px, ${delta.y}px)`
      );
    });
  });

  describe('reset drags', () => {
    it('should start dragging from the original position', () => {
      render(<Consumer controlStyle />);
      drag({ start: { clientX: 3, clientY: 5 }, delta: { x: 15, y: 20 } });
      fireEvent.click(screen.getByText(/reset/i));
      expect(screen.getByTestId('main').style.transform).toEqual(
        'translate(0px, 0px)'
      );
    });

    describe('after reset', () => {
      it('should start dragging from the original position', () => {
        render(<Consumer controlStyle />);
        drag({ start: { clientX: 3, clientY: 5 }, delta: { x: 15, y: 20 } });
        fireEvent.click(screen.getByText(/reset/i));
        drag({ start: { clientX: 3, clientY: 5 }, delta: { x: 15, y: 20 } });
        expect(screen.getByTestId('main').style.transform).toEqual(
          'translate(15px, 20px)'
        );
      });
    });
  });

  function Consumer(props: ComponentProps<'main'> & DraggableProps) {
    const {
      targetRef,
      handleRef,
      getTargetProps,
      resetState,
      delta,
      dragging,
    } = useDraggable<HTMLDivElement, HTMLButtonElement>(props);
    const { style = defaultStyle } = props;

    return (
      <main
        className='container'
        ref={targetRef}
        data-testid='main'
        style={style}
        {...getTargetProps()}
      >
        {dragging && <span>Dragging to:</span>}
        <output>
          {delta.x}, {delta.y}
        </output>
        <button className='handle' ref={handleRef}>
          handle
        </button>
        <button onClick={resetState}>reset</button>
      </main>
    );
  }

  function ChildrenConsumer() {
    return (
      <Draggable<HTMLDivElement, HTMLButtonElement> controlStyle viewport>
        {({ targetRef, handleRef, getTargetProps }) => (
          <main
            className='container'
            ref={targetRef}
            data-testid='main'
            style={defaultStyle}
            {...getTargetProps()}
          >
            <span>Dragging to:</span>
            <output>
              {0}, {0}
            </output>
            <button className='handle' ref={handleRef}>
              handle
            </button>
            <button onClick={() => {}}>reset</button>
          </main>
        )}
      </Draggable>
    );
  }
});

function drag({
  start = { clientX: 0, clientY: 0 },
  delta = { x: 0, y: 0 },
  touch = false,
} = {}) {
  beginDrag(start, touch);
  move(
    {
      clientX: start.clientX + delta.x,
      clientY: start.clientY + delta.y,
    },
    touch
  );
  endDrag(
    {
      clientX: start.clientX + delta.x,
      clientY: start.clientY + delta.y,
    },
    touch
  );
}

function beginDrag(start: TouchPosition, touch = false) {
  const target = screen.getByText(/handle/);
  if (touch) {
    fireEvent.touchStart(target, {
      touches: [createTouch({ ...start, target })],
    });
  } else {
    fireEvent.mouseDown(target, start);
  }
}

function move(to: TouchPosition, touch: boolean = false) {
  const target = screen.getByText(/handle/);
  if (touch) {
    fireEvent.touchMove(target, {
      touches: [
        createTouch({
          ...to,
          target,
        }),
      ],
    });
  } else {
    fireEvent.mouseMove(target, to);
  }
}

function endDrag(end: TouchPosition, touch: boolean) {
  const target = screen.getByText(/handle/);
  if (touch) {
    fireEvent.touchEnd(target, {
      changedTouches: [
        createTouch({
          ...end,
          target,
        }),
      ],
    });
  } else {
    fireEvent.mouseUp(target, end);
  }
}

function createTouch({
  target,
  ...rest
}: {
  target: EventTarget;
  clientX: number;
  clientY: number;
}) {
  return new Touch({ identifier: Date.now(), target, ...rest });
}

type TouchPosition = Pick<Touch, 'clientX' | 'clientY'>;
