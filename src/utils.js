const keyBy = require('lodash/keyBy')

const HEX = 16
const FOUR = 4
const FIFTEEN = 15

const getRandomValues = () => {
  const array = new Uint8Array(1)
  if (typeof window !== 'undefined') {
    if (window.crypto) {
      return window.crypto.getRandomValues(array)
    }
    if (window.msCrypto) {
      window.msCrypto.getRandomValues(array)
    }
    return (window.crypto || window.msCrypto).getRandomValues
  }

  return require('get-random-values')(array)
}

const createUuid = () => {
  // eslint-disable-next-line no-magic-numbers,require-unicode-regexp
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => {
    const value = getRandomValues()[0] & (FIFTEEN >> (c / FOUR))
      return (c ^ value).toString(HEX)
    }
  )
}

const toTitleCase = string => {
  return `${string.slice(0, 1).toUpperCase()}${string.slice(1)}`
}

const loweredTitleCase = string => {
  return `${string.slice(0, 1).toLowerCase()}${string.slice(1)}`
}

const getObjToArray = array => {
  const obj = keyBy(array)
  return {
    ...obj,
    toArray: () => array,
  }
}

module.exports = {
  loweredTitleCase,
  toTitleCase,
  createUuid,
  getObjToArray,
}
