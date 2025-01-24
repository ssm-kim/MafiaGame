module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  parserOptions: {
    project: './frontend/mafia/tsconfig.eslint.json',
  },
  ignorePatterns: [
    '.eslintrc.cjs',
  ],
  plugins: [
    'prettier',
    'no-relative-import-paths',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    }
  },
  extends: [
    'airbnb',
    'airbnb-typescript',
    'prettier',
  ],
  rules: {
    // 같은 폴더인 경우를 제외하고 import 경로는 항상 절대 경로를 사용
    "no-relative-import-paths/no-relative-import-paths": [
      "error",
      { "allowSameFolder": false, "rootDir": "src", "prefix": "@" }
    ],
    // public 폴더는 절대 경로로 import 할 수 있도록 허용
    "import/no-absolute-path": [
      "error",
      {
        "ignore": ["^/"] // 루트(`/`)로 시작하는 모든 경로 허용
      }
    ],
    // Prettier 설정
    'prettier/prettier': 'error',
    'arrow-body-style': 'off',
    'prefer-arrow-callback': 'off',
    'prettier/prettier': [
        'error',
        {
            endOfLine: 'auto',
        },
    ],
  }
}