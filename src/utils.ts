// @ts-ignore
import getRandomValuesFunc from 'get-random-values'
import AsyncLock from 'async-lock'

const HEX = 16
const FOUR = 4
const FIFTEEN = 15

const getRandomValues = (): Uint8Array => {
  const array = new Uint8Array(1)
  if (typeof window !== 'undefined') {
    if (window.crypto) {
      return window.crypto.getRandomValues(array)
    }
    // @ts-ignore
    if (window.msCrypto) {
      // @ts-ignore
      return window.msCrypto.getRandomValues(array)
    }
  }

  return getRandomValuesFunc(array)
}

const createUuid = (): string => {
  // @ts-ignore
  // eslint-disable-next-line no-magic-numbers,require-unicode-regexp
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: any) => {
    const value = getRandomValues()[0] & (FIFTEEN >> (c / FOUR))
    return (c ^ value).toString(HEX)
  })
}

const toTitleCase = (string: string) => {
  return `${string.slice(0, 1).toUpperCase()}${string.slice(1)}`
}

const loweredTitleCase = (string: string) => {
  return `${string.slice(0, 1).toLowerCase()}${string.slice(1)}`
}

const isPromise = <T>(something: any): something is Promise<T> => {
  if (something?.then) {
    return true
  }
  return false
}

enum PluralEndings {
  ves = 'fe',
  ies = 'y',
  i = 'us',
  zes = 'ze',
  ses = 's',
  es = 'e',
  s = '',
}
const _singularizingRe = new RegExp(
  `(${Object.keys(PluralEndings).join('|')})$`,
  'u'
)

const singularize = (word: string) => {
  // @ts-ignore
  return word.replace(_singularizingRe, r => PluralEndings[r])
}

const createHeadAndTail = (values: readonly string[], joiner: string) => {
  const head = values[0]
  const tail = values.slice(1).join(joiner)
  return [head, tail]
}

const flowFindFirst =
  <T, TResult>(funcs: ((t: T) => undefined | TResult)[]) =>
  (input: T) => {
    return funcs.reduce((acc: undefined | TResult, func) => {
      if (acc) {
        return acc
      }
      return func(input)
    }, undefined) as string | TResult
  }

const memoizeSync = <T, A extends Array<any>>(method: (...args: A) => T) => {
  /* eslint-disable functional/no-let */
  let value: any = undefined
  let called = false
  return (...args: A): T => {
    if (!called) {
      called = true
      value = method(...args)
    }

    return value
  }
  /* eslint-enable functional/no-let */
}

const memoizeAsync = <T, A extends Array<any>>(method: (...args: A) => T) => {
  const key = createUuid()
  const lock = new AsyncLock()
  /* eslint-disable functional/no-let */
  let value: any = undefined
  let called = false
  return async (...args: A): Promise<T> => {
    return lock.acquire(key, async () => {
      if (!called) {
        called = true
        value = await method(...args)
      }

      return value
    })
  }
  /* eslint-enable functional/no-let */
}

export {
  loweredTitleCase,
  toTitleCase,
  createUuid,
  isPromise,
  createHeadAndTail,
  singularize,
  flowFindFirst,
  memoizeSync,
  memoizeAsync,
}
