import { BaseModel } from '../../src/models'
import {
  Model,
  ModelInstance,
  ModelInstanceMethod,
  ModelMethod,
} from '../../src/interfaces'

type MyType = {
  modelMethod: ModelMethod<MyType>
  method: ModelInstanceMethod<MyType>
  method2: ModelInstanceMethod<MyType>
  method3: ModelInstanceMethod<MyType>
}

describe('miscellaneous', () => {
  describe('model creation', () => {
    it('should not throw an exception if a model with methods is created', () => {
      const myModel = BaseModel<MyType>('MyType', {
        properties: {},
        modelMethods: {
          modelMethod: (model: Model<MyType>) => {},
        },
        instanceMethods: {
          method: (instance: ModelInstance<MyType>, model: Model<MyType>) => {},
          method2: (
            instance: ModelInstance<MyType>,
            model: Model<MyType>
          ) => {},
          method3: (
            instance: ModelInstance<MyType>,
            model: Model<MyType>
          ) => {},
        },
      })
    })
  })
})
