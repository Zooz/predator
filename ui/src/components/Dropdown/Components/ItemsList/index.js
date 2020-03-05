import React, { useState } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import ItemsWrapper from '../ItemsWrapper'
import style from './ItemsList.scss'
import InputText from '../InputText/InputText.export'

const ItemsList = ({ items, onClick }) => {
  const [hoveredKey, setHoveredKey] = useState(undefined)

  return (
    <ItemsWrapper onMouseLeave={() => setHoveredKey(undefined)}>
      {items.map((item = {}) => {
        const { value, key, disabled } = item

        return (
          <InputText
            type={disabled ? InputText.TYPES.PLACEHOLDER : undefined}
            onMouseEnter={() => setHoveredKey(key)}
            key={key}
            data-test='option'
            onClick={disabled ? undefined : onClick.bind(null, item)}
            className={classnames(style.list__item, {
              [style['list__item--disabled']]: disabled
            })}
          >
            {React.isValidElement(value) ? React.cloneElement(value, { isHover: hoveredKey === key }) : value}
          </InputText>
        )
      })}
    </ItemsWrapper>
  )
}

ItemsList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({ key: PropTypes.any, value: PropTypes.any, disabled: PropTypes.bool })),
  onClick: PropTypes.func
}

ItemsList.defaultProps = {
  items: []
}

export default ItemsList
