import sinon from 'sinon'

const createDatastore = () => {
  return {
    delete: sinon.stub().resolves(),
    retrieve: sinon.stub().resolves(undefined),
    save: sinon.stub().resolves({}),
    search: sinon.stub().resolves({
      instances: [],
    }),
  }
}

export { createDatastore }
