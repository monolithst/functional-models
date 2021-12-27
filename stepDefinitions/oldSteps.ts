import { assert } from 'chai'
import flatMap from 'lodash/flatMap'
import { Given, When, Then } from '@cucumber/cucumber'
import {
  BaseModel,
  UniqueId,
  TextProperty,
  Property,
  WrapperModelMethod,
  WrapperInstanceMethod,
  ArrayProperty,
  validation,
} from '../src'
import {ModelInstanceMethod, ModelInstanceMethodTyped, ModelMethod, ModelMethodTyped, FunctionalModel, Model, ModelInstance, MethodArgs} from '../src/interfaces'

const instanceToString = <T extends FunctionalModel>() => WrapperInstanceMethod<T>((model, modelInstance) => {
  return `${modelInstance.getModel().getName()}-Instance`
})

const instanceToJson = <T extends FunctionalModel>() => WrapperInstanceMethod<T>(async (model, modelInstance) => {
  return JSON.stringify(await modelInstance.toObj())
})

const modelToString = <T extends FunctionalModel>() => WrapperModelMethod<T>(model => {
  return `${model.getName()}-[${Object.keys(
    model.getModelDefinition().properties
  ).join(',')}]`
})

const modelWrapper = <T extends FunctionalModel>() => WrapperModelMethod<T>(model => {
  return model
})

type FunctionalModel1Type = {
  name: string
  modelWrapper: ModelMethod
  toString: ModelInstanceMethod,
  toJson: ModelInstanceMethod
}

const modelWrapper1 : ModelInstanceMethod = modelWrapper<any>()

const MODEL_DEFINITIONS = {
  FunctionModel1: BaseModel<FunctionalModel1Type>
  ('FunctionModel1', {
    properties: {
      name: TextProperty({ required: true }),
    },
    modelMethods: {
      modelWrapper: modelWrapper<any>(),
    },
    instanceMethods: {
      toString: instanceToString<any>(),
      toJson: instanceToJson<any>(),
    },
  }),
  TestModel1: BaseModel<{ name: string; type: string; flag: number }>(
    'TestModel1',
    {
      properties: {
        name: Property('Text', { required: true }),
        type: Property('Type', { required: true, isString: true }),
        flag: Property('Flag', { required: true, isNumber: true }),
      },
    }
  ),
  ArrayModel1: BaseModel<{ ArrayProperty: readonly number[] }>('ArrayModel1', {
    properties: {
      ArrayProperty: Property('Array', {
        isArray: true,
        validators: [validation.arrayType(validation.TYPE_PRIMITIVES.integer)],
      }),
    },
  }),
  ArrayModel2: BaseModel('ArrayModel2', {
    properties: {
      ArrayProperty: Property('Array', { isArray: true }),
    },
  }),
  ArrayModel3: BaseModel('ArrayModel3', {
    properties: {
      ArrayProperty: ArrayProperty({}),
    },
  }),
  ArrayModel4: BaseModel('ArrayModel4', {
    properties: {
      ArrayProperty: ArrayProperty({
        choices: [4, 5, 6],
        validators: [validation.arrayType(validation.TYPE_PRIMITIVES.integer)],
      }),
    },
  }),
}

const MODEL_INPUT_VALUES = {
  FunctionModelData1: {
    id: 'my-id',
    name: 'function-model-name',
  },
  TestModel1a: {
    name: 'my-name',
    type: 1,
    flag: '1',
  },
  TestModel1b: {
    name: 'my-name',
    type: 'a-type',
    flag: 1,
  },
  ArrayModelData1: {
    ArrayProperty: [1, 2, 3, 4, 5],
  },
  ArrayModelData2: {
    ArrayProperty: 'a-string',
  },
  ArrayModelData3: {
    ArrayProperty: ['a-string', 'a-string2'],
  },
  ArrayModelData4: {
    ArrayProperty: ['a-string', 1, {}, true],
  },
  ArrayModelData5: {
    ArrayProperty: [4, 5, 5, 5, 6],
  },
  ArrayModelData6: {
    ArrayProperty: [4, 5, 5, 5, 6, 1],
  },
}

const EXPECTED_FIELDS = {
  TestModel1b: ['name', 'type', 'flag'],
}

Given(
  'the {word} has been created, with {word} inputs provided',
  function (modelDefinition, modelInputValues) {
    // @ts-ignore
    const def = MODEL_DEFINITIONS[modelDefinition]
    this.model = def

    // @ts-ignore
    const input = MODEL_INPUT_VALUES[modelInputValues]
    if (!def) {
      throw new Error(`${modelDefinition} did not result in a definition`)
    }
    if (!input) {
      throw new Error(`${modelInputValues} did not result in an input`)
    }
    this.instance = def.create(input)
  }
)

When('functions.validate is called', function () {
  // @ts-ignore
  return this.instance.validate().then(x => {
    this.errors = x
  })
})

Then('an array of {int} errors is shown', function (errorCount) {
  const errors = flatMap(Object.values(this.errors))
  if (errors.length !== errorCount) {
    console.error(this.errors)
  }
  assert.equal(errors.length, errorCount)
})

Given('{word} model is used', function (modelDefinition) {
  // @ts-ignore
  const def = MODEL_DEFINITIONS[modelDefinition]
  if (!def) {
    throw new Error(`${modelDefinition} did not result in a definition`)
  }
  this.modelDefinition = def
  this.model = def
})

When('{word} data is inserted', function (modelInputValues) {
  // @ts-ignore
  const input = MODEL_INPUT_VALUES[modelInputValues]
  if (!input) {
    throw new Error(`${modelInputValues} did not result in an input`)
  }
  this.instance = this.modelDefinition.create(input)
})

Then('{word} expected property is found', function (properties) {
  // @ts-ignore
  const propertyArray = EXPECTED_FIELDS[properties]
  if (!propertyArray) {
    throw new Error(`${properties} did not result in properties`)
  }
  // @ts-ignore
  propertyArray.forEach(key => {
    if (!(key in this.instance.get)) {
      throw new Error(`Did not find ${key} in model`)
    }
  })
})

Then('the {word} property is called on the model', function (property) {
  this.results = this.instance.get[property]()
})

Then('the array values match', async function (table) {
  const expected = JSON.parse(table.rowsHash().array)
  assert.deepEqual(await this.results, expected)
})

Then('{word} property is found', function (propertyKey) {
  assert.isFunction(this.instance.get[propertyKey])
})

Then('{word} instance function is found', function (instanceFunctionKey) {
  assert.isFunction(this.instance.methods[instanceFunctionKey])
})

Then('{word} model function is found', function (modelFunctionKey) {
  assert.isFunction(this.model.methods[modelFunctionKey])
})
