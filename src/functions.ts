const Function = (method: Function) => (wrapped: any) => () => {
  return method(wrapped)
}

export {
  Function,
}
