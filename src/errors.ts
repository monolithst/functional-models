/* eslint-disable functional/no-this-expression */
/* eslint-disable functional/no-class */
class ValidationError extends Error {
  constructor(modelName: String, keysToErrors: Object) {
    super(`${modelName} did not pass validation`)
    this.name = 'ValidationError'
    // @ts-ignore
    this.modelName = modelName
    // @ts-ignore
    this.keysToErrors = keysToErrors
  }
}
/* eslint-enable functional/no-this-expression */
/* eslint-enable functional/no-class */

export {
  ValidationError,
}
