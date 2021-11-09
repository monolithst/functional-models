import { getObjToArray } from './utils'

enum PROPERTY_TYPES {
  UniqueId = 'UniqueId',
  DateProperty = 'DateProperty',
  ArrayProperty = 'ArrayProperty',
  ReferenceProperty = 'ReferenceProperty',
  IntegerProperty = 'IntegerProperty',
  TextProperty = 'TextProperty',
  ConstantValueProperty = 'ConstantValueProperty',
  NumberProperty = 'NumberProperty',
  ObjectProperty = 'ObjectProperty',
  EmailProperty = 'EmailProperty',
  BooleanProperty = 'BooleanProperty',
}
/*
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
 */

export {
  PROPERTY_TYPES,
}
