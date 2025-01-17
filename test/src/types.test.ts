import merge from 'lodash/merge'
import { ModelType, DataDescription, ModelInstance } from '../../src/types'
import { TextProperty, PrimaryKeyUuidProperty } from '../../src/properties'
import { Model } from '../../src/models'

describe('/src/types.ts', () => {
  describe('#Model', () => {
    it('should allow CustomModel<T> to be passed into a function that requires a Model<T>', () => {
      type MyTypes = { id: string; name: string }
      type CustomModel<T extends DataDescription> = ModelType<T> & {
        customFunc: (s: string) => string
      }
      const myTypesCustomModel: CustomModel<MyTypes> = merge(
        Model<MyTypes>({
          pluralName: 'MyTypes',
          namespace: 'functional-models',
          properties: {
            id: PrimaryKeyUuidProperty(),
            name: TextProperty(),
          },
        }),
        {
          customFunc: (s: string) => `Hello ${s}`,
        }
      )

      const myFunction = <T extends DataDescription>(data: ModelType<T>) => {}
      myFunction(myTypesCustomModel)
    })
    it('should allow CustomModelInstance<T, TModel> to be passed into a function that requires a ModelInstance<T, TModel>', () => {
      type MyTypes = { id: string; name: string }
      type CustomModel<T extends DataDescription> = ModelType<T> & {
        customFunc: (s: string) => string
      }
      const myTypesCustomModel: CustomModel<MyTypes> = merge(
        Model<MyTypes>({
          pluralName: 'MyTypes',
          namespace: 'functional-models',
          properties: {
            id: PrimaryKeyUuidProperty(),
            name: TextProperty(),
          },
        }),
        {
          customFunc: (s: string) => `Hello ${s}`,
        }
      )
      const instance = myTypesCustomModel.create<'id'>({ name: 'my-name' })

      const myFunction = <
        T extends DataDescription,
        TModel extends ModelType<T>,
      >(
        instance: ModelInstance<T, TModel>
      ) => {}
      myFunction(instance)
    })
  })
})
