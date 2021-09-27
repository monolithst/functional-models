const assert = require('chai').assert
const flatMap = require('lodash/flatMap')
const { Given, When, Then } = require('@cucumber/cucumber')
const {
  Model,
  UniqueId,
  TextProperty,
  Function,
  Property,
  ArrayProperty,
  validation,
} = require('../../index')

const instanceToString = Function(modelInstance => {
  return `${modelInstance.getModel().getName()}-Instance`
})

const instanceToJson = Function(async modelInstance => {
  return JSON.stringify(await modelInstance.functions.toObj())
})

const modelToString = Function(model => {
  return `${model.getName()}-[${Object.keys(model.getProperties()).join(',')}]`
})

const modelWrapper = Function(model => {
  return model
})

const MODEL_DEFINITIONS = {
  FunctionModel1: Model(
    'FunctionModel1',
    {
      id: UniqueId({ required: true }),
      name: TextProperty({ required: true }),
    },
    {
      modelFunctions: {
        modelWrapper,
        toString: modelToString,
      },
      instanceFunctions: {
        toString: instanceToString,
        toJson: instanceToJson,
      },
    }
  ),
  TestModel1: Model('TestModel1', {
    name: Property({ required: true }),
    type: Property({ required: true, isString: true }),
    flag: Property({ required: true, isNumber: true }),
  }),
  ArrayModel1: Model('ArrayModel1', {
    ArrayProperty: Property({
      isArray: true,
      validators: [validation.arrayType(validation.TYPE_PRIMATIVES.integer)],
    }),
  }),
  ArrayModel2: Model('ArrayModel2', {
    ArrayProperty: Property({ isArray: true }),
  }),
  ArrayModel3: Model('ArrayModel3', {
    ArrayProperty: ArrayProperty({}),
  }),
  ArrayModel4: Model('ArrayModel4', {
    ArrayProperty: ArrayProperty({
      choices: [4, 5, 6],
      validators: [validation.arrayType(validation.TYPE_PRIMATIVES.integer)],
    }),
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
  TestModel1b: ['getName', 'getType', 'getFlag', 'meta', 'functions'],
}

Given(
  'the {word} has been created, with {word} inputs provided',
  function (modelDefinition, modelInputValues) {
    const def = MODEL_DEFINITIONS[modelDefinition]
    this.model = def

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
  return this.instance.functions.validate.model().then(x => {
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
  const def = MODEL_DEFINITIONS[modelDefinition]
  if (!def) {
    throw new Error(`${modelDefinition} did not result in a definition`)
  }
  this.modelDefinition = def
  this.model = def
})

When('{word} data is inserted', function (modelInputValues) {
  const input = MODEL_INPUT_VALUES[modelInputValues]
  if (!input) {
    throw new Error(`${modelInputValues} did not result in an input`)
  }
  this.instance = this.modelDefinition.create(input)
})

Then('{word} expected property is found', function (properties) {
  const propertyArray = EXPECTED_FIELDS[properties]
  if (!propertyArray) {
    throw new Error(`${properties} did not result in properties`)
  }
  propertyArray.forEach(key => {
    if (!(key in this.instance)) {
      throw new Error(`Did not find ${key} in model`)
    }
  })
})

Then('the {word} property is called on the model', function (property) {
  return this.instance[property]().then(result => {
    this.results = result
  })
})

Then('the array values match', function (table) {
  const expected = JSON.parse(table.rowsHash().array)
  assert.deepEqual(this.results, expected)
})

Then('{word} property is found', function (propertyKey) {
  assert.isFunction(this.instance[propertyKey])
})

Then('{word} instance function is found', function (instanceFunctionKey) {
  assert.isFunction(this.instance.functions[instanceFunctionKey])
})

Then('{word} model function is found', function (modelFunctionKey) {
  assert.isFunction(this.model[modelFunctionKey])
})
