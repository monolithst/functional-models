/* eslint-disable functional/no-this-expression */
/* eslint-disable functional/no-class */
class ValidationError extends Error {
  constructor(modelName, keysToErrors) {
    super(`${modelName} did not pass validation`)
    this.name = 'ValidationError'
    this.modelName = modelName
    this.keysToErrors = keysToErrors
  }
}
/* eslint-enable functional/no-this-expression */
/* eslint-enable functional/no-class */

module.exports = {
  ValidationError,
}
