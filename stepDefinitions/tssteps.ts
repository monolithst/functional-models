import { Given, When, Then } from '@cucumber/cucumber'
import { assert } from 'chai'
import { BaseModel } from '../src/models'
import { WrapperInstanceMethod, WrapperModelMethod } from '../src/methods'
import {
  Model,
  FunctionalModel,
  ModelInstanceMethodTyped,
  ModelMethodTyped,
  ModelInstanceInputData,
  Nullable,
} from '../src/interfaces'
import { ObjectProperty, TextProperty, UniqueId } from '../src/properties'

type MyTSType = {
  name: string
  data: FunctionalModel
  notRequired?: Nullable<string>
  myMethod: ModelInstanceMethodTyped<MyTSType>
  myModelMethod: ModelMethodTyped<MyTSType>
}

const TE_FULL_TEST = () => {
  const m = BaseModel<MyTSType>('TSFullTests', {
    properties: {
      id: UniqueId({ value: 'my-unique-id' }),
      name: TextProperty({ required: true }),
      data: ObjectProperty({}),
      notRequired: TextProperty({}),
    },
    instanceMethods: {
      myMethod: WrapperInstanceMethod<MyTSType>((instance, args) => {
        return 'InstanceMethod'
      }),
    },
    modelMethods: {
      myModelMethod: WrapperModelMethod<MyTSType>((model, args) => {
        return 'ModelMethod'
      }),
    },
  })
  return m
}

const TE_FULL_TEST_1 = () => {
  return {
    id: 'my-unique-id',
    name: 'My name',
    data: { my: 'data' },
    notRequired: null,
  }
}

const DATA_SET: { [s: string]: () => ModelInstanceInputData<MyTSType> } = {
  TE_FULL_TEST_1,
}

const MODEL_SET: { [s: string]: () => Model<MyTSType> } = {
  TE_FULL_TEST,
}

Given('model {word} is used', function (modelName: string) {
  this.theModel = MODEL_SET[modelName]()
})

When(
  'a model instanced is created is called on model with {word}',
  async function (dataName: string) {
    this.theModelInstance = this.theModel.create(DATA_SET[dataName]())
  }
)

When('toObj is called on the model instance', async function () {
  this.results = await this.theModelInstance.toObj()
})

Then('the results match {word} obj data', function (dataName) {
  const data = DATA_SET[dataName]()
  assert.deepEqual(data, this.results)
})

When('instance method {word} is called', async function (methodName) {
  this.instanceMethodActual = await this.theModelInstance.methods[methodName]()
})

Then('the result of instance method is {word}', function (expected) {
  const actual = this.instanceMethodActual
  assert.equal(actual, expected)
})

When('model method {word} is called', async function (methodName) {
  this.modelMethodActual = await this.theModel.methods[methodName]()
})

Then('the result of model method is {word}', function (expected) {
  const actual = this.modelMethodActual
  assert.equal(actual, expected)
})

When('validate is called on model instance', async function () {
  this.validationActual = await this.theModelInstance.validate()
})

Then('the model instance validated successfully', function () {
  const expected = {}
  assert.deepEqual(this.validationActual, expected)
})
