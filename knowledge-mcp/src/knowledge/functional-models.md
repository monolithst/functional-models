# Functional Models: AI Coding Knowledge Base

## Overview

Functional Models is a functional, type-safe, cross-platform modeling library for TypeScript/JavaScript. It enables you to define, validate, and serialize data models with rich property types, robust validation, and optional ORM/database integration. Designed for both frontend and backend, it is optimized for AI code generation and automation.

---

## Quickstart Example

```typescript
import {
  Model,
  TextProperty,
  IntegerProperty,
  ModelReferenceProperty,
  PrimaryKeyUuidProperty,
  DatetimeProperty,
} from 'functional-models'

// AI: Always use types, NEVER interfaces
type Author = { id: string; name: string }
type Book = {
  id: string
  title: string
  year: number
  author: Author
  lastModified?: Date
}

const Authors = Model<Author>({
  pluralName: 'Authors',
  namespace: 'library',
  properties: {
    id: PrimaryKeyUuidProperty(),
    name: TextProperty({ required: true, maxLength: 50 }),
  },
})

const Books = Model<Book>({
  pluralName: 'Books',
  namespace: 'library',
  properties: {
    id: PrimaryKeyUuidProperty(),
    title: TextProperty({ required: true }),
    year: IntegerProperty({ minValue: 1900, maxValue: 2100 }),
    author: ModelReferenceProperty<Author>(Authors, { required: true }),
    lastModified: DatetimeProperty({ autoNow: true }),
  },
})

// AI: We have to add the id here (or others), so typescript doesnt complain that we are not including the auto-generated field
const rowling = Authors.create<'id'>({ name: 'J.K. Rowling' })
const hp = Books.create<'id'>({ title: 'HP1', year: 1997, author: rowling })
const errors = await hp.validate() // undefined if valid
const obj = await hp.toObj<Book>() // serializes for storage/transport, type-safe
```

**AI: Always await async property getters and .validate()/.toObj(). Prefer specifying the type parameter for .toObj().**

---

## Canonical Domain Model Usage Example

A typical domain model file (e.g., `./domain/models/Books.ts`):

```typescript
import {
  Model,
  TextProperty,
  IntegerProperty,
  PrimaryKeyUuidProperty,
} from 'functional-models'

type Book = { id: string; title: string; year: number }

const create = ({ Model }) => {
  return Model<Book>({
    pluralName: 'Books',
    namespace: 'library',
    properties: {
      id: PrimaryKeyUuidProperty(),
      title: TextProperty({ required: true }),
      year: IntegerProperty({ minValue: 1900, maxValue: 2100 }),
    },
  })
}

export { create }
```

**AI: This pattern is used for all domain models. The `create` function is imported and called with the Model factory/context.**

---

## Properties Reference

| Property                         | Description / Usage Example                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| `TextProperty`                   | Simple string. `TextProperty({ required: true, maxLength: 50 })`                      |
| `BigTextProperty`                | Large string. `BigTextProperty()`                                                     |
| `NumberProperty`                 | Float/number. `NumberProperty({ minValue: 0 })`                                       |
| `IntegerProperty`                | Integer. `IntegerProperty({ minValue: 0, maxValue: 100 })`                            |
| `YearProperty`                   | Year (0-3000). `YearProperty()`                                                       |
| `DateProperty`                   | Date (no time). `DateProperty()`                                                      |
| `DatetimeProperty`               | Date+time. `DatetimeProperty({ autoNow: true })`                                      |
| `ArrayProperty`                  | Array of any. `ArrayProperty<string>()`                                               |
| `SingleTypeArrayProperty`        | Array of one type. `SingleTypeArrayProperty('string')`                                |
| `ObjectProperty`                 | JSON object. `ObjectProperty<{ foo: string }>()`                                      |
| `BooleanProperty`                | Boolean. `BooleanProperty()`                                                          |
| `ConstantValueProperty`          | Fixed value. `ConstantValueProperty('Text', 'fixed')`                                 |
| `PrimaryKeyUuidProperty`         | UUID primary key. `PrimaryKeyUuidProperty()`                                          |
| `ModelReferenceProperty`         | Foreign key. `ModelReferenceProperty<OtherType>(OtherModel, { required: true })`      |
| `AdvancedModelReferenceProperty` | Advanced reference (custom extension).                                                |
| `DenormalizedProperty`           | Calculated, memoized value. `DenormalizedProperty('Text', (data) => data.a + data.b)` |
| `DenormalizedTextProperty`       | Calculated string. `DenormalizedTextProperty((data) => data.name.toUpperCase())`      |
| `DenormalizedNumberProperty`     | Calculated number. `DenormalizedNumberProperty((data) => data.count * 2)`             |
| `DenormalizedIntegerProperty`    | Calculated integer. `DenormalizedIntegerProperty((data) => Math.round(data.value))`   |
| `NaturalIdProperty`              | Composite key. `NaturalIdProperty(['foo', 'bar'], '-')`                               |
| `EmailProperty`                  | Email with validation. `EmailProperty({ required: true })`                            |
| `LastModifiedDateProperty`       | (ORM) Auto-updating date. `LastModifiedDateProperty()`                                |

