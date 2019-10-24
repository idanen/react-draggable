/* eslint-disable id-length, no-unused-expressions */
import React from 'react';
import { expect } from 'chai';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { useDraggable } from './Draggable';

describe('draggable', () => {
  const defaultStyle = { position: 'fixed', top: '11px', left: '11px' };
  let utils;

  beforeEach(() => {
    utils = setup();
  });

  afterEach(cleanup);

  it('should supply proper props to target', () => {
    expect(utils.container.querySelector('[aria-grabbed]')).not.to.be.ok;
  });

  describe('starting drag', () => {
    it('should supply proper props to target', () => {
      const { getByText, container } = utils;

      fireEvent.mouseDown(getByText(/handle/));

      expect(container.querySelector('[aria-grabbed]')).to.be.ok;
    });

    it('should return a delta position', () => {
      const startAt = { clientX: 10, clientY: 10 };
      const delta = { x: 5, y: 5 };
      const { drag, getByText } = utils;

      drag({ start: startAt, delta });

      expect(getByText(`${delta.x}, ${delta.y}`)).to.be.ok;
    });

    it('should return a correct delta position after more drag', () => {
      const startAt = { clientX: 10, clientY: 10 };
      const delta = { x: 5, y: 5 };
      const secondStart = {
        clientX: startAt.clientX + delta.x,
        clientY: startAt.clientY + delta.y
      };
      const { drag, getByText } = utils;

      drag({ start: startAt, delta });
      drag({
        start: secondStart,
        delta
      });

      expect(getByText(`${2 * delta.x}, ${2 * delta.y}`)).to.be.ok;
    });

    describe('decorate with styles', () => {
      beforeEach(() => {
        cleanup();
        utils = setup({ controlStyle: true });
      });

      it("should change target's style when dragging", () => {
        const { getByTestId, drag } = utils;

        drag({
          start: { clientX: 3, clientY: 3 },
          delta: { x: 10, y: 15 }
        });

        expect(getByTestId('main').style.transform).to.equal(
          `translate(10px, 15px)`
        );
      });

      it("should change target's style when dragging (touches)", () => {
        const { getByTestId, drag } = utils;

        drag({
          start: { clientX: 3, clientY: 3 },
          delta: { x: 10, y: 15 },
          touch: true
        });

        expect(getByTestId('main').style.transform).to.equal(
          `translate(10px, 15px)`
        );
      });

      it('should set proper cursor', () => {
        expect(utils.getByText(/handle/i).style.cursor).to.equal('grab');
      });

      it('should change cursor while dragging', () => {
        const { getByText } = utils;
        fireEvent.mouseDown(getByText(/handle/i));

        expect(getByText(/handle/i).style.cursor).to.equal('grabbing');
      });

      it('should add `will-change: transform` to target', () => {
        const { getByText, getByTestId } = utils;

        fireEvent.mouseDown(getByText(/handle/));

        expect(getByTestId('main').style.willChange).to.equal('transform');
      });

      it('should remove `will-change: transform` from target', () => {
        const { getByTestId, drag } = utils;

        drag({
          start: { clientX: 3, clientY: 3 },
          delta: { x: 10, y: 15 }
        });

        expect(getByTestId('main').style.willChange).to.equal('');
      });
    });

    describe('ending drag', () => {
      it('should supply proper props to target', () => {
        const { drag, container } = utils;

        drag();

        expect(container.querySelector('[aria-grabbed]')).not.to.be.ok;
      });
    });

    describe('limit in viewport', () => {
      beforeEach(() => {
        cleanup();
        utils = setup({
          controlStyle: true,
          viewport: true,
          style: {
            ...defaultStyle,
            width: '180px',
            left: 'auto',
            right: '0'
          }
        });
      });

      it('should not change transition beyond given rect', () => {
        const { drag, getByTestId } = utils;
        const targetElement = getByTestId('main');
        const rect = targetElement.getBoundingClientRect();
        const startAt = { clientX: rect.left + 5, clientY: rect.top + 5 };
        const delta = { x: 5, y: 5 };

        drag({ start: startAt, delta });

        expect(targetElement.style.transform).to.include(`translate(0px, 5px)`);
      });

      it('should leave transition as it was before limit', () => {
        const { getByTestId, beginDrag, move } = utils;
        const targetElement = getByTestId('main');
        targetElement.style.right = '50px';
        const rect = targetElement.getBoundingClientRect();

        const startAt = { clientX: rect.left + 5, clientY: rect.top + 5 };
        const delta = { x: 5, y: 1 };

        beginDrag(startAt);
        move({
          clientX: startAt.clientX + delta.x,
          clientY: startAt.clientY + delta.y
        });
        move({
          clientX: startAt.clientX + delta.x + 10,
          clientY: startAt.clientY + delta.y
        });
        move({
          clientX: startAt.clientX + delta.x + 25,
          clientY: startAt.clientY + delta.y
        });
        move({
          clientX: startAt.clientX + delta.x + 50,
          clientY: startAt.clientY + delta.y
        });

        const { left, width } = targetElement.getBoundingClientRect();
        expect(left).to.equal(window.innerWidth - width);
      });

      it('should keep limits when dragging more than once', () => {
        const { drag, getByTestId } = utils;
        const targetElement = getByTestId('main');
        targetElement.style.right = '50px';
        const rect = targetElement.getBoundingClientRect();

        const startAt = { clientX: rect.left + 5, clientY: rect.top + 5 };
        const delta = { x: 15, y: 1 };

        drag({ start: startAt, delta });
        drag({
          start: {
            clientX: startAt.clientX + delta.x,
            clientY: startAt.clientY + delta.y
          },
          delta: { x: 50, y: 0 }
        });

        const { left, width } = targetElement.getBoundingClientRect();
        expect(left).to.equal(window.innerWidth - width);
      });
    });

    describe('limit in rect', () => {
      const limits = {
        left: 11,
        right: window.innerWidth - 11,
        top: 5,
        bottom: window.innerHeight - 13
      };

      beforeEach(() => {
        cleanup();
        utils = setup({
          controlStyle: true,
          rectLimits: limits,
          style: {
            ...defaultStyle,
            width: '180px',
            left: '20px'
          }
        });
      });

      it('should not change transition beyond given rect', () => {
        const { drag, getByTestId } = utils;
        const targetElement = getByTestId('main');
        const rect = targetElement.getBoundingClientRect();
        const startAt = { clientX: rect.left + 5, clientY: rect.top + 5 };
        const delta = { x: -50, y: -90 };

        drag({ start: startAt, delta });

        expect(targetElement.getBoundingClientRect()).to.include({
          left: limits.left,
          top: limits.top
        });
      });

      it('should keep limits when dragging more than once', () => {
        const { drag, getByTestId } = utils;
        const targetElement = getByTestId('main');
        targetElement.style.right = '50px';
        targetElement.style.left = 'auto';
        const rect = targetElement.getBoundingClientRect();

        const startAt = { clientX: rect.left + 5, clientY: rect.top + 5 };
        const delta = { x: 15, y: 1 };

        drag({ start: startAt, delta });
        drag({
          start: {
            clientX: startAt.clientX + delta.x,
            clientY: startAt.clientY + delta.y
          },
          delta: { x: 50, y: 0 }
        });

        const { left, width } = targetElement.getBoundingClientRect();
        expect(left).to.equal(limits.right - width);
      });
    });
  });

  function Consumer(props) {
    const {
      targetRef,
      handleRef,
      getTargetProps,
      delta,
      dragging
    } = useDraggable(props);
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
      </main>
    );
  }

  function setup(props = {}) {
    const getters = render(<Consumer {...props} />);

    function drag({
      start = { clientX: 0, clientY: 0 },
      delta = { x: 0, y: 0 },
      touch = false
    } = {}) {
      beginDrag(start, touch);
      move(
        {
          clientX: start.clientX + delta.x,
          clientY: start.clientY + delta.y
        },
        touch
      );
      endDrag(
        {
          clientX: start.clientX + delta.x,
          clientY: start.clientY + delta.y
        },
        touch
      );
    }

    function beginDrag(start, touch = false) {
      const target = getters.getByText(/handle/);
      if (touch) {
        fireEvent.touchStart(target, {
          touches: [createTouch({ target, ...start })]
        });
      } else {
        fireEvent.mouseDown(target, start);
      }
    }

    function move(to, touch) {
      const target = getters.getByText(/handle/);
      if (touch) {
        fireEvent.touchMove(target, {
          touches: [
            createTouch({
              target,
              ...to
            })
          ]
        });
      } else {
        fireEvent.mouseMove(target, to);
      }
    }

    function endDrag(end, touch) {
      const target = getters.getByText(/handle/);
      if (touch) {
        fireEvent.touchEnd(getters.getByText(/handle/), {
          changedTouches: [
            createTouch({
              target,
              ...end
            })
          ]
        });
      } else {
        fireEvent.mouseUp(getters.getByText(/handle/), end);
      }
    }

    return {
      ...getters,
      beginDrag,
      move,
      drag
    };
  }
});

function createTouch({ target, ...rest }) {
  return new Touch({ identifier: Date.now(), target, ...rest });
}
