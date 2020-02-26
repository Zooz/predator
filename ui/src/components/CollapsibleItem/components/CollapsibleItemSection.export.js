import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Tooltip from '../../Tooltip/Tooltip.export'
import Popover from '../../Popover/Popover.export'
import css from '../styles/Section.scss'

const { Placements: PopoverPlacements } = Popover

export default class Section extends Component {
  static propTypes = {
    icon: PropTypes.string,
    children: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
    className: PropTypes.string,
    borderLeft: PropTypes.bool,
    borderRight: PropTypes.bool,
    tooltip: PropTypes.oneOfType([PropTypes.element, PropTypes.string])
  }

  static defaultProps = {
    icon: undefined,
    text: undefined,
    className: '',
    borderLeft: false,
    borderRight: false,
    tooltip: undefined
  }

  render () {
    const { icon, children, className, borderRight, borderLeft, tooltip } = this.props
    const classes = `${css.section} ${className}`
    return icon || children !== undefined
      ? (
        <div
          className={css.sectionWrapper}
          data-border-right={String(borderRight)}
          data-border-left={String(borderLeft)}
        >
          <div className={css.sectionWrapper__content}>
            <Tooltip content={tooltip} placement={PopoverPlacements.TopCenter} disabled={!tooltip}>
              <div
                className={classes}
              >
                {icon && (<span className={`${css.icon} ${icon}`} />)}
                {children !== undefined && (<span className={css.text}>{children}</span>)}
              </div>
            </Tooltip>
          </div>
        </div>
      )
      : null
  }
}
