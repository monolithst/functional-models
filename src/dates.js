const { property } = require('./properties')

const _autonowDate = ({ key }) => (date = null, ...args) => {
  const theDate = date ? date : new Date()
  return property(key, theDate, ...args)
}
const lastModifiedProperty = _autonowDate({ key: 'lastModified' })
const lastUpdatedProperty = _autonowDate({ key: 'lastUpdated' })

module.exports = {
  lastModifiedProperty,
  lastUpdatedProperty,
}
