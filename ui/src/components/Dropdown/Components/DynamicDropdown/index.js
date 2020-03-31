import React from 'react'
import PropTypes from 'prop-types'
import { Manager, Reference, Popper } from 'react-popper'
import ClickOutHandler from 'react-onclickout'
import classnames from 'classnames'

import style from './DynamicDropdown.scss'

const DynamicDropdown = ({ inputComponent, listOptionsComponent, isListOpen, onListClose }) => {
  return (
    <Manager>
      <Reference>
        {({ ref }) => (
          <div ref={ref} data-test='target'>

            {/* Selected-Options-Input */}
            {inputComponent}

            {/* Options-List */}
            {isListOpen && (
              <ClickOutHandler onClickOut={onListClose}>
                <Popper
                  modifiers={{ preventOverflow: { enabled: false } }}
                  outOfBoundaries placement='bottom-start' eventsEnabled
                >
                  {({ ref, style: popperStyle }) => (
                    <div ref={ref} className={classnames(style['popper-ref'])} style={popperStyle}>
                      {listOptionsComponent}
                    </div>
                  )}
                </Popper>
              </ClickOutHandler>
            )}

          </div>
        )}
      </Reference>
    </Manager>
  )
}

DynamicDropdown.propTypes = {
  inputComponent: PropTypes.element,
  listOptionsComponent: PropTypes.element,
  isListOpen: PropTypes.bool,
  onListClose: PropTypes.func
}
export default DynamicDropdown
