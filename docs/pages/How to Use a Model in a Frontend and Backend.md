# How to Use a Model in a Frontend and Backend

The orm functionalities of `functional-models` makes it easy to use the same models in a frontend as well as a backend. All of this happens through the ModelFactory objects.

### Example:

We are going to create a system that has two models. `Users` and `Vendors`. We want to be able to reuse these models on a front end and a backend. The way we are going to do that is to change the ModelFactory that is used on the frontend versus the backend.

Each model is broken out into its own file, and then at the end we have our implementations.

<b>/src/auth/types.ts</b>

```typescript
export type User = Readonly<{
  email: string
  name: string
}>
```

<b>/src/auth/models/users.ts</b>

```typescript
import {
  EmailProperty,
  TextProperty,
  ormPropertyConfig,
} from 'functional-models'
import { User } from '../types'

export const create = ({ Model }: ModelConstructorProps) => {
  return Model({
    pluralName: 'Users',
    namespace: 'my-namespace',
    properties: {
      email: EmailProperty(
        ormPropertyConfig({ required: true, unique: 'email' })
      ),
      name: TextProperty(),
    },
    primaryKeyName: 'email',
  })
}
```

<b>/src/ecommerce/types.ts</b>

```typescript
export type Vendor = Readonly<{
  id: string
  name: string
  website: string
  category: string
  primaryContact: ModelReference<User>
}>
```

<b>/src/ecommerce/models/vendors.ts</b>

```typescript
import {
  PrimaryKeyUuidProperty,
  TextProperty,
  ModelWithReferencesConstructorProps,
  ModelReferenceProperty,
  ormPropertyConfig,
} from 'functional-models'
import { create as createUsers } from '../../auth/models/users'

export const create = ({
  Model,
  fetcher,
}: ModelWithReferencesConstructorProps) => {
  return Model({
    pluralName: 'Vendors',
    namespace: 'my-namespace',
    properties: {
      id: PrimaryKeyUuidProperty(),
      name: TextProperty({ required: true }),
      website: TextProperty(ormPropertyConfig({ required: true })),
      category: TextProperty(ormPropertyConfig({ unique: 'category' })),
      // We are creating a reference to users.
      primaryContact: ModelReferenceProperty<User>(
        // We have to get the model instance for user.
        // If you have the users in a difference datastore
        // you would want to pass Users into the constructor.
        createUsers({ Model }),
        {
          required: true,
          // We need to pass a fetcher to a ModelReferenceProperty
          fetcher,
        }
      ),
    },
    // We want vendors to be unique by their name and category
    uniqueTogether: ['name', 'category'],
  })
}
```

#### Where we tie it all together</b>

<b>Frontend: /frontend/src/models.ts</b>

```typescript
import { Model, noFetch } from 'functional-models'
import { auth, ecommerce } from 'our-library'
const main = () => {
  // We need to create a Model, fetcher structure
  const input = { Model, fetcher: noFetch }
  // Pass it to the model constructors
  return {
    Users: auth.models.users.create(input),
    Vendors: ecommerce.models.vendors.create(input),
  }
}
```

<b>Backend: /backend/src/models.ts</b>

```typescript
import { Model, noFetch, createOrm } from 'functional-models'
import { datastoreAdapter as mongoDatastore } from 'functional-models-orm-mongo'
import { auth, ecommerce } from 'our-library'

const main = () => {
  // Create our datastoreAdapter.
  const datastoreAdapter = mongoDatastore.create({})

  // Create an Orm
  const input = createOrm({ datastoreAdapter })

  // Pass it through just like the frontend
  return {
    Users: auth.models.users.create(input),
    Vendors: ecommerce.models.vendors.create(input),
  }
}
```
