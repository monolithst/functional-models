const common = [
  'features/**/*.feature',
  '--require-module ts-node/register',
  '--require ./stepDefinitions/*.ts',
  '--format progress-bar',
].join(' ')

module.exports = {
  default: common,
}
