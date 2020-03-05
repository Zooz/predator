import React, { LabelHTMLAttributes } from 'react'
import classNames from 'classnames'
import style from './InputText.scss'
export enum InputTextTypes {
  DEFAULT = 'DEFAULT',
  PLACEHOLDER = 'PLACEHOLDER',
  VIEW = 'VIEW'
}

export interface InputTextComponent<P> extends React.FC<P> {
  TYPES: typeof InputTextTypes
}

export interface InputTextComponentProps extends LabelHTMLAttributes<Element> {
   className?: string;
   type?: InputTextTypes
}

const InputText: InputTextComponent<InputTextComponentProps> = ({
  className = '',
  type = InputTextTypes.DEFAULT,
  ...rest
}) => (
  <label
    className={classNames(style.InputText, {
      [style['InputText--placeholder']]: type === InputTextTypes.PLACEHOLDER,
      [style['InputText--view']]: type === InputTextTypes.VIEW
    }, className)}
    {...rest}
  />
)

InputText.TYPES = InputTextTypes

export default InputText
