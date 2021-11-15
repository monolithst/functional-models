import {Given, When, Then} from '@cucumber/cucumber'
import { assert }  from 'chai'
import { Model } from '../../src/models'
import { InstanceFunction } from '../../src/functions'
import {IModel, IModelInstanceFunction, FunctionalModel} from '../../src/interfaces'
import {TextProperty} from "../../src/properties"

type simpleObj = {
  [s: string]: any
}


const TE_FULL_TEST = () => {
  const m = Model<{
    name: string,
    myMethod: () => any,
  }>('TSFullTests', {
    name: TextProperty({}),
    myMethod: InstanceFunction<any>((instance) => {})
  })
  m.create({name: 'text'}).functions.myMethod()
}

const TE_FULL_TEST_1 = () => {
}

const DATA_SET : simpleObj = {
  TE_FULL_TEST_1,
}

const MODEL_SET : simpleObj = {
  TE_FULL_TEST,
}

Given('model {word} is used', async function(modelName: string) {
  this.model = await MODEL_SET[modelName]()
})

When('a model instanced is created is called on model with {word}', async function(dataName: string){
  this.modelInstance = this.model.create(await DATA_SET[dataName])
})

When('toObj is called on the model instance', async function() {
  this.results = await this.modelInstance.toObj()
})

Then('the results match {word} obj data', function(dataName) {
  const data = DATA_SET[dataName]
  assert.deepEqual(data, this.results)
})
