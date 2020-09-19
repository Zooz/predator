import React, { ReactNode } from 'react'

type ChildrenFunction = (properties: {}) => ReactNode

const enhanceChildrenWithProperties = (
  children: ReactNode | ChildrenFunction,
  properties: {} = {}
) => {
  if (React.isValidElement(children)) {
    return React.cloneElement(children, properties)
  } else if (typeof children === 'function') {
    return children(properties)
  }

  return null
}

export default enhanceChildrenWithProperties
