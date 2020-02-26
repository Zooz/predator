import React, { HTMLAttributes } from 'react'
import classnames from 'classnames'
import css from './Card.scss'
import colors from '../styles/_colors.scss'

export enum CardTypes {
    DEFAULT = 'DEFAULT',
    CLICKER = 'CLICKER',
    PLACEHOLDER = 'PLACEHOLDER',
    ACTIVE = 'ACTIVE',
    NEGATIVE = 'NEGATIVE',
    POSITIVE = 'POSITIVE',
    DISABLED = 'DISABLED',
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    ERROR = 'ERROR',
  MESSAGE = 'MESSAGE',
  INTERMEDIATE = 'INTERMEDIATE',
  DROPDOWN = 'DROPDOWN',
  LINE_INDICATOR = 'LINE_INDICATOR'
}

export interface CardProps extends HTMLAttributes<Element> {
    type?: CardTypes,
    className?: string,
    selected?: boolean,
    hover?: boolean,
    hovering?: boolean,
    clickable?: boolean,
    indicatorColor?: string,
    style?: {}
}

export interface CardComponent<T, P> extends React.RefForwardingComponent<T, P> {
    CARD_TYPES?: typeof CardTypes
}

const Card: CardComponent<HTMLDivElement, CardProps> = React.forwardRef((
  {
    children,
    type = CardTypes.DEFAULT,
    hover = false,
    hovering = false,
    selected = false,
    className,
    clickable = true,
    indicatorColor = colors.defaultBlue,
    style = {},
    ...rest
  }: CardProps,
  ref: React.Ref<HTMLDivElement>
) => {
  const classes = classnames(css.card, className, {
    [css['card--default']]: type === CardTypes.DEFAULT,
    [css['card--clicker']]: type === CardTypes.CLICKER,
    [css['card--placeholder']]: type === CardTypes.PLACEHOLDER,
    [css['card--active']]: type === CardTypes.ACTIVE,
    [css['card--disabled']]: type === CardTypes.DISABLED,
    [css['card--negative']]: type === CardTypes.NEGATIVE,
    [css['card--positive']]: type === CardTypes.POSITIVE,
    [css['card--success']]: type === CardTypes.SUCCESS,
    [css['card--failed']]: type === CardTypes.FAILED,
    [css['card--error']]: type === CardTypes.ERROR,
    [css['card--intermediate']]: type === CardTypes.INTERMEDIATE,
    [css['card--message']]: type === CardTypes.MESSAGE,
    [css['card--dropdown']]: type === CardTypes.DROPDOWN,
    [css['card--indicator']]: type === CardTypes.LINE_INDICATOR
  })

  const cardStyle = type === CardTypes.LINE_INDICATOR
    ? {
      ...style,
      '--upper-line-color': indicatorColor
    }
    : style

  return (
    <div
      ref={ref}
      className={classes} {...rest}
      data-hoverable={hover}
      data-hovering={hovering}
      data-clickable={clickable}
      data-selected={selected}
      style={cardStyle}
    >
      {type === CardTypes.DISABLED && <div className={css.card__disabled} />}
      {children}
    </div>
  )
})

Card.CARD_TYPES = CardTypes

export default Card
