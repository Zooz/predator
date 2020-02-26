import React from 'react'
import ReactDOM from 'react-dom'
import ReactResizeDetector from 'react-resize-detector'
import { Manager, Reference, Popper } from 'react-popper'
import classnames from 'classnames'
import { FadingTransition } from './transitions/Transitions'
import Placements from './PopoverPlacements.export'
import Arrow from './components/Arrow'
import * as PopperJS from 'popper.js'
import css from './Popover.scss'

const modifiers: PopperJS.Modifiers = {
  preventOverflow: {
    boundariesElement: 'window',
    escapeWithReference: false
  }
}

export interface PopoverProps {
  placement?: Placements,
  content: JSX.Element | string,
  children: JSX.Element,
  offset?: number,
  isOpened?: boolean,
  eventsEnabled?: boolean,
  pointerEvents?: boolean
}

export interface PopoverComponent<P> extends React.FC<P> {
  Placements: typeof Placements
}

const Popover: PopoverComponent<PopoverProps> = ({
  children,
  content,
  placement = Placements.TopCenter,
  offset = 0,
  isOpened = true,
  eventsEnabled = true,
  pointerEvents = true
}: PopoverProps) => (
  <Manager>
    <Reference>
      {({ ref }) => (
        <div ref={ref} data-test='target' className={css.target}>
          {children}
        </div>
      )}
    </Reference>

    {ReactDOM.createPortal(
      <FadingTransition isOpened={isOpened}>
        <Popper placement={placement} eventsEnabled={eventsEnabled} modifiers={modifiers} positionFixed>
          {({ ref, style, placement, arrowProps, scheduleUpdate }) => {
            const popperStyle = Object.assign({}, style, { '--popper-offset': `${offset}px` })

            return (
              <div
                onClick={(e) => e.stopPropagation()}
                ref={ref}
                data-test='popper-ref'
                className={classnames(css['ref-wrapper'], { [css['ref-wrapper--pointerEvents']]: pointerEvents })}
                style={popperStyle}
              >
                <div data-placement={placement} className={css.popper}>
                  <ReactResizeDetector handleWidth handleHeight onResize={scheduleUpdate}>
                    <div className={css.popper__content} data-test='popover-content'>
                      {content}
                    </div>
                  </ReactResizeDetector>
                  <Arrow placement={placement} arrowProps={arrowProps} />
                </div>
              </div>
            )
          }}
        </Popper>
      </FadingTransition>
      , document.querySelector('body'))}

  </Manager>
)

Popover.Placements = Placements
export default Popover
