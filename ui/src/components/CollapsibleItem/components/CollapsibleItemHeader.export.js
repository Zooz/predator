import React, { Component, cloneElement } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import _ from 'lodash'

import css from '../styles/Header.scss'

class Header extends Component {
    getToggle = () => {
      const { expanded, disabled, toggleable } = this.props
      const classes = classnames({
        fa: true,
        'fa-chevron-down': true,
        [css.headerToggle]: true,
        [css.disabled]: disabled
      })
      return toggleable &&
        <div className={css.toggleWrapper}>
          <div disabled={disabled} rotate={String(expanded)} className={classes} />
        </div>
    };

    getIcon = () => {
      const { icon, disabled } = this.props;
      if (!icon) {
        return;
      }
      let result = icon;
      if (!Array.isArray(icon)) {
        result = [icon];
      }

      return result.map((icon, index) => {
        const isString = typeof icon === 'string';
        const classes = classnames({
          [css.headerIcon]: true,
          [icon]: isString,
          [css.disabled]: disabled
        });
        const result = isString ? <div className={classes} /> : <div className={classes}>{icon}</div>;

        return (
          <div key={index} style={{ width: '28px', display: 'flex', alignItems: 'center' }}>{result}</div>
        )
      })
    };

    getSections = () => {
      const { sections, disabled } = this.props
      const classes = disabled ? css.disabled : ''

      if (!sections) {
        return null
      } else if (Array.isArray(sections)) {
        return sections.map(section => {
          return cloneElement(section, { className: classes })
        })
      } else {
        return cloneElement(sections, { className: classes })
      }
    }

    render () {
      const { title, iconWrapperStyle = {}, onClick, editable, disabled, className, toggleable, titlePrefix, sections } = this.props
      return (
        <div
          className={classnames(css.collapsibleHeader, className, { [css.disabled]: disabled })}
          onClick={onClick}
          disabled={disabled}
          editable={String(editable)}
          data-title-only={!sections || (Array.isArray(sections) && !sections.length)}
          toggleable={String(toggleable)}
        >
          <div className={css.leftHeader}>
            <div style={{ display: 'flex', ...iconWrapperStyle }}>{this.getIcon()}</div>
            {titlePrefix}
            {title}
          </div>
          <div className={css.rightHeader}>
            {this.getSections()}
            {this.getToggle()}
          </div>
        </div>
      )
    }
}

Header.propTypes = {
  onClick: PropTypes.func,
  editable: PropTypes.bool,
  expanded: PropTypes.bool,
  toggleable: PropTypes.bool,
  disabled: PropTypes.bool,
  icon: PropTypes.string || PropTypes.array,
  className: PropTypes.string,
  titlePrefix: PropTypes.array,
  title: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
  sections: PropTypes.oneOfType([PropTypes.element, PropTypes.arrayOf(PropTypes.element)])
}
Header.defaultProps = {
  onClick: _.noop,
  editable: false,
  expanded: false,
  disabled: false,
  toggleable: false,
  icon: '',
  title: null,
  sections: null,
  titlePrefix: null
}

export default Header
