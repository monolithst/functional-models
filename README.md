# Functional Models

![Unit Tests](https://github.com/monolithst/functional-models/actions/workflows/ut.yml/badge.svg?branch=master)
![Feature Tests](https://github.com/monolithst/functional-models/actions/workflows/feature.yml/badge.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/monolithst/functional-models/badge.svg?branch=master)](https://coveralls.io/github/monolithst/functional-models?branch=master)

Love functional javascript/typescript but still like composing objects/models? This is the library for you.

This library empowers the creation of pure JavaScript function based models that can be used on a client, a web frontend, and/or a backend all the same time. Use this library to create models that can be reused everywhere.

This library is fully supportive of both Typescript and Javascript. In fact, the typescript empowers some really sweet dynamic type checking, and autocomplete! It handles validation as well.

Functional Models was born out of the enjoyment and power of working with Django models.

# Primary Features

- Define models that have properties, methods, and methods on the model itself.
- Create instances of models
- Validate model instances
- ORM ready via the functional-models-orm package, with DynamoDb, Mongo, in-memory datastores supported.
- Many common properties out of the box.
- Supports foreign keys, 1 to 1 as well as 1 to many (via an Array).
- Supports custom primary key name. (id is used by default)
- Supports different model namings, (plural, singular, display), and the ability to customize them.

## Simple JavaScript Example Usage

    const {
      BaseModel: Model,
      DateProperty,
      NumberProperty,
      TextProperty,
    } = require('functional-models')

    // Create your model. Standard is to use a plural name.
    const Trucks = Model('Trucks', {
      properties: {
        // id: UniqueId(), # this property is provided for free!
        make: TextProperty({ maxLength: 20, minLength: 3, required: true}),
        model: TextProperty({ maxLength: 20, minLength: 3, required: true}),
        color: TextProperty({
          maxLength: 10,
          minLength: 3,
          choices: ['red', 'green', 'blue', 'black', 'white'],
        }),
        year: NumberProperty({ maxValue: 2500, minValue: 1900}),
        lastModified: DateProperty({ autoNow: true}),
      }
    })

    // Create an instance of the model.
    const myTruck = Trucks.create({ make: 'Ford', model: 'F-150', color: 'white', year: 2013})


    // Get the properties of the model instance.
    console.log(await myTruck.get.id())     // a random uuid NOTE: this is a promise by default
    console.log(myTruck.get.make())   // 'Ford'
    console.log(myTruck.get.model())  // 'F-150'
    console.log(myTruck.get.color())  // 'white'
    console.log(myTruck.get.year())   // 2013

    // Get a raw javascript object representation of the model.
    const obj = await myTruck.toObj()
    console.log(obj)
    /*
    {
      "id": "a-random-uuid",
      "make": "Ford",
      "model": "F-150",
      "color": "white",
      "year": 2013
    }
    */

    // Create a copy of the model from the raw javascript object.
    const sameTruck = Truck.create(obj)
    console.log(await myTruck.get.id())     // same as above.
    console.log(myTruck.get.make())   // 'Ford'
    console.log(myTruck.get.model())  // 'F-150'
    console.log(myTruck.get.color())  // 'white'
    console.log(myTruck.get.year())   // 2013

    // Validate the model. An empty object, means no errors.
    const errors = await sameTruck.validate()
    console.log(errors) // {}

    const newTruck = Truck({ make: 'Ford', model: 'F-150', color: 'white', year: 20130})
    const errors2 = await newTruck.validate()
    console.log(errors2)

    // Key is the property's name, and an array of validation errors for that property.
    // {"year": ['Value is too long']}

## Simple TypeScript Example Usage

While functional-mode3ls works very well and easy without TypeScript, using typescript empowers
modern code completion engines to show the properties/methods on models and model instances.
Libraries built ontop of functional-models is encouraged to use TypeScript, while applications,
may or may not be as useful, given the overhead of typing. NOTE: Behind the covers functional-models
typing, is extremely strict, and verbose, which can make it somewhat difficult to work with, but
it provides the backbone of expressive and clear typing.

    import {
      BaseModel as Model,
      DateProperty,
      NumberProperty,
      TextProperty,
    } from 'functional-models'

    // Create your model's type
    type TruckType = {
      /*
      * id: string # this property is provided for free. No need to put. If using a custom
      *     primary key, the property needs to be explicit.
      */
      make: string,
      model: string,
      color: string,
      year?: number, // NOTE: Clearly indicates a property is optional.
      lastModified: Date,
    }

    // Create your model. Standard is to use a plural name.
    const Trucks = Model<TruckType>('Trucks', {
      properties: {
        // id: UniqueId(), # this property is provided for free!
        make: TextProperty({ maxLength: 20, minLength: 3, required: true}),
        model: TextProperty({ maxLength: 20, minLength: 3, required: true}),
        color: TextProperty({
          maxLength: 10,
          minLength: 3,
          choices: ['red', 'green', 'blue', 'black', 'white'],
        }),
        year: NumberProperty({ maxValue: 2500, minValue: 1900}),
        lastModified: DateProperty({ autoNow: true}),
      }
    })

    // Create an instance of the model.
    const myTruck = Trucks.create({ make: 'Ford', model: 'F-150', color: 'white', year: 2013})

    // Will cause a typescript error because "make" is a string, not a number.
    const myTruck2 = Trucks.create({ make: 5, model: 'F-150', color: 'white', year: 2013})

    // Will NOT cause a typescript error because year is optional.
    const myTruck = Trucks.create({ make: 'Ford', model: 'F-150', color: 'white' })


    // Will cause a typescript error because model is not implemented, even though its required.
    const Trucks2 = Model<TruckType>('Trucks2', {
      properties: {
        make: TextProperty({ maxLength: 20, minLength: 3, required: true}),
        color: TextProperty({
          maxLength: 10,
          minLength: 3,
          choices: ['red', 'green', 'blue', 'black', 'white'],
        }),
        year: NumberProperty({ maxValue: 2500, minValue: 1900}),
        lastModified: DateProperty({ autoNow: true}),
      }
    })

## Validation

Validation is baked into the functional-models framwork. Both individual properties as well as an entire model instance can be covered by validators. The following are the interfaces for a validator. Validation overall is a combination of property validator components as well as model validator components. These components combine together to create a complete validation picture of a model.

Here is an example of a model instance failing validation.

    // Call .validate() on the model, and await its result.
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

### Property validators

A property validator validates the value of a property. The inputs are the value, a model instance, the JavaScript object representation of the model, and optional configurations that are passed into the validator. The return can either be a string error or undefined if there are no errors. This function can be asynchronous, such as doing database lookups.

    /**
    * An example validator function that only allows the value of 5.
    * @constructor
    * @param {string} value - The value to be tested.
    * @param {string} instance - A model instance, which can be used for cross referencing.
    * @param {string} instanceData - The JavaScript object representation of the model.
    * @param {string} configurations - An optional configuration object passed in as part of validating.
    * @return {string|undefined} - If error, returns a string, otherwise returns undefined.
    */
    const valueIsFiveValidator = (
      value, // any kind of value.
      instance, // A ModelInstance,
      instanceData: JavaScript object representation,
      configurations: {}
    ) =>  {
      return value === 5
        ? undefined
        : 'Value is not 5'
    }

    /**
    * An example async validator function that checks a database using an object passed into the configurations.
    * @constructor
    * @param {string} value - The value to be tested.
    * @param {string} instance - A model instance, which can be used for cross referencing.
    * @param {string} instanceData - The JavaScript object representation of the model.
    * @param {string} configurations - An optional configuration object passed in as part of validating.
    * @return {Promise<string|undefined>} - Returns a promise, If error, returns a string, otherwise returns undefined.
    */
    const checkDatabaseError = async (
      value, // any kind of value.
      instance, // A ModelInstance,
      instanceData: JavaScript object representation,
      configurations: {}
    ) =>  {
      const result = await configurations.someDatabaseObj.check(value)
      if (result) {
        return 'Some sort of database error'
      }
      return undefined
    }

### Model Validators

Model validators allows one to check values across a model, ensuring that multiple values work together. The inputs are the model instance, the JavaScript object representation, and optional configurations. The return can either be a string error or undefined if there are no errors. This function can be asynchronous, such as doing database lookups.

    /**
    * An example model validator that checks to see if two properties have the same value.
    * @constructor
    * @param {string} instance - A model instance, used for cross referencing.
    * @param {string} instanceData - The JavaScript object representation of the model.
    * @param {string} configurations - An optional configuration object passed in as part of validating.
    * @return {string|undefined} - If error, returns a string, otherwise returns undefined.
    */
    const checkForDuplicateValues = (
      instance, // A ModelInstance,
      instanceData: JavaScript object representation,
      configurations: {}
    ) =>  {
      if(instanceData.firstProperty === instanceData.secondProperty) {
        return 'Both properties must have different values'
      }
      return undefined
    }

## Properties and Custom Properties

There are numerous properties that are supported out of the box that cover most data modeling needs. It is also very easy to create custom properties that encapsulate unique choices
validation requirements, etc.

### List of Properties Out-Of-The-Box

#### UniqueId

A UUID Property.

#### NaturalIdProperty

An id that is composed of other properties on an object. It is "natural" in the sense that it is
not an arbitrary id, but rather a mixture of properties that make up a unique instance. This is often
useful for when creating a "key" property.

NOTE: This property is never automatically updated if the properties changed. It is recommended that
any model that has a NaturalIdProperty should be deleted and then re-created rather than "updated" if
any property changes that make up the key composition.

#### DateProperty

A property for dates. Includes the ability to "autoNow".

#### ArrayProperty

An array property which can be used to limit types within it.

#### IntegerProperty

A property for integers.

#### TextProperty

A text or string property.

#### ConstantValueProperty

A property that contains a single, unchanging, static value.

#### NumberProperty

A property for float/number types.

#### ObjectProperty

A property that has a JavaScript object. (Not a foreign key references)

#### EmailProperty

An email property.

#### BooleanProperty

A true or false value property.

#### ModelReferenceProperty

A property that references another property. (Think Foreign Key)

#### AdvancedModelReferenceProperty

A fuller more advanced property for referencing other properties. Useful for typescripting.

#### DenormalizedProperty

A value that is calculated and save if it doesn't exist, using other values for a model instance. This property adds a `isDenormalized:true` to the property's config, as well as a `calculate()` function to the property itself.

NOTE: If the value is provided as part of the instance, it is not re-calculated. If you want to re-calculate it, you must use either the property's method `calculate()` method to get the value and replace the existing OR pass in undefined for the property.

<strong>Incremental data creation such as GUI forms:</strong>

If you are incrementally creating and validating model data, such as a GUI form, you should make your denormalization callback understand that there may be properties that are required, but are not present (yet). What this means, is if you need a particular property's value to be part of the denormalization value, but it isn't there, you should check for the value, and if not there, return undefined. This will allow it to be recalculated later.

<strong>A Strong Word of Caution</strong>

Generally, we would recommend not using this as a primary key in a database. However, if you want to use a DenormalizedProperty as primary key in a database and you want to make changes to an instance, you need to delete the previous entry and then recreate it for every update. A dynamic primary key is not tracked between changes.

<strong>Example</strong>

```typescript
import { DenormalizedProperty } from 'functional-models/src/properties'
import { TypedJsonObj } from 'functional-models/interfaces'

// Your base data
type Greeting = {
  name: 'Dolly',
  greeting: 'Hello',
  displayName?: string
}

// Create your model
const Greetings = Model<Greeting>('Greetings', {
  properties: {
    name: TextProperty(),
    greeting: TextProperty(),
    displayName: DenormalizedProperty<string>("TextProperty", (modelData: Greeting) => {
      return `${modelData.greeting} ${modelData.name}`
    }),
  }
})

// Create Your Instance
const instance = Model<Greeting>.create({
  name: 'Dolly',
  greeting: 'Hello',
})

// Let's look at the displayName property
const value = await instance.get.displayName()
console.info(value) // Hello Dolly

// Here is the object as a whole
const data = await instance.toObj()
console.info(data) // { name: 'Dolly', greeting: 'Hello', displayName: 'Hello Dolly' }

// DON"T TRY TO CHANGE THE MODEL THIS WAY. It doesn't work.
const newData = {
  ...data,
  name: 'Fred',
}
const instanceBad = Model<Greeting>.create(newData)
const badValue = await instance.get.displayName()
console.info(badValue) // Hello Dolly   - this does not change!!!

// "A better way"
const newDataGood = {
  ...data,
  name: 'Fred',
  displayName: undefined
}
const instanceGood = Model<Greeting>.create(newDataGood)
const goodValue = await instance.get.displayName()
console.info(goodValue) // Hello Fred    - Expected
```
