const common = [
  'features/**/*.feature',
  '--require-module ts-node/register',
  '--require ./stepDefinitions/*.ts',
  '--format progress-bar',
].join(' ')

export default {
  default: common,
}
