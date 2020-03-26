import React, { HTMLAttributes } from 'react'
import classnames from 'classnames'
import style from './Label.scss'

export enum LabelTypes {
    DEFAULT = 'DEFAULT',
    PRE = 'PRE',
    POST = 'POST'
}

export interface LabelProps extends HTMLAttributes<Element> {
    type?: LabelTypes
}

export interface LabelComponent<T, P> extends React.RefForwardingComponent<T, P> {
    TYPES?: typeof LabelTypes
}

const Label: LabelComponent<HTMLLabelElement, LabelProps> = React.forwardRef(({

  className,
  type,
  ...rest
}: LabelProps,
ref: React.Ref<HTMLLabelElement>) => {
  return (
    <label
      ref={ref}
      className={classnames(style.Label, {
        [style['Label--pre']]: type === LabelTypes.PRE,
        [style['Label--post']]: type === LabelTypes.POST
      }, className)} {...rest}
    />
  )
})

Label.TYPES = LabelTypes

export default Label
