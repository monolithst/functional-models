import keyBy from 'lodash/keyBy'
// @ts-ignore
import getRandomValuesFunc from 'get-random-values'


const HEX = 16
const FOUR = 4
const FIFTEEN = 15

const getRandomValues = () : Uint8Array => {
  const array = new Uint8Array(1)
  if (typeof window !== 'undefined') {
    if (window.crypto) {
      return window.crypto.getRandomValues(array)
    }
    // @ts-ignore
    if (window.msCrypto) {
      // @ts-ignore
      window.msCrypto.getRandomValues(array)
    }
    // @ts-ignore
    return (window.crypto || window.msCrypto).getRandomValues
  }

  return getRandomValuesFunc(array)
}

const createUuid = () : String => {
  // eslint-disable-next-line no-magic-numbers,require-unicode-regexp
  // @ts-ignore
  // eslint-disable-next-line no-magic-numbers,require-unicode-regexp
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: any) => {
    const value = getRandomValues()[0] & (FIFTEEN >> (c / FOUR))
      return (c ^ value).toString(HEX)
    }
  )
}

const toTitleCase = (string: String) => {
  return `${string.slice(0, 1).toUpperCase()}${string.slice(1)}`
}

const loweredTitleCase = (string: String) => {
  return `${string.slice(0, 1).toLowerCase()}${string.slice(1)}`
}

const getObjToArray = (array: readonly string[]) : Object => {
  const obj = keyBy(array)
  return {
    ...obj,
    toArray: () => array,
  }
}

export {
  loweredTitleCase,
  toTitleCase,
  createUuid,
  getObjToArray,
}
