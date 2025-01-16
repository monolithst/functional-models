# How To Extend Models
Functional Models was created so that the `ModelType` could be expanded. What this means, is that every Model that gets created, might have additional functions that can be consumed down stream. An example implementation of this is with `functional-models-orm`. This extension package, adds database functionality like `save()` and `delete()`.

## A Useful Tip
This can be extremely useful for when you want to swap out ModelFactory's depending on context. For example you have one model factory for a frontend and one that handles backend. You can write the models once, and use them in both contexts, adding rich functionality to either or depending on context.

## Model Factory
In order to extend a `ModelType` you need to create your own `ModelFactory`. Within that factory, it should combine the extended functions to the final model factory.

```typescript
import merge from 'lodash/merge'
import { 
  Model, 
  ModelFactory, 
  ModelOptions, 
  TextProperty, 
  DataDescription, 
  MinimalModelDefinition, 
  PrimaryKeyUuidProperty 
} from 'functional-models'

// 1. We need a type that will contain our added functions. This is useful for passing along downstream.
type MyExtendedModel = {
  /**
   * We are making it so that every model has its own unique id.
   */
  getModelId: () => string,
}

// 2. Create a ModelFactory, pass in our type, which extends the implementation throughout the framework.
const CustomModel: ModelFactory<MyExtendedModel> = <TData extends DataDescription>(
  modelDefinitions: MinimalModelDefinition<TData>,
  options?: ModelOptions<TData, MyExtendedModel>
) => {
  const model = Model(modelDefinitions)

  const getModelId = () => {
    const name = model.getName()
    return `${name}-unique-name`.toLowerCase()
  }

  return merge(model, {
    getModelId,
  })
}

// 3. Lets create a data type
type User = {
  id: string,
  name: string,
}

// 4. Now using our custom model factory create a model.
const Users = CustomModel<User>({
  pluralName: 'Users',
  namespace: '@my-package',
  properties: {
    id: PrimaryKeyUuidProperty(),
    name: TextProperty({ required: true }),
  },
})

// 5. It has our function 
const uniqueId = Users.getModelId()
console.info(uniqueId)
// @my-package/users-unique-name

```
