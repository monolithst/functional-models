# (Soon) Denormalized Values

## DenormalizedProperty

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
