const lazyValue = method => {
  /* eslint-disable functional/no-let */
  let value = undefined
  let called = false
  return async (...args) => {
    if (!called) {
      called = true
      value = await method(...args)
      // eslint-disable-next-line require-atomic-updates
    }

    return value
  }
  /* eslint-enable functional/no-let */
}

module.exports = {
  lazyValue,
}
