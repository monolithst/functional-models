"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROPERTY_TYPES = void 0;
var utils_1 = require("./utils");
var PROPERTY_TYPES = (0, utils_1.getObjToArray)([
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
]);
exports.PROPERTY_TYPES = PROPERTY_TYPES;
