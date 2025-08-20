const baseConfig = require('./jest.config.js');

// CI環境用の最適化された設定
module.exports = {
  ...baseConfig,
  // CI環境での設定
  bail: 1, // 最初のテスト失敗で停止
  ci: true,
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'html'],
  maxWorkers: 2, // CI環境では並列度を制限
  testTimeout: 30000, // タイムアウトを長めに設定
  
  // キャッシュ無効化（CI環境では新しい環境のため）
  cache: false,
  
  // パフォーマンス改善のための設定
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/e2e/', // E2Eテストは別途実行
    '/coverage/',
  ],
  
  // カバレッジ閾値の設定
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 70,
      statements: 70,
    },
    './components/': {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80,
    },
  },
  
  // レポーターの設定
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './test-results',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
    }],
  ],
};