module.exports = {
  request: {
    required: ['question', 'sport'],
    fields: {
      question: 'string',
      sport:    'string',
    },
    supportedSports: ['football', 'cricket', 'tennis'],
  },
  response: {
    required: ['sport', 'question', 'analystA', 'analystB'],
    fields: {
      sport:     'string',
      question:  'string',
      analystA:  'string',
      analystB:  'string',
    },
  },
};
