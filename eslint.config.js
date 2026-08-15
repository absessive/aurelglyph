import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const javascriptFiles = ['**/*.{js,mjs,cjs}'];
const typescriptFiles = ['**/*.{ts,tsx}'];
const sourceFiles = [...javascriptFiles, ...typescriptFiles];

export default [
  {
    ignores: [
      '**/.build/**',
      '**/.swiftpm/**',
      '**/Pods/**',
      '**/build/**',
      '**/coverage/**',
      '**/dist/**',
      '**/node_modules/**',
      'docs/**',
      'examples/react-native-smoke/android/**',
      'examples/react-native-smoke/ios/**',
      'preview/**',
    ],
  },
  {
    ...js.configs.recommended,
    files: javascriptFiles,
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      ecmaVersion: 'latest',
      globals: {...globals.browser, ...globals.node},
      sourceType: 'module',
    },
  },
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: typescriptFiles,
  })),
  {
    files: sourceFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {...globals.browser, ...globals.node},
      parserOptions: {ecmaFeatures: {jsx: true}},
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'react-hooks': reactHooks,
    },
    rules: {
      'no-console': 'off',
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',
    },
  },
  {
    files: typescriptFiles,
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_'},
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}', '**/jest.setup.js'],
    languageOptions: {
      globals: globals.jest,
    },
  },
];
