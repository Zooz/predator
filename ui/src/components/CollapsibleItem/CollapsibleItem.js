import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import _ from 'lodash'

import Card, { CARD_TYPES } from './Card/Card.export'
import Header from './components/CollapsibleItemHeader.export'
import Body from './components/CollapsibleItemBody.export'
import Section from './components/CollapsibleItemSection.export'
import css from './styles/index.scss'

const TYPES = {
  DEFAULT: 'DEFAULT',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS',
  CLICKER: 'CLICKER'
}

const CollapsibleItem = ({
  icon,
  title,
  sections,
  body,
  onClick,
  expanded,
  disabled,
  editable,
  toggleable,
  className,
  titlePrefix,
  iconWrapperStyle,
  type,
  ...rest
}) => {
  const resolvedClassName = classnames(css.collapsible, className, { [css.disabled]: disabled })
  let cardType = CARD_TYPES.DEFAULT
  if (type === TYPES.ERROR) {
    cardType = CARD_TYPES.ERROR
  } else if (type === TYPES.SUCCESS) {
    cardType = CARD_TYPES.SUCCESS
  } else if (type === TYPES.CLICKER) {
    cardType = CARD_TYPES.CLICKER
  } else if (disabled) {
    cardType = CARD_TYPES.DISABLED
  }
  return (
    <Card
      type={cardType}
      hover
      hovering={expanded}
      clickable={false}
      className={resolvedClassName}
      {...rest}
    >
      <Header
        onClick={onClick}
        expanded={expanded}
        disabled={disabled}
        toggleable={toggleable}
        editable={editable}
        icon={icon}
        iconWrapperStyle={iconWrapperStyle}
        title={title}
        sections={sections}
        titlePrefix={titlePrefix}
      />
      <Body
        disabled={disabled}
        expanded={expanded}
        body={body}
      />
    </Card>
  )
}

CollapsibleItem.propTypes = {
  onClick: PropTypes.func,
  editable: PropTypes.bool,
  expanded: PropTypes.bool,
  toggleable: PropTypes.bool,
  type: PropTypes.oneOf(Object.values(TYPES)),
  disabled: PropTypes.bool,
  icon: PropTypes.string,
  title: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
  sections: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element)
  ]),
  body: PropTypes.element,
  className: PropTypes.string,
  titlePrefix: PropTypes.array
}
CollapsibleItem.defaultProps = {
  onClick: _.noop,
  type: TYPES.DEFAULT,
  editable: false,
  expanded: false,
  disabled: false,
  toggleable: false,
  icon: '',
  title: null,
  sections: null
}

CollapsibleItem.TYPES = TYPES

CollapsibleItem.Section = Section
CollapsibleItem.Header = Header
CollapsibleItem.Body = Body
export default CollapsibleItem
