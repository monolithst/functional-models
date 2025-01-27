# How to Use the ORM

You can back your models with a database easily by using the orm system provided. The work is provided by the [OrmModelFactory](https://monolithst.github.io/functional-models/interfaces/index.orm.types.OrmModelFactory.html). This is a special ModelFactory that wraps Models and their Instances with the following functions:

<b>Models</b>

```
save() - Saves an instance passed in
delete() - Deletes an instance with the given primary key
retrieve() - Gets a saved instance by its primary key
search() - Searches for instances
searchOne()* - Seaches for one instance
createAndSave()* - Creates and then saves an instance
bulkInsert()* - Bulk inserts many instances
count()* - Counts the number of saved instances

*If the datastoreAdapter does not implement these functions, they are done in-memory.
```

<b>Model Instances</b>

```
save() - Saves this instance
delete() - Deletes this instance
```

You can then do common datastore functionalities like creating new instances and saving them, or searching a datastore for records, or deleting an existing record.

## First: You Need a Datastore Adapter

In order to use the orm you need to have a datastore adapter. This is an interface that adapts the unique datastore functions to the orm system. There are a numerous supported datastore adapters and can be found here:

- [In-Memory](https://github.com/monolithst/functional-models-orm-memory)
- [Mongo](https://github.com/monolithst/functional-models-orm-mongo)
- [Elasticsearch/Opensearch](https://github.com/monolithst/functional-models-orm-elastic)
- [SQL (Mysql/PgSql/Sqlite)](https://github.com/monolithst/functional-models-orm-elastic)
- [Dynamodb](https://github.com/monolithst/functional-models-orm-dynamo)

## Create an Orm Instance

```typescript
import { createOrm } from 'functional-models'

// Create your datastore Adapter
const datastoreAdapter = {}

// Create orm
const orm = createOrm({ datastoreAdapter })

console.info(orm)
// {
//  Model,
//  fetcher,
//}
```

## ORM Details

### Create / Update

```javascript
import {
  PrimaryKeyUuidProperty,
  TextProperty,
  createOrm,
} from 'functional-models'

// Create an orm instance
const myOrm = createOrm({ datastoreAdapter: {} })

// Create your model class from the orm itself, just like with functional-models
const Trains = myOrm.Model({
  pluralName: 'Trains',
  namespace: 'my-namespace',
  id: PrimaryKeyUuidProperty(),
  name: TextProperty(),
})

// Create a model as usual.
const modelInstance = Trains.create({ name: 'Yellow Train' })

// Save this to a datastore, get back a clean version of the model.
const savedModel = await modelInstance.save()

console.log(await savedModel.toObj())
/*
{
  id: 'generated-unique-id',
  name: 'hello world',
}
*/
```

Note: The implementation of an "update" is the same as create. Because of the "functional" nature of this library, objects cannot be "updated". This library would work well in a situation like a React/Redux that provides for a mechanism for distributing changed state throughout the application.

### Retrieve (one, via primary key)

```javascript
// Retrieve the model instance by its id.
const modelInstance = await Trains.retrieve('my-model-id')
```

### Search (Retrieve Many)

A search is made up a number of queries. These queries can either be created "by hand" or through the use of a structured builder. Both will be shown.

```javascript
import { queryBuilder, property, take } from 'functional-models'

// Create an orm query.
const query = queryBuilder()
  .property('name', 'hello', { startsWith: true })
  .take(3)
  .compile()

const searchResults = await Trains.search(query)
console.log(searchResults)
/*
{
  page: undefined,  // if there is a multi-page situation, this is the DatastoreProvider specific object, for getting the next page.
  instances: [
    {...} // matched functional-model instance.
    {...} // matched functional-model instance.
    {...} // matched functional-model instance.
  ]
}
*/

// You can also do this manually by writing the query.
const searchResults = await Trains.search({
  take: 3,
  query: [property('name', 'hello', { startsWith: true })],
})
console.log(searchResults)
/*
{
  page: undefined,
  instances: [
    {...} // matched functional-model instance.
    {...} // matched functional-model instance.
    {...} // matched functional-model instance.
  ]
}
*/
```

#### Manual vs Builder Queries

Either approach can produce queries. Manual can be a bit less verbose and can be a bit more readable, but the builder helps ensure that the structure is correct.

The following are the functions that can be used to do queries by hand, that are ultimately used by the builder approach.

```javascript
import {
  take,
  pagination,
  sort,
  and,
  or,
  property,
  datesBefore,
  datesAfter,
} from 'functional-models'

const query = {
  sort: sort('my-key', 'asc'),
  pagination: pagination('any-value'),
  take: take(1),
  query: [
    property('my-key', 'the-value'),
    and(),
    property('another-key', 'another-value'),
    and(),
    datesAfter('date-key', '2024-01-01T00:00:00.000Z'),
    or(),
    datesBefore('date-key', '2025-01-01T00:00:00.000Z'),
  ],
}
```

### Additional Helpful Property Query Functions

Additional property based query functions are provided to make it easier and more readable to do queries.

```javascript
import { booleanQuery, textQuery, numberQuery } from 'functional-models'

const myQuery = {
  query: [
    textQuery('my-key', 'my-value', { caseSensitive: true }),
    'AND',
    booleanQuery('my-bool', true),
    'AND',
    numberQuery('my-int', 5),
  ],
}
```

### Delete

```javascript
await Trains.delete('an-existing-id')
```

## Supported data types

The following are the supported data types (DatastoreValueType):

```javascript
enum DatastoreValueType {
  string = 'string',
  number = 'number',
  date = 'date',
  object = 'object',
  boolean = 'boolean',
}
```

## ORM Query Searching

The following is a number of examples on how to do search queries.

Unlike previous versions, functional-models 3.0+ now supports complex search queries that support nested AND and OR statements.

### Search Example: Search by a value of one property AND another property.

```javascript
import { queryBuilder, property, and } from 'functional-models'

/*
Query:
Give me all of type MyModels, that has a name "the-name" (case insensitive), and has a textField property that starts with "something-in-the-field"
*/
const query = queryBuilder()
  .property('name', 'the-name')
  .and()
  .property('textField', 'something-in-the-field', { startsWith: true })
  .compile()

const searchResults = await MyModels.search(query)

// You can also do...
const searchResults2 = await MyModels.search({
  query: [
    property('name', 'the-name'),
    and(),
    property('textField', 'something-in-the-field', { startsWith: true }),
  ],
})
```

### Search Example: Numbers

```javascript
import {
  queryBuilder,
  DatastoreValueType,
  EqualitySymbol,
} from 'functional-models'

/*
Query:
Give me every instance of type MyModels, that has a value of property "a" greater than 5
*/

const query = queryBuilder()
  .property('a', 5, {
    type: DatastoreValueType.number,
    equalitySymbol: EqualitySymbol.GT,
  })
  .compile()

const searchResults = await MyModels.search(query)
```

### Search Example: Limiting Results

```javascript
import { queryBuilder } from 'functional-models'

/*
Query:
Give me up to 10 instances of type MyModels, that has a name "the-models-name" (case insensitive), and has a textField property that starts with "something-in-the-field"
*/
const query = queryBuilder()
  .property('name', 'the-models-name')
  .and()
  .property('textField', 'something-in-the-field', { startsWith: true })
  .take(10)
  .compile()

const searchResults = await MyModels.search(query)
```

### Search Example: Paging

```javascript
import { queryBuilder } from 'functional-models'

/*
Query:
Give me up to 10 instances of type MyModels, that has a name "the-models-name" (case insensitive), and has a textField property that starts with "something-in-the-field", starting at the given page.
*/
const pageDataFromAnotherQuery = 'page-151'

const query = queryBuilder()
  .property('name', 'the-models-name')
  .and()
  .property('textField', 'something-in-the-field', { startsWith: true })
  .pagination(pageDataFromAnotherQuery)
  .take(10)
  .compile()

const searchResults = await MyModels.search(query)
```

### Search Example: Before a given date

```javascript
import { queryBuilder } from 'functional-models'

/*
Query:
Give me every instance of type MyModels, that has a name "the-models-name" (case insensitive), and has a textField property that starts with "something-in-the-field", that was updated before 2022-01-01
*/

const query = queryBuilder()
  .property('name', 'the-models-name')
  .and()
  .property('textField', 'something-in-the-field', { startsWith: true })
  .and()
  .datesBefore('dateUpdated', new Date('2022-01-01'), {
    equalToAndBefore: false,
  })
  .compile()

const searchResults = await MyModels.search(query)
```

### Search Example: Before a given date INCLUDING that date

```javascript
import { queryBuilder } from 'functional-models'

/*
Query:
Give me every instance of type MyModels, that has a name "the-models-name" (case insensitive), and has a textField property that starts with "something-in-the-field", that was updated before and including 2022-01-01
*/

const query = queryBuilder()
  .property('name', 'the-models-name')
  .and()
  .property('textField', 'something-in-the-field', { startsWith: true })
  .and()
  .datesBefore('dateUpdated', new Date('2022-01-01'))
  .compile()

const searchResults = await MyModels.search(query)
```

### Search Example: After a given date

```javascript
import { queryBuilder } from 'functional-models'

/*
Query:
Give me every instance of type MyModels, that has a name "the-models-name" (case insensitive), and has a textField property that starts with "something-in-the-field", that was updated after 2022-01-01
*/

const query = queryBuilder()
  .property('name', 'the-models-name')
  .and()
  .property('textField', 'something-in-the-field', { startsWith: true })
  .and()
  .datesAfter('dateUpdated', new Date('2022-01-01'))
  .compile()

const searchResults = await MyModels.search(query)
```

### Search Example: Between given dates (including the dates)

```javascript
import { queryBuilder } from 'functional-models'

/*
Query:
Give me every instance of type MyModels, that has a name "the-models-name" (case insensitive), and has a textField property that starts with "something-in-the-field", that was updated between 2022-01-01 and 2022-02-01
*/

const query = queryBuilder()
  .property('name', 'the-models-name')
  .and()
  .property('textField', 'something-in-the-field', { startsWith: true })
  .and()
  .datesAfter('dateUpdated', new Date('2022-01-01'))
  .and()
  .datesBefore('dateUpdated', new Date('2022-02-01'))
  .compile()

const searchResults = await MyModels.search(query)
```

### Search Example: Sorting (Descending)

```javascript
import { queryBuilder } from 'functional-models'

/*
Query:
Give me every instance of type MyModels, that has a name "the-models-name" (case insensitive), and has a textField property that starts with "something-in-the-field", that was updated between 2022-01-01 and 2022-02-01, and sort it by the dateUpdated property, so that the newest is first.
*/

const query = queryBuilder()
  .property('name', 'the-models-name')
  .and()
  .property('textField', 'something-in-the-field', { startsWith: true })
  .and()
  .datesAfter('dateUpdated', new Date('2022-01-01'))
  .and()
  .datesBefore('dateUpdated', new Date('2022-02-01'))
  .and()
  .sort('dateUpdated', 'dsc')
  .compile()

const searchResults = await MyModels.search(query)
```

### Search Example: Sorting (Ascending)

```javascript
import { queryBuilder } from 'functional-models'

/*
Query:
Give me every instance of type MyModels, that has a name "the-models-name" (case insensitive), and has a textField property that starts with "something-in-the-field", that was updated between 2022-01-01 and 2022-02-01, and sort it by the dateUpdated property, so that the oldest is first.
*/

const query = queryBuilder()
  .property('name', 'the-models-name')
  .and()
  .property('textField', 'something-in-the-field', { startsWith: true })
  .and()
  .datesAfter('dateUpdated', new Date('2022-01-01'))
  .and()
  .datesBefore('dateUpdated', new Date('2022-02-01'))
  .and()
  .sort('dateUpdated')
  .compile()

const searchResults = await MyModels.search(query)
```

### Search Example: Multiple values of a single property

```javascript
import { queryBuilder } from 'functional-models'

/*
Query:
Give me every instance of type MyModels where the name is model-1 or model-2.
*/

const query = queryBuilder()
  .property('name', 'model-1')
  .or()
  .property('name', 'model-2')
  .compile()

const searchResults = await MyModels.search(query)
```

### Search Example: ORing multiple properties (with numbers)

```javascript
import {
  queryBuilder,
  DatastoreValueType,
  EqualitySymbol,
} from 'functional-models'

/*
Query:
Give me every instance of type MyModels where the value of property "a" is greater than 5, and the value of property "b" is less than 10, and the value of property "c" is greater-than-or-equal to 100
*/

const query = queryBuilder()
  .property('a', 5, {
    type: DatastoreValueType.number,
    equalitySymbol: EqualitySymbol.gt,
  })
  .or()
  .property('b', 10, {
    type: DatastoreValueType.number,
    equalitySymbol: EqualitySymbol.gt,
  })
  .or()
  .property('c', 100, {
    type: DatastoreValueType.number,
    equalitySymbol: EqualitySymbol.gte,
  })
  .compile()

const searchResults = await MyModels.search(query)
```

### Search Example: Complex Queries

Complex queries are made very simple with the query builder and the query syntax. This allows for unlimited nested ANDs and OR statements.

```javascript
import { queryBuilder, DatastoreValueType, EqualitySymbol, property, and, or } from 'functional-models'

/*
Query:
Give me every instance of type MyModels where:
a is greater than 5 and less than 10
AND
(b is either "yes" or "no" AND c is either "blue" or "green")
*/

const query = queryBuilder()
    .property('a', 5, { type: DatastoreValueType.number, equalitySymbol: EqualitySymbol.gt })
    .or()
    .property('b', 10, { type: DatastoreValueType.number, equalitySymbol: EqualitySymbol.lt })
    .and()
    .complex(innerBuilder => innerBuilder
      .complex(b => b
        .property('b', 'yes')
        .or()
        .property('b', 'no')
      )
      .and()
      .complex(b => b
        .property('c', 'blue')
        .or()
        .property('c', 'green')
      )
    )
    .compile()
const searchResults = await MyModels.search(query)

// This can also be done manually.
const searchResults2 = await MyModels.search({
  query: [
    [
      property('a', 5, { type: DatastoreValueType.number, equalitySymbol: EqualitySymbol.gt }),
      'OR', // or()
      property('b', 10, { type: DatastoreValueType.number, equalitySymbol: EqualitySymbol.lt })
    ],
    'AND', // and()
    [
      [
        property('b', 'yes'),
        'OR', // or()
        property('b', 'no'),
      ],
      'AND' // and()
      [
        property('c', 'blue'),
        'OR', // or()
        property('c', 'green'),
      ],
    ]
  ]
})

```
