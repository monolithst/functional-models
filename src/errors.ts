type KeysToErrors = {[s: string]: string[]}

/* eslint-disable functional/no-this-expression */
/* eslint-disable functional/no-class */
class ValidationError extends Error {
  public modelName: String;
  public keysToErrors: KeysToErrors
  constructor(modelName: String, keysToErrors: KeysToErrors) {
    super(`${modelName} did not pass validation`)
    this.name = 'ValidationError'
    this.modelName = modelName
    this.keysToErrors = keysToErrors
  }
}
/* eslint-enable functional/no-this-expression */
/* eslint-enable functional/no-class */

export {
  ValidationError,
}
