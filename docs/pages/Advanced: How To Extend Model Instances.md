# How To Extend Model Instances
In addition to being able to [Extending Models](./Advanced:%20How%20to%20Extend%20Models.md) you can also extend instances of models. This has been used in `functional-models-orm` to add CRUD functionality to the instance itself. (save, delete, etc)


## Model Factory
As with extending Models, everything occurs inside a custom ModelFactory. The `create()` function of the Model needs to be wrapped so that you can insert your added functionality.

```typescript
import merge from 'lodash/merge'
import {
  Model,
  ModelFactory,
  ModelOptions,
  TextProperty,
  DataDescription,
  MinimalModelDefinition,
  PrimaryKeyUuidProperty,
  CreateParams,
} from 'functional-models'

type MyExtendedInstance = {
  /**
   * A function that will check if this instance exists in the database or not.
   */
  existsInDatabase: () => Promise<boolean>
  /*
   * A function that "saves" our model to a database.
   */
  save: () => Promise<void>
}

// 2. Create a ModelFactory, pass in our type, which extends the implementation throughout the framework. NOTE: It is the second generic argument, the first is for model extensions (not used here).
const CustomModel =
  (databaseConnection: any): ModelFactory<object, MyExtendedInstance> =>
    <TData extends DataDescription>(
      modelDefinitions: MinimalModelDefinition<TData>,
      options?: ModelOptions<TData, object, MyExtendedInstance>
    ) => {
      const model = Model(modelDefinitions)

      const existsInDatabase =
        (instance: ModelInstance<TData>) => async (): Promise<boolean> => {
          // We use the underlying instance object to get information we need.
          const data = await instance.toObj()
          // We then use it to do something, like search a database in a custom way.
          const found = databaseConnection.search(data)
          return found
        }

      const save =
        (instance: ModelInstance<TData>) => async (): Promise<void> => {
          const data = await instance.toObj()
          await databaseConnection.save(data)
          return
        }

      // 3. We wrap the create function so that it injects our functions into the instance.
      const create = (params: CreateParams<'', TData>) => {
        const instance = model.create(params)
        return merge(instance, {
          existsInDatabase: existsInDatabase(instance),
          save: save(instance),
        }) as ModelInstance<TData, object, MyExtendedInstance>
      }

      return merge(model, {
        create,
      })
    }

// 4. Lets create a data type
type User = {
  id: string
  name: string
}

const myDatabaseConnection = {}

// 5. Now using our custom model factory create a model.
const Users = CustomModel(myDatabaseConnection)<User>({
  pluralName: 'Users',
  namespace: '@my-package',
  properties: {
    id: PrimaryKeyUuidProperty(),
    name: TextProperty({ required: true }),
  },
})

const user = Users.create<'id'>({ name: 'Henry' })

// 6. Use our function on the instance.
const exists = await user.existsInDatabase()
console.info(exists)
// false

await user.save()
const existsNow = await user.existsInDatabase()
console.info(existsNow)
// true

```
