const lazyValue = (method: Function) => {
  /* eslint-disable functional/no-let */
  let value : any = undefined
  let called = false
  return async (...args: Array<any>) => {
    if (!called) {
      called = true
      value = await method(...args)
      // eslint-disable-next-line require-atomic-updates
    }

    return value
  }
  /* eslint-enable functional/no-let */
}

export {
  lazyValue,
}
