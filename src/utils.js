const HEX = 16
const FOUR = 4
const FIFTEEN = 15

const toTitleCase = string => {
  return `${string.slice(0, 1).toUpperCase()}${string.slice(1)}`
}

const createPropertyTitle = key => {
  const goodName = toTitleCase(key)
  return `get${goodName}`
}

const lazyValue = method => {
  /* eslint-disable functional/no-let */
  let value = undefined
  let called = false
  return async (...args) => {
    if (!called) {
      value = await method(...args)
      // eslint-disable-next-line require-atomic-updates
      called = true
    }

    return value
  }
  /* eslint-enable functional/no-let */
}

const getCryptoRandomValues = () => {
  if (typeof window !== 'undefined') {
    return (window.crypto || window.msCrypto).getRandomValues
  }

  return require('get-random-values')
}

const createUuid = () => {
  const getRandomValues = getCryptoRandomValues()
  // eslint-disable-next-line no-magic-numbers,require-unicode-regexp
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (
      c ^
      (getRandomValues(new Uint8Array(1))[0] & (FIFTEEN >> (c / FOUR)))
    ).toString(HEX)
  )
}

const loweredTitleCase = string => {
  return `${string.slice(0, 1).toLowerCase()}${string.slice(1)}`
}

module.exports = {
  createUuid,
  loweredTitleCase,
  lazyValue,
  createPropertyTitle,
  toTitleCase,
}
