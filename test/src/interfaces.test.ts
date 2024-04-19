import merge from 'lodash/merge'
import { Model, FunctionalModel, ModelInstance } from '../../src/interfaces'
import { BaseModel, TextProperty } from '../../src'

describe('/src/interfaces.ts', () => {
  describe('#Model', () => {
    it('should allow CustomModel<T> to be passed into a function that requires a Model<T>', () => {
      type MyTypes = { name: string }
      type CustomModel<T extends FunctionalModel> = Model<T> & {
        customFunc: (s: string) => string
      }
      const myTypesCustomModel: CustomModel<MyTypes> = merge(
        BaseModel<MyTypes>('MyTypes', {
          properties: {
            name: TextProperty(),
          },
        }),
        {
          customFunc: (s: string) => `Hello ${s}`,
        }
      )

      const myFunction = <T extends FunctionalModel>(data: Model<T>) => {}
      myFunction(myTypesCustomModel)
    })
    it('should allow CustomModelInstance<T, TModel> to be passed into a function that requires a ModelInstance<T, TModel>', () => {
      type MyTypes = { name: string }
      type CustomModel<T extends FunctionalModel> = Model<T> & {
        customFunc: (s: string) => string
      }
      const myTypesCustomModel: CustomModel<MyTypes> = merge(
        BaseModel<MyTypes>('MyTypes', {
          properties: {
            name: TextProperty(),
          },
        }),
        {
          customFunc: (s: string) => `Hello ${s}`,
        }
      )
      const instance = myTypesCustomModel.create({ name: 'my-name' })

      const myFunction = <T extends FunctionalModel, TModel extends Model<T>>(
        instance: ModelInstance<T, TModel>
      ) => {}
      myFunction(instance)
    })
  })
})
