const Function = method => wrapped => () => {
  return method(wrapped)
}

module.exports = {
  Function,
}
