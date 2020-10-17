import React, { HTMLAttributes } from 'react'
import classnames from 'classnames'
import css from './Card.scss'
import colors from '../styles/_colors.scss'

export enum CARD_TYPES {
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
    type?: CARD_TYPES,
    className?: string,
    selected?: boolean,
    hover?: boolean,
    hovering?: boolean,
    clickable?: boolean,
    indicatorColor?: string,
    style?: {}
}

export interface CardComponent<T, P> extends React.ForwardRefRenderFunction<T, P> {
    CARD_TYPES?: typeof CARD_TYPES
}

const Card: React.ForwardRefExoticComponent<React.PropsWithoutRef<CardProps> & React.RefAttributes<HTMLDivElement>> = React.forwardRef((
  {
    children,
    type = CARD_TYPES.DEFAULT,
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
    [css['card--default']]: type === CARD_TYPES.DEFAULT,
    [css['card--clicker']]: type === CARD_TYPES.CLICKER,
    [css['card--placeholder']]: type === CARD_TYPES.PLACEHOLDER,
    [css['card--active']]: type === CARD_TYPES.ACTIVE,
    [css['card--disabled']]: type === CARD_TYPES.DISABLED,
    [css['card--negative']]: type === CARD_TYPES.NEGATIVE,
    [css['card--positive']]: type === CARD_TYPES.POSITIVE,
    [css['card--success']]: type === CARD_TYPES.SUCCESS,
    [css['card--failed']]: type === CARD_TYPES.FAILED,
    [css['card--error']]: type === CARD_TYPES.ERROR,
    [css['card--intermediate']]: type === CARD_TYPES.INTERMEDIATE,
    [css['card--message']]: type === CARD_TYPES.MESSAGE,
    [css['card--dropdown']]: type === CARD_TYPES.DROPDOWN,
    [css['card--indicator']]: type === CARD_TYPES.LINE_INDICATOR
  })

  const cardStyle = type === CARD_TYPES.LINE_INDICATOR
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
      {type === CARD_TYPES.DISABLED && <div className={css.card__disabled} />}
      {children}
    </div>
  )
})

export default Card
