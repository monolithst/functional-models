# How To Create Custom Properties
With Functional Models you can create custom properties. These properties can be reused again and again.

It is actually very easy to do so. Here is a few examples.


## Creating a Phone Number Property
For this example we want to create a property for phone numbers. We are going to assume we are just doing US phone numbers in this example, but its up to you how you want to implement it.

```typescript
import { PropertyConfig, TextProperty, DateValueType, meetsRegex, PrimaryKeyUuidProperty } from 'functional-models'

// https://stackoverflow.com/questions/4338267/validate-phone-number-with-javascript
const PHONE_REGEX = /^[\+]?[0-9]{0,3}\W?+[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im


const PhoneNumberProperty = (
  config: PropertyConfig<string> = {}
) => TextProperty(merge(config, {
  validators: [
    meetsRegex(PHONE_REGEX, 'g', 'Invalid phone format'),
  ]
}))

const User = {
  id: string,
  name: string,
  phoneNumber: string
}

const Users = Model({
  pluralName: 'Users',
  namespace: 'auth',
  properties: {
    id: PrimaryKeyUuidProperty(),
    name: TextProperty(), 
    phoneNumber: PhoneNumberProperty(),
  }
})

const validUser = Users.create<'id'>({ name: 'Milo', phoneNumber: '123-456-7890'})
console.info(validUser.validate())
// undefined

const invalidUser1 = Users.create<'id'>({ name: 'Nika', phoneNumber: 1234578890})
console.info(invalidUser1.validate())
//{ phoneNumber: ['Not a string']}

const invalidUser2 = Users.create<'id'>({ name: 'Joan', phoneNumber: '123-45-6789'})
console.info(invalidUser2.validate())
//{ phoneNumber: ['Invalid phone format']}
```

### Custom ValueType
Tied with Properties are the ValueType's. A ValueType is often used to queue other code to handle the data in a certain way. Such as rendering a certain kind of HTML form for inputting the data. Let's add to our above example, by creating our own ValueType.

```typescript
import { PropertyConfig, Property, DateValueType, meetsRegex, ValueType, PrimaryKeyUuidProperty, TextProperty, } from 'functional-models'

// https://stackoverflow.com/questions/4338267/validate-phone-number-with-javascript
const PHONE_REGEX = /^[\+]?[0-9]{0,3}\W?+[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im

enum CustomValueType {
  phoneNumber='phoneNumber'
}
type MyValueTypes = CustomValueType | ValueType

const PhoneNumberProperty = (
  config: PropertyConfig<string> = {}
) =>
  Property<string>(
    CustomValueType.phoneNumber,
    merge(config, {
      validators: [
        meetsRegex(PHONE_REGEX, 'g', 'Invalid phone format'),
      ]
    }),
  )

const User = {
  id: string,
  name: string,
  phoneNumber: string
}

const Users = Model({
  pluralName: 'Users',
  namespace: 'auth',
  properties: {
    id: PrimaryKeyUuidProperty(),
    name: TextProperty(),
    phoneNumber: PhoneNumberProperty(),
  }
})

const validUser = Users.create<'id'>({ name: 'Milo', phoneNumber: '123-456-7890'})

// We can pass our validUser model around, and even shuffle it up among other models.
// We can sift through the properties of (any) model and see what type it is.
const ourProperty = validUser.getModelDefinition().properties.phoneNumber
const whatTypeIsThis = ourProperty.getPropertyType()

console.info(whatTypeIsThis)
// phoneNumber

```

