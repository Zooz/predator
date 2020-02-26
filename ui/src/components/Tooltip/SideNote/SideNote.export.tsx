import React, { HTMLAttributes } from 'react'
import classnames from 'classnames'
import style from './SideNote.scss'

export interface SideNoteProps extends HTMLAttributes<Element> {
    bold?: boolean,
    obscure?: boolean,
    disabled?: boolean
}

const SideNote: React.FC<SideNoteProps> = ({ className, bold, obscure, disabled, ...rest }: SideNoteProps) => {
  return (
    <div
      className={classnames(style.SideNote, {
        [style['SideNote--bold']]: bold,
        [style['SideNote--obscure']]: obscure,
        [style['SideNote--disabled']]: disabled
      }, className)} {...rest}
    />
  )
}

export default SideNote
