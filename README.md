# Functional Models

<img src="./docs/images/chocolate.png" alt="drawing" width="200"/>

> The ooey gooey framework for building and using awesome models EVERYWHERE.

![Unit Tests](https://github.com/monolithst/functional-models/actions/workflows/ut.yml/badge.svg?branch=master)
![Feature Tests](https://github.com/monolithst/functional-models/actions/workflows/feature.yml/badge.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/monolithst/functional-models/badge.svg?branch=master)](https://coveralls.io/github/monolithst/functional-models?branch=master)

## Functional Modeling Fun

Does this sound like you?
"I want to code once, use it everywhere, and auto-generate my entire system"

If so this is the library for you.

This library empowers the creation of pure TypeScript/JavaScript function based models that can be used on a client, a web frontend, and/or a backend all the same time. Use this library to create models that can be reused everywhere. Write validation code, metadata, property descriptions, and more! Functional Models is fully supportive of both Typescript and Javascript. In fact, the typescript empowers some really sweet dynamic type checking, and autocomplete!

Functional Models was born out of the enjoyment and power of working with Django models, but, restricting their "god-like abilities" which can cause developers to make a system nearly impossible to optimize or improve.

# Primary Features

- Define models that have robust properties and are scoped to a namespace or app
- Robust typing system for TypeScript goodness.
- Same modeling code can be used on front end and backends.
- Validate model data
- ORM ready via the [functional-models-orm](https://github.com/monolithst/functional-models-orm) package. Available Datastores: DynamoDb, Mongo, in-memory, elastic/opensearch, Sqlite, Postgres, Mysql
- Most common properties out of the box.
- Supports "foreign keys", 1 to 1 as well as 1 to many (via an Array).
- Models support custom primary key name. (id is used by default)
- Supports different model namings, (plural, singular, display), and the ability to customize them.
- Add Api Information that can be used for auto-generating frontend and backend code as well as documentation.

# Table Of Contents

- [Version 3.0 Updates](#the-big-30-updates)
- [Simple JavasScript Example](#simple-javascript-example-usage)
- [Simple TypeScript Example](#simple-typescript-example-usage)
- [Validation](#validation)
- [Properties](#properties)
- [List of Properties](#list-of-properties-out-of-the-box)

## The Big 3.0 Updates

Version 3 is a major update that changes most of the primary interfaces from Version 2. This version should be simpler to extend (see the companion library [Functional Models Orm](https://github.com/monolithst/functional-models-orm)) making models much easier to reuse across front and back ends. Here is a non-exhaustive list.

- Model/ModelInstance/ModelFactory types have been reworked, so that they are simpler and much easier to extend
- Some "automagical" stuff has been removed, because experience has shown them to be more of a hassle than they were worth.
- Interfaces for ModelType/ModelInstance/ModelDefinitions have been reworked
- API Endpoint information can be added to a ModelDefinition
- Additional Value Types added for better differentiation downstream. (Date/Datetime, Text/BigText, etc)
- Removes dependency on date-fns to lighten the install, and prevent duplicate dependencies.
- Memoized computations to reduce expensive recalculations.
- Promise types allowed in model type. (Perfect for asynchronous loaded properties)

## Simple JavaScript Example Usage

```javascript
const {
  Model,
  DatetimeProperty,
  NumberProperty,
  TextProperty,
  PrimaryKeyUuidProperty,
} = require('functional-models')

// Create your model. Our recommended standard is to use a plural uppercase name for your variable. (You are creating a Model factory)
const Trucks = Model({
  pluralName: 'Trucks',
  namespace: '@my-package/cars',
  properties: {
    id: PrimaryKeyUuidProperty(),
    make: TextProperty({ maxLength: 20, minLength: 3, required: true }),
    model: TextProperty({ maxLength: 20, minLength: 3, required: true }),
    color: TextProperty({
      maxLength: 10,
      minLength: 3,
      choices: ['red', 'green', 'blue', 'black', 'white'],
    }),
    year: NumberProperty({ maxValue: 2500, minValue: 1900 }),
    lastModified: DatetimeProperty({ autoNow: true }),
  },
})

// Create an instance of the model. In this case, you don't need 'id', because it gets created automatically with UniquePropertyId()
const myTruck = Trucks.create({
  make: 'Ford',
  model: 'F-150',
  color: 'white',
  year: 2013,
})

// Get the properties of the model instance.
console.log(myTruck.get.id()) // a auto generated uuid
console.log(myTruck.get.make()) // 'Ford'
console.log(myTruck.get.model()) // 'F-150'
console.log(myTruck.get.color()) // 'white'
console.log(myTruck.get.year()) // 2013

// Get a raw javascript object representation of the model.
const obj = await myTruck.toObj()
console.log(obj)
/*
{
  "id": "3561e6c5-422d-46c7-954f-f7261b11d3d4",
  "make": "Ford",
  "model": "F-150",
  "color": "white",
  "year": 2013
}
*/

// Create a copy of the model from the raw javascript object.
const sameTruck = Truck.create(obj)
console.log(myTruck.get.id()) // same as above.
console.log(myTruck.get.make()) // 'Ford'
console.log(myTruck.get.model()) // 'F-150'
console.log(myTruck.get.color()) // 'white'
console.log(myTruck.get.year()) // 2013

// Validate the model. Undefined, means no errors.
const errors = await sameTruck.validate()
console.log(errors) // undefined

const newTruck = Truck({
  make: 'Ford',
  model: 'F-150',
  color: 'white',
  year: 20130,
})
const errors2 = await newTruck.validate()
console.log(errors2)

// Key is the property's name, and an array of validation errors for that property.
// {"year": ['Value is too long']}
```

## Simple TypeScript Example Usage

While functional-models works very well and easy without TypeScript, using typescript empowers
modern code completion engines to show the properties/methods on models and model instances.
Libraries built on top of functional-models is encouraged to use TypeScript, while applications,
may or may not be as useful, given the overhead of typing. NOTE: Behind the covers functional-models
typing, is extremely strict, and verbose, which can make it somewhat difficult to work with, but
it provides the backbone of expressive and clear typing that "just works" for nearly all situations.

```typescript
import {
  Model,
  DatetimeProperty,
  NumberProperty,
  TextProperty,
  PrimaryKeyUuidProperty,
} from 'functional-models'

// Create an object type. NOTE: Singular Uppercase
type VehicleMake = {
  id: string // Our primary key
  name: string // A simple text name of the maker
}

// Create your main type that has reference to another type.
type Vehicle = {
  id: string // Our primary key
  make: ModelReference<VehicleMake> // A reference to another model.
  model: string // A simple text field
  color: Promise<string> // A property that requires asynchronous to create.
  year?: number // An optional number property. We enforce this is an integer in the Model Definition
  lastModified?: DateValueType // A Date|string
  history?: string // A complex text data type.
}

// Create a model for the VehicleMake type. NOTE: Plural and Uppercase.
const VehicleMakes = Model<VehicleMake>({
  pluralName: 'VehicleMakes',
  namespace: '@my-package/cars',
  properties: {
    id: PrimaryKeyUuidProperty(),
    name: TextProperty({ required: true }),
  },
})

// Create a model for the Vehicle type
const Vehicles = Model<Vehicle>({
  pluralName: 'Vehicles',
  namespace: '@my-package/cars',
  properties: {
    id: PrimaryKeyUuidProperty(),
    model: TextProperty({
      maxLength: 20,
      minLength: 3,
      required: true,
    }),
    color: TextProperty({
      maxLength: 10,
      minLength: 3,
      choices: ['red', 'green', 'blue', 'black', 'white'],
    }),
    year: IntegerProperty({
      maxValue: 2500,
      minValue: 1900,
    }),
    make: ModelReferenceProperty<VehicleMake>(VehicleMakes, { required: true }),
    history: BigTextProperty({ required: false }),
    lastModified: DatetimeProperty({ autoNow: true }),
  },
})

// Create an instance of our Make. NOTE: The 'id' is to tell the create factory to ignore the id field as it is auto-generated.
const ford = VehicleMakes.create<'id'>({
  name: 'Ford',
})

// GOOD: Create an instance of the model.
const myTruck = Vehicles.create<'id'>({
  make: ford,
  model: 'F-150',
  color: 'white',
  year: 2013,
})

// GOOD: You can also use the id to set the make
const myTruck2 = Vehicles.create<'id'>({
  make: ford.get.id(),
  model: 'F-150',
  color: 'white',
  year: 2013,
})

// GOOD: Will NOT cause a typescript error because year is optional.
const myTruck4 = Vehicles.create<'id'>({
  make: ford,
  model: 'F-150',
  color: 'white',
})

// ERROR: Will cause a typescript error because year must be a string.
const myTruck3 = Vehicles.create<'id'>({
  make: ford,
  model: 'F-150',
  color: 'white',
  year: '2013', // must be a string
})
```

## Validation

Validation is baked into the functional-models framework. Both individual properties and an entire model instance can be covered by validators. The following are the interfaces for a validator. Validation overall is a combination of property validator components as well as model validator components. These components combine to create a complete validation picture of a model.

When calling validate, you either get undefined (for passing), or you get an object that shows you the errors at both the model and the individual property level.

Here is an example of validating different model instances:

```javascript
// Call .validate() on the instance, and await its result.
const errors = await myModelInstance.validate()

console.log(errors)

/*
 * {
 *   "overall": [
 *     "This is a custom model validator that failed for the entire model",
 *     "Here is a second model failing message",
 *   ],
 *   "aDateProperty": [
 *     "A value is required",
 *     "Value is not a date",
 *   ],
 *   "anArrayProperty": [
 *     "BadChoice is not a valid choice",
 *   ],
 *   // the 'otherProperty' did not fail, and therefore is not shown here.
 * }
 */

// Here is one that passes
const errors2 = await anotherInstance.validate()

console.log(errors)
/*
undefined
*/
```

### Property validators

A property validator validates the value of a property. The inputs are the value, a model instance, the JavaScript object representation of the model, and optional configurations that are passed into the validator. The return can either be a string error or undefined if there are no errors. This function can be asynchronous, such as doing database lookups. An implementation in `functional-models-orm` does a "unique together" database query to make sure that only one entry has the value of two or more properties.

```javascript
/**
 * An example validator function that only allows the value of 5.
 * @constructor
 * @param {string} value - The value to be tested.
 * @param {string} instance - A model instance, which can be used for cross referencing.
 * @param {string} instanceData - The JavaScript object representation of the model.
 * @param {string} context - An optional context object passed in as part of validating.
 * @return {string|undefined} - If error, returns a string, otherwise returns undefined.
 */
const valueIsFiveValidator = (
  value, // any kind of value.
  instance, // A ModelInstance,
  instanceData, // JavaScript object representation,
  context = {}
) => {
  return value === 5 ? undefined : 'Value is not 5'
}

// A simpler more realistic implementation
const valueIsFiveValidator2 = value => {
  return value === 5 ? undefined : 'Value is not 5'
}

/**
 * An example async validator function that checks a database using an object passed into the configurations.
 * @constructor
 * @param {string} value - The value to be tested.
 * @param {string} instance - A model instance, which can be used for cross referencing.
 * @param {string} context - The JavaScript object representation of the model.
 * @param {string} configurations - An optional context object passed in as part of validating.
 * @return {Promise<string|undefined>} - Returns a promise, If error, returns a string, otherwise returns undefined.
 */
const checkDatabaseError = async (
  value, // any kind of value.
  instance, // A ModelInstance,
  instanceData, // JavaScript object representation,
  context = {}
) => {
  const result = await context.someDatabaseObj.check(value)
  if (result) {
    return 'Some sort of database error'
  }
  return undefined
}
```

### Model Validators

Model validators allows one to check values across a model, ensuring that multiple values work together. The inputs are the model instance, the JavaScript object representation, and optional configurations. The return can either be a string error or undefined if there are no errors. This function can be asynchronous, such as doing database lookups.

```javascript
/**
 * An example model validator that checks to see if two properties have the same value.
 * @constructor
 * @param {string} instance - A model instance, used for cross referencing.
 * @param {string} instanceData - The JavaScript object representation of the model.
 * @param {string} context - An optional context object passed in as part of validating.
 * @return {string|undefined} - If error, returns a string, otherwise returns undefined.
 */
const checkForDuplicateValues = (
  instance, // A ModelInstance,
  instanceData, // JavaScript object representation,
  context = {}
) => {
  if (instanceData.firstProperty === instanceData.secondProperty) {
    return 'Both properties must have different values'
  }
  return undefined
}
```

## Properties

There are numerous properties that are supported out of the box that cover most data modeling needs. It is also very easy to create custom properties that encapsulate unique choices
validation requirements, etc.

## List of Properties Out-Of-The-Box

### Dates

#### DateProperty

A property for handling dates. (Without time)

[Documentation](https://monolithst.github.io/functional-models/functions/index.properties.DateProperty.html)

#### DatetimeProperty

A property for handling dates with times.

[Documentation](https://monolithst.github.io/functional-models/functions/index.properties.DatetimeProperty.html)

### Arrays

#### ArrayProperty

A property that can handle multiple values. If you want it to only have a single type, look below at the [SingleTypeArrayProperty](#singletypearrayproperty).

[Documentation](https://monolithst.github.io/functional-models/functions/index.properties.ArrayProperty.html)

#### SingleTypeArrayProperty

A property that can handle multiple values of the same type. This is enforced via validation and by typing.

[Documentation](https://monolithst.github.io/functional-models/functions/index.properties.SingleTypeArrayProperty.html)

### Objects

#### ObjectProperty

A property that can handle "JSON compliant" objects. Simple objects.

[Documentation](https://monolithst.github.io/functional-models/functions/index.properties.ObjectProperty.html)

### Text

#### TextProperty

A property for simple text values. If you want to hold large values look at [BigTextProperty](#bigtextproperty).

[Documentation](https://monolithst.github.io/functional-models/functions/index.properties.TextProperty.html)

#### BigTextProperty

A property for holding large text values.

[Documentation](https://monolithst.github.io/functional-models/functions/index.properties.BigTextProperty.html)

#### EmailProperty

A property that holds Emails.

[Documentation](https://monolithst.github.io/functional-models/functions/index.properties.EmailProperty.html)

### Numbers

#### IntegerProperty

A property that holds integer values. (No floating point).

[Documentation](https://monolithst.github.io/functional-models/functions/index.properties.IntegerProperty.html)

#### YearProperty

An integer property that holds year values.

[Documentation](https://monolithst.github.io/functional-models/functions/index.properties.YearProperty.html)

#### NumberProperty

A property that holds floating point numbers.

[Documentation](https://monolithst.github.io/functional-models/functions/index.properties.NumberProperty.html)

### Misc

#### ConstantValueProperty

A property that has a single value that is hardcoded and can never be changed. Good for encoding values like the model name in the data.

[Documentation](https://monolithst.github.io/functional-models/functions/index.properties.ConstantValueProperty.html)

#### BooleanProperty

A property that can hold a true or a false.

[Documentation](https://monolithst.github.io/functional-models/functions/index.properties.BooleanProperty.html)

### Keys / Primary / Foreign

#### PrimaryKeyUuidProperty

A property that holds a uuid as a primary key. It is automatically created if not provided.

[Documentation](https://monolithst.github.io/functional-models/functions/index.properties.PrimaryKeyUuidProperty.html)

#### ModelReferenceProperty

A property that holds a reference to another model instance. (In database-speak a foreign key). When code requests the value for this property, it is fetched and returns an object. However, when `.toObj()` is called on the model, this reference turns into a id. (number or string)

[Documentation](https://monolithst.github.io/functional-models/functions/index.properties.ModelReferenceProperty.html)

#### AdvancedModelReferenceProperty

The underlying implementation for {@link ModelReferenceProperty} that allows Model and ModelInstance expansions. This should only be used if there are certain expanded features that a referenced model needs to have.

[Documentation](https://monolithst.github.io/functional-models/functions/index.properties.AdvancedModelReferenceProperty.html)

### Calculated At RunTime

#### DenormalizedProperty

A property that provides a denormalized value. This is the underlying property for other (simpler) denormalized values, and allows you to build your own customized denormalization.

All denormalized properties are calculated once and then never again unless requested.

[Documentation](https://monolithst.github.io/functional-models/functions/index.properties.DenormalizedProperty.html)

#### DenormalizedTextProperty

A text property that is denormalized.

[Documentation](https://monolithst.github.io/functional-models/functions/index.properties.DenormalizedTextProperty.html)

#### DenormalizedNumberProperty

A number property that is denormalized and calculated when it doesn't exist.

[Documentation](https://monolithst.github.io/functional-models/functions/index.properties.DenormalizedNumberProperty.html)

#### DenormalizedIntegerProperty

An integer property that is denormalized and calculated when it doesn't exist.

[Documentation](https://monolithst.github.io/functional-models/functions/index.properties.DenormalizedIntegerProperty.html)

#### NaturalIdProperty

A property that represents an id that is composed of other properties on an object. It is "natural" in the sense that it is not an arbitrary id, but rather a mixture of properties that make up a unique instance. This is often useful as a Primary Key where the data is uniquely represented by the combination of multiple values.

This can be useful to optimize a situation where you have a "unique together" requirement for model in a database, where there can only be one model that has the same of multiple properties.

NOTE: This property is never automatically updated if the properties changed. It is recommended that
any model that has a NaturalIdProperty should be deleted and then re-created rather than "updated" if
any property changes that make up the key composition.

For example if you are making a model for a `Species` and `Genera`, where we want to dynamically create the latinName for Species which a combination of the Genera's latin name with a latin name ending in this format: `GeneraLatinName speciesLatinName`

```typescript
type Genus = {
  latinName: string // our key. Only one Genus can have a latinName.
  commonName: string
}

const Genera = Model<Genus>({
  pluralName: 'Genera',
  singularName: 'Genus',
  primaryKeyName: 'latinName',
  properties: {
    latinName: TextProperty({ required: true }),
    commonName: TextProperty({ required: true }),
  },
})

type SpeciesType = {
  latinName: Promise<string>
  genusLatinName: string // We are using a string here, but a ModelReference would probably be better.
  speciesName: string // We are going to combine this with the genusLatinName
  commonName: string
}

const Species = Model<SpeciesType>({
  pluralName: 'Species',
  singularName: 'Species',
  primaryKeyName: 'latinName',
  properties: {
    // We want to combine genusLatinName with speciesName with a space between.
    latinName: NaturalIdProperty({
      propertyKeys: ['genusLatinName', 'speciesName'],
      joiner: ' ',
    }),
    genusLatinName: TextProperty({ required: true }),
    speciesName: TextProperty({ required: true }),
    commonName: TextProperty({ required: true }),
  },
})

const apples = Genus.create({ latinName: 'Malus', commonName: 'Apples' })
const domesticApples = Species.create<'latinName'>({
  commonName: 'Apples',
  genusLatinName: apples.latinName,
  speciesName: 'domestica',
})

const id = await domesticApples.get.latinName()
console.info(id)
// Malus domestica
```

In this situation, the latinName for species is not passed in, but calculated from the two other properties. This becomes the primary key for this object, which is unique.

[Documentation](https://monolithst.github.io/functional-models/functions/index.properties.DenormalizedIntegerProperty.html)
