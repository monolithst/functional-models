const { getObjToArray } = require('./utils')

const PROPERTY_TYPES = getObjToArray([
  'UniqueId',
  'DateProperty',
  'ArrayProperty',
  'ReferenceProperty',
  'IntegerProperty',
  'TextProperty',
  'ConstantValueProperty',
  'NumberProperty',
  'ObjectProperty',
  'EmailProperty',
  'BooleanProperty',
])

module.exports = {
  PROPERTY_TYPES,
}