**AI: Always use property creators, not raw objects. References may require fetchers for backend/ORM.**

---

## Validators Reference

| Validator              | Description / Usage Example                             |
| ---------------------- | ------------------------------------------------------- |
| `isRequired`           | Value must be present. `{ required: true }`             |
| `maxLength`            | Max string length. `{ maxLength: 50 }`                  |
| `minLength`            | Min string length. `{ minLength: 3 }`                   |
| `maxValue`             | Max number. `{ maxValue: 100 }`                         |
| `minValue`             | Min number. `{ minValue: 0 }`                           |
| `choices`              | Allowed values. `{ choices: ['a', 'b'] }`               |
| `meetsRegex`           | Regex match. `{ validators: [meetsRegex(/^[A-Z]+$/)] }` |
| `isString`             | Must be string. `{ isString: true }`                    |
| `isNumber`             | Must be number. `{ isNumber: true }`                    |
| `isInteger`            | Must be integer. `{ isInteger: true }`                  |
| `isBoolean`            | Must be boolean. `{ isBoolean: true }`                  |
| `isArray`              | Must be array. `{ isArray: true }`                      |
| `isDate`               | Must be date. `{ validators: [isDate] }`                |
| `unique` (ORM)         | Unique in DB. `{ unique: 'fieldName' }`                 |
| `uniqueTogether` (ORM) | Unique combo. `uniqueTogether(['a', 'b'])`              |

**AI: Most validators are set via property config. Use custom validators for advanced logic.**

---

## Validator Usage Examples

### Property Validator Example

```typescript
import { isRequired, maxLength } from 'functional-models/validation'

const value1 = 'hello'
const value2 = ''

const requiredResult = isRequired(value1) // undefined (valid)
const requiredResult2 = isRequired(value2) // 'A value is required' (invalid)

const maxLen = maxLength(5)
const maxResult = maxLen('hello') // undefined (valid)
const maxResult2 = maxLen('toolong') // 'The maximum length is 5' (invalid)
```

### Model Validator Example

```typescript
// Assume you have a model instance
const errors = await myModelInstance.validate()
if (!errors) {
  // valid
} else {
  // errors is an object mapping property names to error arrays
  console.error(errors)
}
```

---

## ModelErrors<T> Type Breakdown

- **Type:**
  ```typescript
  type ModelErrors<T> = {
    [Property in keyof Partial<T>]: string[]
  } & { overall?: string[] }
  ```
- **Example Output (invalid):**
  ```json
  {
    "title": ["A value is required"],
    "year": ["The minimum is 1900"],
    "overall": ["Custom model-level error"]
  }
  ```
- **Example Output (valid):**
  ```json
  undefined
  ```
  **AI: Always check for undefined (valid) vs. object (invalid).**

---

## Types Reference

- `ModelType<T>`: The model factory object. Has `.create()`, `.getName()`, `.getModelDefinition()`, etc.
- `ModelInstance<T>`: An instance of a model. Has `.get`, `.toObj()`, `.validate()`, etc.
- `PropertyInstance<T>`: A property definition object.
- `DataDescription`: The shape of your data type.
- `CreateParams<T>`: Input type for `.create()`.
- `ModelFactory`: Type for custom model factories.

