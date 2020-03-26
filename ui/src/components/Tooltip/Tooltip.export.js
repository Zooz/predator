import React, { useState } from 'react'
import PropTypes from 'prop-types'
import style from './Tooltip.scss'
import Popover from '../Popover/Popover.export'
import TooltipContent from './TooltipContent'

const POPOVER_OFFSET = 8

const Tooltip = ({ placement, children, content, pointerEvents, disabled }) => {
  const [isOpened, setIsOpened] = useState(false)

  return (
    <div
      className={style.tooltip}
      onMouseLeave={() => setIsOpened(false)}
      onMouseEnter={() => setIsOpened(true)}
    >
      {disabled
        ? children
        : (
          <Popover
            placement={placement}
            pointerEvents={pointerEvents}
            content={<TooltipContent>{content}</TooltipContent>}
            offset={POPOVER_OFFSET}
            isOpened={isOpened}
          >
            {children}
          </Popover>
        )}
    </div>
  )
}

Tooltip.Placements = Popover.Placements

Tooltip.propTypes = {
  placement: PropTypes.oneOf(Object.values(Tooltip.Placements)),
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.string]).isRequired,
  content: PropTypes.oneOfType([PropTypes.element, PropTypes.string]).isRequired,
  disabled: PropTypes.bool,
  pointerEvents: PropTypes.bool
}

Tooltip.defaultProps = {
  placement: Tooltip.Placements.TopCenter,
  pointerEvents: true,
  disabled: false
}

export default Tooltip
