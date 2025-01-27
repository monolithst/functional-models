import { assert } from 'chai'
import sinon from 'sinon'
import { LastModifiedDateProperty, createOrm as orm } from '../../../src'
import {
  Model,
  NumberProperty,
  TextProperty,
  PrimaryKeyUuidProperty,
} from '../../../src/index'
import { createDatastore } from './mocks'

describe('/src/orm/models.ts', () => {
  describe('#create()', () => {
    it('should throw an exception if no datastore is provided', () => {
      const datastoreProvider = null
      assert.throws(() => {
        // @ts-ignore
        const instance = orm({ datastoreAdapter: datastoreProvider })
      })
    })
    it('should create an object without exception if a datastoreProvider is passed', () => {
      const datastoreProvider = createDatastore()
      assert.doesNotThrow(() => {
        const instance = orm({ datastoreAdapter: datastoreProvider })
      })
    })
    it('should create an object without exception if a datastoreProvider and a Model is passed', () => {
      const datastoreProvider = createDatastore()
      assert.doesNotThrow(() => {
        const instance = orm({ datastoreAdapter: datastoreProvider, Model })
      })
    })

    describe('#Model()', () => {
      it('should pass the modelname to the Model', () => {
        const datastoreProvider = createDatastore()
        const instance = orm({ datastoreAdapter: datastoreProvider, Model })
        const model = instance.Model(
          {
            pluralName: 'MyModels',
            namespace: 'functional-models-orm',
            properties: {
              id: PrimaryKeyUuidProperty(),
            },
          },
          {}
        )
        const actual = model.getName()
        const expected = 'functional-models-orm-my-models'
        assert.deepEqual(actual, expected)
      })
      describe('#delete()', () => {
        it('should take a primary key and pass it and the model along', () => {
          it('should have functions.search', async () => {
            const datastoreProvider = createDatastore()
            const instance = orm({ datastoreAdapter: datastoreProvider, Model })
            const model = instance.Model(
              {
                pluralName: 'MyModels',
                namespace: 'functional-models-orm',
                properties: {
                  id: PrimaryKeyUuidProperty(),
                },
              },
              {}
            )
            await model.delete(5)
            const actual = datastoreProvider.delete.getCall(0).args
            const expected = [model, 5]
            assert.deepEqual(actual, expected)
          })
        })
      })
      it('should have functions.search', () => {
        const datastoreProvider = createDatastore()
        const instance = orm({ datastoreAdapter: datastoreProvider, Model })
        const model = instance.Model(
          {
            pluralName: 'MyModels',
            namespace: 'functional-models-orm',
            properties: {
              id: PrimaryKeyUuidProperty(),
            },
          },
          {}
        )
        const actual = model.search
        assert.isFunction(actual)
      })
      it('should allow not passing a modelOptions', () => {
        const datastoreProvider = createDatastore()
        const instance = orm({ datastoreAdapter: datastoreProvider, Model })
        assert.doesNotThrow(() => {
          instance.Model({
            pluralName: 'MyModels',
            namespace: 'functional-model-orm',
            properties: {
              id: PrimaryKeyUuidProperty(),
            },
          })
        })
      })
      it('should create a uniqueTogether validation when "uniqueTogether" is used', async () => {
        const datastoreProvider = createDatastore()
        datastoreProvider.search.resolves({
          instances: [
            { name: 'my-name', age: 1 },
            { name: 'another-name', age: 2 },
          ],
        })
        const instance = orm({ datastoreAdapter: datastoreProvider, Model })
        const model = instance.Model<{ id: string; name: string; age: number }>(
          {
            pluralName: 'Test',
            namespace: 'functional-models-orm',
            properties: {
              id: PrimaryKeyUuidProperty(),
              name: TextProperty(),
              age: NumberProperty(),
            },
            modelValidators: [],
            uniqueTogether: ['name', 'age'],
          }
        )
        const modelInstance = model.create<'id'>({ name: 'my-name', age: 1 })
        const actual = await modelInstance.validate()
        const expected = {
          overall: [
            'name,age must be unique together. Another instance found.',
          ],
        }
        // @ts-ignore
        assert.deepEqual(actual, expected)
      })
      describe('#createAndSave()', () => {
        it('should call create() and then call save() when createAndSave() is not available on the datastoreProvider', async () => {
          const datastoreProvider = createDatastore()
          const save = sinon
            .stub()
            .resolves({ id: 'test-me', name: 'hello world' })
          const instance = orm({ datastoreAdapter: datastoreProvider })
          const model = instance.Model<{ name: string }>({
            pluralName: 'MyModels',
            namespace: 'functional-models-orm',
            properties: {
              id: PrimaryKeyUuidProperty(),
              name: TextProperty(),
            },
          })
          const modelInstance = model.create({ name: 'hello world' })
          const create = sinon.stub().returns({
            save,
            toObj: () =>
              Promise.resolve({ id: 'test-me', name: 'hello world' }),
          })
          // @ts-ignore
          model.create = create
          const result = await model.createAndSave(modelInstance)
          sinon.assert.calledOnce(save)
          sinon.assert.calledOnce(create)
        })
        it('should call datastoreProvider.createAndSave() when available', async () => {
          const datastoreProvider = createDatastore()
          const createAndSave = sinon
            .stub()
            .resolves({ id: 'test-me', name: 'hello world' })
          // @ts-ignore
          datastoreProvider.createAndSave = createAndSave
          const instance = orm({ datastoreAdapter: datastoreProvider })
          const model = instance.Model<{ name: string }>({
            pluralName: 'MyModels',
            namespace: 'functional-models-orm',
            properties: {
              id: PrimaryKeyUuidProperty(),
              name: TextProperty(),
            },
          })
          const modelInstance = model.create({ name: 'hello world' })
          await model.createAndSave(modelInstance)
          sinon.assert.calledOnce(createAndSave)
        })
      })
      describe('#create()', () => {
        it('should call the modelOptions.instanceCreatedCallback that is passed in', () => {
          const datastoreProvider = createDatastore()
          const instanceCreatedCallback = sinon.stub()
          const instance = orm({ datastoreAdapter: datastoreProvider })
          const model = instance.Model(
            {
              pluralName: 'MyModels',
              namespace: 'functional-models-orm',
              properties: {
                id: PrimaryKeyUuidProperty(),
              },
            },
            { instanceCreatedCallback }
          )
          model.create({})
          sinon.assert.calledOnce(instanceCreatedCallback)
        })
        it('should call the modelOptions.instanceCreatedCallback that is passed in, even if its an array', () => {
          const datastoreProvider = createDatastore()
          const instanceCreatedCallback = sinon.stub()
          const instance = orm({ datastoreAdapter: datastoreProvider })
          const model = instance.Model(
            {
              pluralName: 'MyModels',
              namespace: 'functional-models-orm',
              properties: {
                id: PrimaryKeyUuidProperty(),
              },
            },
            { instanceCreatedCallback: [instanceCreatedCallback] }
          )
          model.create({})
          sinon.assert.calledOnce(instanceCreatedCallback)
        })
        describe('#delete()', () => {
          it('should replace delete() with DeleteOverride when passed into options', async () => {
            const datastoreProvider = createDatastore()
            const instance = orm({ datastoreAdapter: datastoreProvider, Model })
            const deleteObj = sinon.stub().resolves({})
            const model = instance.Model(
              {
                pluralName: 'MyModels',
                namespace: 'functional-models-orm',
                properties: {
                  id: PrimaryKeyUuidProperty(),
                },
              },
              { delete: deleteObj }
            )
            const modelInstance = model.create({})
            await modelInstance.delete()
            sinon.assert.calledOnce(deleteObj)
          })
          it('should call datastoreProvider.delete with the model and id', async () => {
            const datastoreProvider = {
              delete: sinon.stub().resolves({}),
            }
            // @ts-ignore
            const instance = orm({ datastoreAdapter: datastoreProvider, Model })
            const model = instance.Model<{ id: string; name: string }>(
              {
                pluralName: 'MyModels',
                namespace: 'functional-models-orm',
                properties: {
                  id: PrimaryKeyUuidProperty(),
                  name: TextProperty({ required: true }),
                },
              },
              {}
            )
            const modelInstance = model.create({
              id: 'my-id',
              name: 'my-name',
            })
            await modelInstance.delete()
            const actual = datastoreProvider.delete.getCall(0).args
            const expected = [model, 'my-id']
            assert.deepEqual(actual, expected)
          })
        })
        describe('#save()', () => {
          it('should change lastModified field from "2021-01-01T00:00:01Z" when lastModifiedUpdateMethod exists on a property', async () => {
            const datastoreProvider = createDatastore()
            // @ts-ignore
            const instance = orm({ datastoreAdapter: datastoreProvider, Model })
            const model = instance.Model<{ lastModified: Date }>(
              {
                pluralName: 'MyModels',
                namespace: 'functional-models-orm',
                properties: {
                  id: PrimaryKeyUuidProperty(),
                  lastModified: LastModifiedDateProperty(),
                },
              },
              {}
            )
            const modelInstance = model.create({
              lastModified: new Date('2021-01-01T00:00:01Z'),
            })
            datastoreProvider.save.callsFake(x => {
              return Promise.resolve(x)
            })
            const newModel = await modelInstance.save()
            const actual = await newModel.get.lastModified()
            const expected = '2021-01-01T00:00:01Z'
            // @ts-ignore
            assert.notEqual(actual, expected)
          })
          it('should have a .save() function', () => {
            const datastoreProvider = createDatastore()
            const instance = orm({ datastoreAdapter: datastoreProvider, Model })
            const model = instance.Model(
              {
                pluralName: 'MyModels',
                namespace: 'functional-models-orm',
                properties: {
                  id: PrimaryKeyUuidProperty(),
                },
              },
              {}
            )
            const modelInstance = model.create({})
            assert.isFunction(modelInstance.save)
          })
          it('should replace save() with SaveOverride when passed into options', async () => {
            const datastoreProvider = createDatastore()
            const instance = orm({ datastoreAdapter: datastoreProvider, Model })
            const save = sinon.stub().resolves({})
            const model = instance.Model(
              {
                pluralName: 'MyModels',
                namespace: 'functional-models-orm',
                properties: {
                  id: PrimaryKeyUuidProperty(),
                },
              },
              { save }
            )
            const modelInstance = model.create({})
            await modelInstance.save()
            sinon.assert.calledOnce(save)
          })
          it('should throw an exception if the model has validation errors and save is called', () => {
            const datastoreProvider = createDatastore()
            const instance = orm({ datastoreAdapter: datastoreProvider, Model })
            const model = instance.Model<{ name: string }>(
              {
                pluralName: 'MyModels',
                namespace: 'functional-models-orm',
                properties: {
                  id: PrimaryKeyUuidProperty(),
                  name: TextProperty({ required: true }),
                },
              },
              {}
            )
            // @ts-ignore
            const modelInstance = model.create({})
            return modelInstance
              .save()
              .then(() => {
                assert.fail('no exception')
              })
              .catch(() => {})
          })
          it('should call datastoreProvider.save with the instance', async () => {
            const datastoreProvider = {
              save: sinon.stub().returns({ name: 'my-name' }),
            }
            // @ts-ignore
            const instance = orm({ datastoreAdapter: datastoreProvider, Model })
            const model = instance.Model<{ name: string }>(
              {
                pluralName: 'MyModels',
                namespace: 'functional-models-orm',
                properties: {
                  id: PrimaryKeyUuidProperty(),
                  name: TextProperty({ required: true }),
                },
              },
              {}
            )
            const modelInstance = model.create({
              name: 'my-name',
            })
            await modelInstance.save()
            const actual = datastoreProvider.save.getCall(0).args[0]
            const expected = modelInstance
            assert.deepEqual(actual, expected)
          })
        })
      })
      describe('#retrieve()', () => {
        it('should pass the model and id to the datastoreProvider.search', async () => {
          const datastoreProvider = {
            retrieve: sinon.stub().resolves(null),
          }
          // @ts-ignore
          const instance = orm({ datastoreAdapter: datastoreProvider, Model })
          const model = instance.Model(
            {
              pluralName: 'MyModels',
              namespace: 'functional-models-orm',
              properties: {
                id: PrimaryKeyUuidProperty(),
              },
            },
            {}
          )
          const id = 123
          await model.retrieve(id)
          const actual = datastoreProvider.retrieve.getCall(0).args
          const expected = [model, id]
          assert.deepEqual(actual, expected)
        })
      })
      describe('#search()', () => {
        it('should pass the model and ormQuery to the datastoreProvider.search', async () => {
          const datastoreProvider = {
            search: sinon.stub().resolves({ page: null, instances: [] }),
          }
          // @ts-ignore
          const instance = orm({ datastoreAdapter: datastoreProvider, Model })
          const model = instance.Model(
            {
              pluralName: 'MyModels',
              namespace: 'functional-models-orm',
              properties: {
                id: PrimaryKeyUuidProperty(),
              },
            },
            {}
          )
          // @ts-ignore
          await model.search(['FAKE'])
          const actual = datastoreProvider.search.getCall(0).args
          const expected = [model, ['FAKE']]
          assert.deepEqual(actual, expected)
        })
      })
      describe('#searchOne()', () => {
        it('should return one object even though two are matched', async () => {
          const datastoreProvider = createDatastore()
          // @ts-ignore
          const instance = orm({ datastoreAdapter: datastoreProvider, Model })
          const model = instance.Model<{ name: string }>(
            {
              pluralName: 'MyModels',
              namespace: 'functional-models-orm',
              properties: {
                id: PrimaryKeyUuidProperty(),
                name: TextProperty(),
              },
            },
            {}
          )
          await model.create({ name: 'Name' }).save()
          await model.create({ name: 'Name' }).save()
          datastoreProvider.search.resolves({
            instances: [{ id: 1 }, { id: 2 }],
          })
          // @ts-ignore
          const actual = []
            .concat(await model.searchOne([]))
            .filter(x => x).length
          const expected = 1
          assert.equal(actual, expected)
        })
      })
    })
    describe('#fetcher()', () => {
      it('should call the datastoreProvider.retrieve with the model and id', async () => {
        const datastoreProvider = {
          retrieve: sinon.stub().resolves(undefined),
        }
        // @ts-ignore
        const instance = orm({ datastoreAdapter: datastoreProvider, Model })
        const model = instance.Model<{}>(
          {
            pluralName: 'MyModels',
            namespace: 'functional-models-orm',
            properties: {
              id: PrimaryKeyUuidProperty(),
            },
          },
          {}
        )
        // @ts-ignore
        await instance.fetcher(model, 'my-id')

        const actual = datastoreProvider.retrieve.getCall(0).args
        const expected = [model, 'my-id']
        assert.deepEqual(actual, expected)
      })
      it('should return expected model instance', async () => {
        const datastoreProvider = {
          retrieve: sinon.stub().resolves({
            id: 'my-id',
            name: 'my-name',
          }),
        }
        // @ts-ignore
        const instance = orm({ datastoreAdapter: datastoreProvider, Model })
        const model = instance.Model<{ name: string }>(
          {
            pluralName: 'MyModels',
            namespace: 'functional-models-orm',
            properties: {
              id: PrimaryKeyUuidProperty(),
              name: TextProperty(),
            },
          },
          {}
        )

        // @ts-ignore
        const actual = await (
          await instance.fetcher<{ name: string }>(model, 'my-id')
        )
          // @ts-ignore
          .toObj()
        const expected = { id: 'my-id', name: 'my-name' }
        assert.deepEqual(actual, expected)
      })
    })
    describe('#count()', () => {
      it('should return 2 when there are 2 models', async () => {
        const datastoreProvider = createDatastore()
        const instance = orm({ datastoreAdapter: datastoreProvider })
        const model = instance.Model<{ name: string }>({
          pluralName: 'MyModels',
          namespace: 'functional-models-orm',
          properties: {
            id: PrimaryKeyUuidProperty(),
            name: TextProperty(),
          },
        })
        datastoreProvider.search.resolves({
          instances: [{}, {}],
        })
        const actual = await model.count()
        const expected = 2
        assert.equal(actual, expected)
      })
      it('should return 3 when there are 3 models and the datastore returns a page to be called twice', async () => {
        const datastoreProvider = {
          search: sinon
            .stub()
            .onFirstCall()
            .resolves({
              page: 'page',
              instances: [
                {
                  toObj: sinon.stub().resolves({}),
                },
                {
                  toObj: sinon.stub().resolves({}),
                },
              ],
            })
            .onSecondCall()
            .resolves({
              page: null,
              instances: [
                {
                  toObj: sinon.stub().resolves({}),
                },
              ],
            }),
        }
        // @ts-ignore
        const instance = orm({ datastoreAdapter: datastoreProvider })
        const model = instance.Model<{ name: string }>({
          pluralName: 'MyModels',
          namespace: 'functional-models-orm',
          properties: {
            id: PrimaryKeyUuidProperty(),
            name: TextProperty(),
          },
        })
        const actual = await model.count()
        const expected = 3
        assert.equal(actual, expected)
      })
      it('should use the datastoreProvider.count if available', async () => {
        const datastoreProvider = {
          count: sinon.stub().resolves(10),
        }
        // @ts-ignore
        const instance = orm({ datastoreAdapter: datastoreProvider })
        const model = instance.Model<{ name: string }>({
          pluralName: 'MyModels',
          namespace: 'functional-models-orm',
          properties: {
            id: PrimaryKeyUuidProperty(),
            name: TextProperty(),
          },
        })
        await model.count()
        assert.isTrue(datastoreProvider.count.called)
      })
    })
    describe('#bulkInsert()', () => {
      it('should call save() on each object, if datastoreProvider does not handle bulkInserts', async () => {
        const datastoreProvider = createDatastore()
        const save = sinon
          .stub()
          .resolves({ id: 'test-me', name: 'hello world' })
        const instance = orm({ datastoreAdapter: datastoreProvider })
        const model = instance.Model<{ name: string }>({
          pluralName: 'MyModels',
          namespace: 'functional-models-orm',
          properties: {
            id: PrimaryKeyUuidProperty(),
            name: TextProperty(),
          },
        })
        const modelInstance = model.create({ name: 'hello world' })
        //@ts-ignore
        modelInstance.save = save
        const modelInstance2 = model.create({ name: 'hello world' })
        //@ts-ignore
        modelInstance2.save = save
        const modelInstance3 = model.create({ name: 'hello world' })
        //@ts-ignore
        modelInstance3.save = save
        const modelInstance4 = model.create({ name: 'hello world' })
        //@ts-ignore
        modelInstance4.save = save
        await model.bulkInsert([
          modelInstance,
          modelInstance2,
          modelInstance3,
          modelInstance4,
        ])
        sinon.assert.callCount(save, 4)
      })
      it('should call datastoreProvider.bulkInsert() when available', async () => {
        const datastoreProvider = createDatastore()
        const bulkInsert = sinon.stub().resolves({})
        // @ts-ignore
        datastoreProvider.bulkInsert = bulkInsert
        const instance = orm({ datastoreAdapter: datastoreProvider })
        const model = instance.Model<{ name: string }>({
          pluralName: 'MyModels',
          namespace: 'functional-models-orm',
          properties: {
            id: PrimaryKeyUuidProperty(),
            name: TextProperty(),
          },
        })
        const modelInstance = model.create({ name: 'hello world' })
        await model.bulkInsert([modelInstance])
        sinon.assert.calledOnce(bulkInsert)
      })
    })
  })
})
