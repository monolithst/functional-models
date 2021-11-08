import { getObjToArray } from './utils'

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

export {
  PROPERTY_TYPES,
}
