type KeysToErrors = Readonly<{ [s: string]: readonly string[] }>

/* eslint-disable functional/no-this-expressions */
/* eslint-disable functional/no-classes */
class ValidationError extends Error {
  public modelName: string
  public keysToErrors: KeysToErrors
  constructor(modelName: string, keysToErrors: KeysToErrors) {
    super(`${modelName} did not pass validation`)
    this.name = 'ValidationError'
    this.modelName = modelName
    this.keysToErrors = keysToErrors
  }
}
/* eslint-enable functional/no-this-expressions */
/* eslint-enable functional/no-classes */

export { ValidationError }
