module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'airbnb-base',
    //    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  plugins: ['promise'],
  globals: {
    axel: true,
  },
  parserOptions: {
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    // sourceType: 'module', // Allows for the use of imports
  },
  // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
  // e.g. "@typescript-eslint/explicit-function-return-type": "off",
  ignorePatterns: ['test/sandbox/**/*.js'],
  rules: {
    'no-param-reassign': 0,
    'no-useless-escape': 0,
    'no-underscore-dangle': [
      2,
      {
        allow: ['_id', '_sails', '_global'],
      },
    ],
    'prefer-destructuring': 0,
    'no-iterator': 1,
    'no-restricted-syntax': [
      'error',
      'ForInStatement',
      'LabeledStatement',
      'WithStatement',
    ],
    'consistent-return': 0,
    'comma-dangle': 0,
    'guard-for-in': 0,
    indent: 0,
    radix: 0,
    'object-shorthand': 1,
    'newline-per-chained-call': [
      1,
      {
        ignoreChainWithDepth: 3,
      },
    ],
    'no-confusing-arrow': 'error',
    'import/extensions': 0,
    'no-mixed-operators': 2,
    'no-console': [
      'error',
      {
        allow: ['warn', 'error', 'time', 'timeEnd'],
      },
    ],
    'no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used',
        varsIgnorePattern: '[(colors|models)]',
        ignoreRestSiblings: false,
      },
    ],
    'no-plusplus': [
      'error',
      {
        allowForLoopAfterthoughts: true,
      },
    ],
    'class-methods-use-this': 0,
    'no-case-declarations': 0,
    'max-len': [
      'error',
      {
        code: 150,
        ignoreUrls: true,
      },
    ],
    // "node/no-unsupported-features/es-syntax": ["error", {
    //   "version": ">=10.0.0",
    //   "ignores": []
    // }]
    semi: [2, 'always'],
    'promise/always-return': 'warn',
    'promise/no-return-wrap': 'warn',
    'promise/param-names': 'warn',
    'promise/catch-or-return': 'warn',
    'promise/no-native': 'off',
    'promise/no-nesting': 'warn',
    'promise/no-return-in-finally': 'warn',
    'promise/no-promise-in-callback': 'warn',
    'promise/no-callback-in-promise': 'warn',
    'promise/avoid-new': 0,
    'promise/no-new-statics': 'warn',
    'promise/valid-params': 'warn',
    'max-lines-per-function': ['error', { max: 100, skipComments: true, skipBlankLines: true }],
    'max-lines': ['error', { max: 800, skipComments: true }],
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 0 }],
    'no-continue': 0,
    'global-require': 0,
    'import/no-dynamic-require': 0,
  },
};
