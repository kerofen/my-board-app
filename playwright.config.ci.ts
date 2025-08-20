import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  globalSetup: require.resolve('./e2e/global-setup'),
  globalTeardown: require.resolve('./e2e/global-teardown'),
  
  // CI環境での設定
  fullyParallel: true,
  forbidOnly: true, // test.onlyがあったら失敗
  retries: 2, // CI環境ではリトライを有効化
  workers: 2, // CI環境では並列度を制限
  reporter: [
    ['html'],
    ['github'], // GitHub Actions用のレポーター
    ['junit', { outputFile: './test-results/e2e-junit.xml' }],
  ],
  
  // タイムアウト設定
  timeout: 60 * 1000, // 各テスト60秒
  globalTimeout: 15 * 60 * 1000, // 全体で15分
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry', // リトライ時のみトレースを取得
    screenshot: 'only-on-failure', // 失敗時のみスクリーンショット
    video: 'retain-on-failure', // 失敗時のみビデオを保持
    actionTimeout: 15 * 1000, // 各アクション15秒
    navigationTimeout: 30 * 1000, // ナビゲーション30秒
  },

  // CI環境では軽量なプロジェクトのみ実行
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // CI環境ではモバイルテストも実行
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // CI環境ではwebServerを起動
  webServer: {
    command: 'npm run start',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: false, // CI環境では新規起動
  },
});