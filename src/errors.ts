/* eslint-disable functional/no-this-expressions */
/* eslint-disable functional/no-classes */
class ValidationError extends Error {
  public modelName: string
  public keysToErrors: Record<string, readonly string[]>
  constructor(
    modelName: string,
    keysToErrors: Record<string, readonly string[]>
  ) {
    super(`${modelName} did not pass validation`)
    this.name = 'ValidationError'
    this.modelName = modelName
    this.keysToErrors = keysToErrors
  }
}
/* eslint-enable functional/no-this-expressions */
/* eslint-enable functional/no-classes */

export { ValidationError }
