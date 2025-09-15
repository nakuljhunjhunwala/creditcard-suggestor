import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginPrettier from 'eslint-plugin-prettier';
import configPrettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist/**', 'example/**', 'node_modules/**', '*.config.js'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      // TypeScript specific rules
      'no-unused-vars': 'off', // Disable the base rule
      '@typescript-eslint/no-unused-vars': [
        'error',
        { 
          argsIgnorePattern: '^_+', 
          varsIgnorePattern: '^_+',
          ignoreRestSiblings: true 
        },
      ],

      // Allow 'any' type with proper comments
      '@typescript-eslint/no-explicit-any': [
        'warn',
        {
          ignoreRestArgs: true,
          fixToUnknown: false,
        },
      ],

      // Enforce consistent type definitions
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],

      // Naming conventions
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variableLike',
          format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'forbid',
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE'],
        },
        {
          selector: 'property',
          format: ['camelCase', 'snake_case', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'method',
          format: ['camelCase'],
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
        },
      ],

      // Console and debugging
      'no-console': 'error',
      'no-debugger': 'error',
      'no-alert': 'error',

      // Code quality
      'no-param-reassign': 'warn',
      'prefer-const': 'error',
      'consistent-return': 'error',
      'no-var': 'error',
      'prefer-destructuring': ['error', { object: true, array: false }],
      'object-shorthand': ['error', 'always'],
      'prefer-template': 'error',
      'prefer-spread': 'error',
      'prefer-rest-params': 'error',

      // Arrow functions
      'arrow-spacing': ['error', { before: true, after: true }],
      'prefer-arrow-callback': 'error',
      'arrow-parens': ['error', 'as-needed'],

      // String and formatting
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],

      // Security rules
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // Error handling
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',

      // Performance
      'no-await-in-loop': 'warn',
      'no-constant-condition': 'error',
      'no-duplicate-case': 'error',
      'no-empty': 'error',
      'no-unreachable': 'error',

      // Import/export organization
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        },
      ],

      // Complexity limits
      complexity: ['warn', 15],
      'max-depth': ['warn', 4],
      'max-lines': ['warn', 800],
      'max-lines-per-function': ['warn', 100],
      'max-params': ['warn', 7],

      // Disable max-len, prefer Prettier for formatting
      'max-len': 'off',

      // Allow some patterns for flexibility
      'no-nested-ternary': 'warn',
      'no-use-before-define': [
        'error',
        {
          functions: false,
          classes: true,
          variables: true,
          allowNamedExports: false,
        },
      ],
      'no-continue': 'off',
      'no-plusplus': 'off',
      'no-restricted-syntax': 'off',
      'import/no-unresolved': 'off',
      'import/no-dynamic-require': 'off',
      'global-require': 'off',

      // Prettier integration
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          trailingComma: 'all',
          tabWidth: 2,
          semi: true,
          printWidth: 80,
          endOfLine: 'auto',
        },
      ],

      // Custom rules for specific patterns
      'no-magic-numbers': [
        'warn',
        {
          ignore: [0, 1, -1, 2, 10, 100, 1000],
          ignoreArrayIndexes: true,
          enforceConst: true,
          detectObjects: false,
        },
      ],

      // Function rules
      'func-names': ['error', 'as-needed'],
      'func-style': ['error', 'declaration', { allowArrowFunctions: true }],

      // Error prevention
      'no-duplicate-imports': 'error',
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unused-expressions': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',

      // TypeScript specific enhancements (basic ones that don't require type info)
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-ts-expect-error': 'error',
      '@typescript-eslint/unified-signatures': 'error',
      '@typescript-eslint/no-confusing-non-null-assertion': 'error',
      '@typescript-eslint/no-useless-empty-export': 'error',
      '@typescript-eslint/prefer-enum-initializers': 'error',
      '@typescript-eslint/prefer-function-type': 'error',
    },
  },
  // Special configuration for files where 'any' is acceptable
  {
    files: ['**/*.types.ts', '**/*.d.ts', '**/types/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // Configuration for test files
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'max-lines-per-function': 'off',
      'no-magic-numbers': 'off',
    },
  },
  // Configuration for configuration files
  {
    files: ['**/*.config.ts', '**/*.config.js'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-magic-numbers': 'off',
    },
  },
  // Configuration for migration files
  {
    files: ['**/migrations/**/*.ts', '**/database/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-magic-numbers': 'off',
      'max-lines': 'off',
    },
  },
  configPrettier,
];
