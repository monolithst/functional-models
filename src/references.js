const { lazyProperty } = require('./lazy')

const smartObjectReference = ({ fetcher = null }) => (key, smartObj) => {
  return lazyProperty(key, async () => {
    const _getId = () => {
      if (!smartObj) {
        return null
      }
      return smartObj && smartObj.id
        ? smartObj.id
        : smartObj.getId
        ? smartObj.getId()
        : smartObj
    }
    const _getSmartObjReturn = objToUse => {
      return {
        ...objToUse,
        functions: {
          ...(objToUse.functions ? objToUse.functions : {}),
          toJson: _getId,
        },
      }
    }
    const valueIsSmartObj = smartObj && smartObj.functions
    if (valueIsSmartObj) {
      return _getSmartObjReturn(smartObj)
    }
    if (fetcher) {
      const obj = await fetcher(smartObj)
      return _getSmartObjReturn(obj)
    }
    return _getId(smartObj)
  })
}

module.exports = {
  smartObjectReference,
}
