# Functional Models

![Unit Tests](https://github.com/monolithst/functional-models/actions/workflows/ut.yml/badge.svg?branch=master)
![Feature Tests](https://github.com/monolithst/functional-models/actions/workflows/feature.yml/badge.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/monolithst/functional-models/badge.svg?branch=master)](https://coveralls.io/github/monolithst/functional-models?branch=master)

Love functional javascript but still like composing objects/models? This is the library for you.
This library empowers the creation of pure JavaScript function based models that can be used on a client, a web frontend, and/or a backend all the same time. Use this library to create readable, read-only, models.

## Example Usage

    const {
      smartObject,
      property,
      typed,
      uniqueId,
    }= require('functional-models')

    const Truck = ({ id, make, model, color, year }) => smartObject([
      uniqueId(id),
      typed('truck'),
      property('make', make),
      property('model', model),
      property('color', color),
      property('year', year),
    ])


    const myTruck = Truck({ make: 'Ford', model: 'F-150', color: 'White', year: 2013})

    console.log(myTruck.getId())     // a random uuid
    console.log(myTruck.getMake())   // 'Ford'
    console.log(myTruck.getModel())  // 'F-150'
    console.log(myTruck.getColor())  // 'White'
    console.log(myTruck.getYear())   // 2013

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
    console.log(sameTruck.getId())     // same uuid as above
    console.log(sameTruck.getMake())   // 'Ford'
    console.log(sameTruck.getModel())  // 'F-150'
    console.log(sameTruck.getColor())  // 'White'
    console.log(sameTruck.getYear())   // 2013
