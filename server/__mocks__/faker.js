const faker = {
  number: {
    int: ({ min }) => min,
    float: ({ min }) => min
  },
  helpers: {
    arrayElement: (arr) => arr[0]
  },
  lorem: {
    sentence: () => 'Test sentence.'
  },
  word: {
    adjective: () => 'Test',
    noun: () => 'Plan'
  }
}
module.exports = { faker }