**AI: Types are strict. Use generics for cross-domain models.**

---

### ModelType<T>

```typescript
/**
 * The model factory object. Used to create model instances and access model metadata.
 * @template T - DataDescription (your data type)
 */
type ModelType<T> = {
  /**
   * Create a new model instance. IgnoreProps allows omitting auto-generated fields.
   * Example: const inst = MyModel.create<'id'>({ ... })
   */
  create<IgnoreProps extends string = ''>(
    data: CreateParams<T, IgnoreProps>
  ): ModelInstance<T>
  /** Returns unique model name (namespace + pluralName). */
  getName(): string
  /** Returns model metadata. */
  getModelDefinition(): ModelDefinition<T>
  /** Returns the primary key value from data. */
  getPrimaryKey(data: T): string | number
  /** Returns API metadata for codegen/docs. */
  getApiInfo(): Required<ApiInfo>
}
```

### ModelInstance<T>

```typescript
/**
 * An instance of a model, with property access, validation, and serialization.
 * @template T - DataDescription (your data type)
 */
type ModelInstance<T> = {
  /** Accessors for each property. Example: inst.get.name() */
  get: PropertyGetters<T>
  /** Serializes to a plain object. Prefer specifying the type parameter for best type inference. */
  toObj<R extends T = T>(): Promise<ToObjectResult<R>>
  /** Validates the instance. Returns undefined if valid. */
  validate(options?): Promise<ModelErrors<T> | undefined>
  /** Gets the instance's primary key. */
  getPrimaryKey(): string | number
  /** Returns the backing model. */
  getModel(): ModelType<T>
  /** Returns reference property accessors. */
  getReferences(): ModelReferenceFunctions
  /** Returns property validators. */
  getValidators(): PropertyValidators<T>
}
```

### ModelDefinition<T>

```typescript
/**
 * Describes the structure and metadata of a model, including naming, properties, validation, and API information.
 * @template T - DataDescription (your data type)
 */
type ModelDefinition<T extends DataDescription> = Readonly<{
  pluralName: string // The plural name for the model (e.g., 'Books').
  namespace: string // The namespace or domain the model belongs to (e.g., 'library').
  properties: PropertiesList<Required<T>> // The properties that make up the model, keyed by property name.
  primaryKeyName: string // The property name used as the unique identifier (e.g., 'id').
  modelValidators: readonly ModelValidatorComponent<T>[] // Validators that apply to the model as a whole.
  singularName: string // The singular name for the model (e.g., 'Book').
  displayName: string // A human-friendly display name for the model.
  description: string // A description of what the model represents.
  api?: Partial<ApiInfoPartialRest> // (Optional) Raw API information for code generation and documentation.
}>
```

---

## AI Callouts & Common Pitfalls

- **Always await async property getters, `.validate()`, and `.toObj()`.**
- **Do not mutate model instances; always create new ones.**
- **Use property creators, not raw objects.**
- **Types are strict; use generics for cross-domain models.**
- **For `toObj()`, specify the type parameter for best results.**

---

## ORM Integration

- **Enable ORM:** Use `createOrm({ datastoreAdapter })` to get an ORM Model factory and fetcher.
- **Backend pattern:**
  ```typescript
  import { createOrm } from 'functional-models'
  const orm = createOrm({ datastoreAdapter })
  const Users = orm.Model<User>({ ... })
  ```
- **Frontend pattern:**
  ```typescript
  import { Model, noFetch } from 'functional-models'
  const Users = Model<User>({ ... })
  ```
- **CRUD Example:**
  ```typescript
  const user = Users.create({ ... })
  const saved = await user.save() // ORM only
  const found = await Users.retrieve(saved.getPrimaryKey())
  const results = await Users.search(query)
  await user.delete()
  ```
- **AI: Always await ORM methods. Instance methods like `.save()`/`.delete()` only exist on ORM-backed models.**

---

## OrmModel Function Examples

### Retrieve Example

```typescript
const foundBook = await Books.retrieve('some-primary-key')
if (foundBook) {
  console.info(foundBook.toObj())
} else {
  console.info('Book not found')
}
```

### Delete Example

```typescript
await Books.delete('some-primary-key')
console.info('Book deleted')
```

