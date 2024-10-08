import AsyncLock from 'async-lock'
import { createUuid } from './utils'

const lazyValueSync = (method: (...args: any[]) => any) => {
  /* eslint-disable functional/no-let */
  let value: any = undefined
  let called = false
  return (...args: readonly any[]) => {
    if (!called) {
      called = true
      value = method(...args)
    }

    return value
  }
  /* eslint-enable functional/no-let */
}

const lazyValue = (method: (...args: any[]) => any) => {
  const key = createUuid()
  const lock = new AsyncLock()
  /* eslint-disable functional/no-let */
  let value: any = undefined
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

export { lazyValue, lazyValueSync }
