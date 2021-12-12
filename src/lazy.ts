import AsyncLock from 'async-lock'
import { createUuid } from './utils'

const lazyValue = (method: Function) => {
  const key = createUuid()
  const lock = new AsyncLock()
  /* eslint-disable functional/no-let */
  let value : any = undefined
  let called = false
  return async (...args: readonly any[]) => {
    return lock.acquire(key, async () => {
      if (!called) {
        called = true
        value = await method(...args)
        // eslint-disable-next-line require-atomic-updates
      }

      return value
    })
  }
  /* eslint-enable functional/no-let */
}

export {
  lazyValue,
}
