export const startsWithStrategy = ({ array = [], propName, value = '' }) => {
  const lowerCaseValue = value.toLowerCase()
  if (propName) {
    return array
      .filter(object => typeof object[propName] === 'string')
      .filter(object => object[propName].toLowerCase().startsWith(lowerCaseValue))
  }
  return array
    .filter(object => typeof object[propName] === 'string')
    .filter(item => item.toLowerCase().startsWith(lowerCaseValue))
}

export const includes = ({ array = [], propName, value = '' }) => {
  const lowerCaseValue = value.toLowerCase()
  return value
    ? array.filter(object => (propName ? object[propName] : object).toLowerCase().includes(lowerCaseValue))
    : []
}

export default {
  startsWithStrategy,
  includes
}
