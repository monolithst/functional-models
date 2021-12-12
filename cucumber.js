const common = [
  'features/**/*.feature',
  '--require-module ts-node/register',
  '--require features/stepDefinitions/*.ts',
  '--format progress-bar',
].join(' ')

module.exports = {
  default: common
}
