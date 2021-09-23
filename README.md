# Functional Models

![Unit Tests](https://github.com/monolithst/functional-models/actions/workflows/ut.yml/badge.svg?branch=master)
![Feature Tests](https://github.com/monolithst/functional-models/actions/workflows/feature.yml/badge.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/monolithst/functional-models/badge.svg?branch=master)](https://coveralls.io/github/monolithst/functional-models?branch=master)

Love functional javascript but still like composing objects/models? This is the library for you.
This library empowers the creation of pure JavaScript function based models that can be used on a client, a web frontend, and/or a backend all the same time. Use this library to create readable, read-only, models.

## Example Usage

    const {
      field,
      constantValueField,
      textField,
      dateField,
      integerField,
      uniqueId,
      createModel,
      validation,
    }= require('functional-models')

    const Truck = createModel({
      type: constantValueField('truck'),
      id: uniqueId({required: true}),
      make: textField({ maxLength: 20, minLength: 3, required: true}),
      model: textField({ maxLength: 20, minLength: 3, required: true}),
      color: textField({ maxLength: 10, minLength: 3, validators: [
        validation.meetsRegex(/Red/),
      ]}),
      year: integerField({ maxValue: 2500, minValue: 1900}),
      lastModified: dateField({ autoNow: true}),
    })


    const myTruck = Truck({ make: 'Ford', model: 'F-150', color: 'White', year: 2013})

    console.log(await myTruck.getId())     // a random uuid
    console.log(await myTruck.getMake())   // 'Ford'
    console.log(await myTruck.getModel())  // 'F-150'
    console.log(await myTruck.getColor())  // 'White'
    console.log(await myTruck.getYear())   // 2013

    const asJson = await myTruck.functions.toJson()
    console.log(asJson)
    /*
    {
      "id": "a-random-uuid",
      "make": "Ford",
      "model": "F-150",
      "color": "White",
      "year": 2013
    }
    */

    const sameTruck = Truck(asJson)
    console.log(await sameTruck.getId())     // same uuid as above
    console.log(await sameTruck.getMake())   // 'Ford'
    console.log(await sameTruck.getModel())  // 'F-150'
    console.log(await sameTruck.getColor())  // 'White'
    console.log(await sameTruck.getYear())   // 2013

    // Validation
    const errors = await sameTruck.functions.validate.model() // {}

    const newTruck = Truck({ make: 'Ford', model: 'F-150', color: 'White', year: 20130})
    const errors2 = await newTruck.functions.validate.model()
    console.log(errors2)
    // {"year": 'Value is too long'}
