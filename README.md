# Functional Models
![CI](https://github.com/monolithst/functional-models/actions/workflows/ci.yml/badge.svg)
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


    const myTruck = Truck({ make: 'Ford', model: 'F-150', color: 'White', year: '2013})

    console.log(myTruck.getId())
    console.log(myTruck.getMake())
    console.log(myTruck.getModel())
    console.log(myTruck.getColor())
    console.log(myTruck.getYear())

    const asJson = await myTruck.functions.toJson()
    console.log("As pure Json")
    console.log(asJson)

    const duplicateTruck = Truck(asJson)

