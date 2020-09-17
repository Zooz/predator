export const hasItems = array => !!(array && array.length)

export const areEquals = (array1 = [], array2 = []) => JSON.stringify(array1) === JSON.stringify(array2)

export const getFirstN = (array = [], numberOfItems = 0) => {
  if (array.length < numberOfItems) {
    return array
  }
  return array.slice(0, numberOfItems)
}

export const addItem = (array = [], item) => {
  if (item === undefined) {
    return array
  }
  return [...array, item]
}

export const removeItem = (array = [], value) => {
  return array.filter((item) => item !== value)
}

export const removeByAttribute = (array = [], propName, value) => {
  return array.filter((obj) => obj[propName] !== value)
}
