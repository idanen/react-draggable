/* eslint-disable id-length, no-unused-expressions */
import React from 'react';
import { expect } from 'chai';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { useDraggable } from './Draggable';

describe('draggable', () => {
  let utils;

  beforeEach(() => {
    utils = setup();
  });

  afterEach(() => {
    cleanup();
  });

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
  });

  function Consumer(props) {
    const {
      targetRef,
      handleRef,
      getTargetProps,
      delta,
      dragging
    } = useDraggable(props);
    return (
      <main
        className='container'
        ref={targetRef}
        data-testid='main'
        style={{ position: 'fixed', top: '11px', left: '11px' }}
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

  function setup(props) {
    const getters = render(<Consumer {...props} />);

    function drag({
      start = { clientX: 0, clientY: 0 },
      delta = { x: 0, y: 0 },
      touch = false
    } = {}) {
      if (touch) {
        const target = getters.getByText(/handle/);
        fireEvent.touchStart(target, {
          touches: [createTouch({ target, ...start })]
        });
        fireEvent.touchMove(target, {
          touches: [
            createTouch({
              target,
              clientX: start.clientX + delta.x,
              clientY: start.clientY + delta.y
            })
          ]
        });
        fireEvent.touchEnd(getters.getByText(/handle/), {
          changedTouches: [
            createTouch({
              target,
              clientX: start.clientX + delta.x,
              clientY: start.clientY + delta.y
            })
          ]
        });
      } else {
        fireEvent.mouseDown(getters.getByText(/handle/), start);
        fireEvent.mouseMove(getters.getByText(/handle/), {
          clientX: start.clientX + delta.x,
          clientY: start.clientY + delta.y
        });
        fireEvent.mouseUp(getters.getByText(/handle/), {
          clientX: start.clientX + delta.x,
          clientY: start.clientY + delta.y
        });
      }
    }

    return {
      ...getters,
      drag
    };
  }
});

function createTouch({ target, ...rest }) {
  return new Touch({ identifier: Date.now(), target, ...rest });
}
