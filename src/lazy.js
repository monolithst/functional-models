const AsyncLock = require('async-lock')
const { createUuid } = require('./utils')

const lazyValue = method => {
  const key = createUuid()
  const lock = new AsyncLock()
  /* eslint-disable functional/no-let */
  let value = undefined
  let called = false
  return async (...args) => {
    return lock.acquire(key, async () => {
      if (!called) {
        called = true
        value = await method(...args)
        // eslint-disable-next-line require-atomic-updates
      }
    }).then(() => {
      return value
    })
  }
  /* eslint-enable functional/no-let */
}

module.exports = {
  lazyValue,
}
