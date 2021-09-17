const assert = require('chai').assert
const flatMap = require('lodash/flatMap')
const { Given, When, Then } = require('@cucumber/cucumber')
const { createModel, field, arrayField, validation } = require('../../index')

const MODEL_DEFINITIONS = {
  TestModel1: createModel({
    name: field({ required: true }),
    type: field({ required: true, isString: true }),
    flag: field({ required: true, isNumber: true }),
  }),
  ArrayModel1: createModel({
    arrayField: field({
      isArray: true,
      validators: [validation.arrayType(validation.TYPE_PRIMATIVES.integer)],
    }),
  }),
  ArrayModel2: createModel({
    arrayField: field({ isArray: true }),
  }),
  ArrayModel3: createModel({
    arrayField: arrayField({}),
  }),
}

const MODEL_INPUT_VALUES = {
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
    arrayField: [1, 2, 3, 4, 5],
  },
  ArrayModelData2: {
    arrayField: 'a-string',
  },
  ArrayModelData3: {
    arrayField: ['a-string', 'a-string2'],
  },
  ArrayModelData4: {
    arrayField: ['a-string', 1, {}, true],
  },
}

const EXPECTED_FIELDS = {
  TestModel1b: ['getName', 'getType', 'getFlag', 'meta', 'functions'],
}

Given(
  'the {word} has been created, with {word} inputs provided',
  function (modelDefinition, modelInputValues) {
    const def = MODEL_DEFINITIONS[modelDefinition]
    const input = MODEL_INPUT_VALUES[modelInputValues]
    if (!def) {
      throw new Error(`${modelDefinition} did not result in a definition`)
    }
    if (!input) {
      throw new Error(`${modelInputValues} did not result in an input`)
    }
    this.instance = def(input)
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
})

When('{word} data is inserted', function (modelInputValues) {
  const input = MODEL_INPUT_VALUES[modelInputValues]
  if (!input) {
    throw new Error(`${modelInputValues} did not result in an input`)
  }
  this.instance = this.modelDefinition(input)
})

Then('{word} expected fields are found', function (fields) {
  const propertyArray = EXPECTED_FIELDS[fields]
  if (!propertyArray) {
    throw new Error(`${fields} did not result in fields`)
  }
  propertyArray.forEach(key => {
    if (!(key in this.instance)) {
      throw new Error(`Did not find ${key} in model`)
    }
  })
})

Then('the {word} field is called on the model', function (field) {
  return this.instance[field]().then(result => {
    this.results = result
  })
})

Then('the array values match', function (table) {
  const expected = JSON.parse(table.rowsHash().array)
  assert.deepEqual(this.results, expected)
})
