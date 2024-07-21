module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
    ignorePatterns: ['dist', '.eslintrc.cjs'],
    "parser": "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
    plugins: ['react-refresh','@typescript-eslint/eslint-plugin'],
    rules: {
        '@typescript-eslint/no-unused-vars': 'warn',
        'no-unused-vars': 'off',
    'react/jsx-no-target-blank': 'off',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
