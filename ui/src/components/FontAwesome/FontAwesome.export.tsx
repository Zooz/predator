import React, { HTMLAttributes } from 'react'
import classNames from 'classnames'

import './css/font-awesome.min.css'

export interface FontAwesomeProps extends HTMLAttributes<HTMLElement> {
  className?: string;
  icon: string;
}

const FontAwesome: React.FC<FontAwesomeProps> = ({
  className,
  icon,
  ...props
}: FontAwesomeProps) => (
  <i {...props} className={classNames('fa', className, `fa-${icon}`)} />
)

export default FontAwesome
