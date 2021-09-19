const assert = require('chai').assert
const flatMap = require('lodash/flatMap')
const { Given, When, Then } = require('@cucumber/cucumber')
const { Model, Property, arrayProperty, validation } = require('../../index')

const MODEL_DEFINITIONS = {
  TestModel1: Model('TestModel1', {
    name: Property({ required: true }),
    type: Property({ required: true, isString: true }),
    flag: Property({ required: true, isNumber: true }),
  }),
  ArrayModel1: Model('ArrayModel1', {
    arrayProperty: Property({
      isArray: true,
      validators: [validation.arrayType(validation.TYPE_PRIMATIVES.integer)],
    }),
  }),
  ArrayModel2: Model('ArrayModel2', {
    arrayProperty: Property({ isArray: true }),
  }),
  ArrayModel3: Model('ArrayModel3', {
    arrayProperty: arrayProperty({}),
  }),
  ArrayModel4: Model('ArrayModel4', {
    arrayProperty: arrayProperty({
      choices: [4, 5, 6],
      validators: [validation.arrayType(validation.TYPE_PRIMATIVES.integer)],
    }),
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
    arrayProperty: [1, 2, 3, 4, 5],
  },
  ArrayModelData2: {
    arrayProperty: 'a-string',
  },
  ArrayModelData3: {
    arrayProperty: ['a-string', 'a-string2'],
  },
  ArrayModelData4: {
    arrayProperty: ['a-string', 1, {}, true],
  },
  ArrayModelData5: {
    arrayProperty: [4, 5, 5, 5, 6],
  },
  ArrayModelData6: {
    arrayProperty: [4, 5, 5, 5, 6, 1],
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