### Search Example

```typescript
const searchResults = await Books.search(
  queryBuilder()
    .property('year', 2000, {
      type: DatastoreValueType.number,
      equalitySymbol: EqualitySymbol.gt,
    })
    .compile()
)
console.info(searchResults)
```

### Bulk Insert Example

```typescript
const newBooks = [
  Books.create({ title: 'New Book 1', year: 2021, author: someAuthor }),
  Books.create({ title: 'New Book 2', year: 2022, author: someAuthor }),
]
await Books.bulkInsert(newBooks)
console.info('Books inserted')
```

---

## OrmModelInstance Function Examples

### Save Example

```typescript
const newBook = Books.create({
  title: 'New Book',
  year: 2023,
  author: someAuthor,
})
const savedBook = await newBook.save()
console.info('Book saved:', savedBook.toObj())
```

### Delete Example

```typescript
const bookToDelete = await Books.retrieve('some-primary-key')
if (bookToDelete) {
  await bookToDelete.delete()
  console.info('Book deleted')
} else {
  console.info('Book not found')
}
```

---

## OrmSearch and QueryBuilder

### OrmSearch

- **Purpose:** Describes a search query for ORM models.
- **Type:**
  ```typescript
  type OrmSearch = {
    take?: number
    sort?: { key: string; order: 'asc' | 'dsc' }
    page?: any
    query: readonly QueryTokens[]
  }
  ```
- **Equality Symbols:**
  - `=` (eq), `<` (lt), `<=` (lte), `>` (gt), `>=` (gte)
- **Value Types:**
  - `string`, `number`, `date`, `object`, `boolean`
- **Builder Usage:**
  ```typescript
  import {
    queryBuilder,
    EqualitySymbol,
    DatastoreValueType,
  } from 'functional-models'
  // Text search
  const textQuery = queryBuilder().property('name', 'Alice').compile()
  // Number search
  const numQuery = queryBuilder()
    .property('age', 30, {
      type: DatastoreValueType.number,
      equalitySymbol: EqualitySymbol.gte,
    })
    .compile()
  // Date search
  const dateQuery = queryBuilder()
    .datesBefore('createdAt', new Date('2024-01-01'))
    .compile()
  // Complex query
  const complex = queryBuilder()
    .property('name', 'Alice')
    .and()
    .property('age', 30, {
      type: DatastoreValueType.number,
      equalitySymbol: EqualitySymbol.gte,
    })
    .or()
    .datesAfter('createdAt', new Date('2023-01-01'))
    .compile()
  ```
- **Manual Object Usage:**
  ```typescript
  const query = {
    take: 10,
    query: [
      {
        type: 'property',
        key: 'name',
        value: 'Alice',
        valueType: 'string',
        equalitySymbol: '=',
      },
      'AND',
      {
        type: 'property',
        key: 'age',
        value: 30,
        valueType: 'number',
        equalitySymbol: '>=',
      },
      'OR',
      {
        type: 'datesAfter',
        key: 'createdAt',
        date: '2023-01-01',
        valueType: 'date',
        options: { equalToAndAfter: true },
      },
    ],
  }
  ```
- **datesBefore/datesAfter:**
  - `datesBefore(key, date, { equalToAndBefore })` — Finds records before (or before and including) a date.
  - `datesAfter(key, date, { equalToAndAfter })` — Finds records after (or after and including) a date.
- **AI Callouts:**
  - The `query` array must alternate between property/date queries and 'AND'/'OR'.
  - Use builder for type safety; manual objects for flexibility.
  - All values must match the expected types (see OrmSearch type).
  - Use correct equality symbols and value types for your data.

---

## Advanced / See Also

- [How to Use the ORM](https://monolithst.github.io/functional-models/documents/How_to_Use_the_ORM.html)
- [How to Extend Models/Instances](https://monolithst.github.io/functional-models/documents/Advanced:%20How%20to%20Extend%20Models.html)
- [How to Create Custom Properties](https://monolithst.github.io/functional-models/documents/How_to_Create_Custom_Properties.html)
- [Denormalized Properties](https://monolithst.github.io/functional-models/documents/Advanced:%20Denormalized%20Values.html)
