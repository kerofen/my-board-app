import { defineConfig, devices } from '@playwright/test'

/**
 * E2Eテスト安定性向上のための設定
 * - 直列実行により競合を防止
 * - 適切な待機時間とリトライ
 * - タイムアウトの最適化
 */
export default defineConfig({
  testDir: './e2e',
  
  /* Global setup and teardown */
  globalSetup: require.resolve('./e2e/global-setup'),
  globalTeardown: require.resolve('./e2e/global-teardown'),
  
  /* 🔧 直列実行設定（安定性向上） */
  fullyParallel: false,  // テストを直列実行
  workers: 1,            // ワーカー数を1に固定
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* 🔄 リトライ設定 */
  retries: process.env.CI ? 3 : 2,  // ローカルでも2回、CIでは3回リトライ
  
  /* ⏱️ タイムアウト設定 */
  timeout: 60 * 1000,          // 各テストのタイムアウト: 60秒
  expect: {
    timeout: 10 * 1000,        // expect()のタイムアウト: 10秒
  },
  globalTimeout: 15 * 60 * 1000,  // 全体のタイムアウト: 15分
  
  /* 📊 レポート設定 */
  reporter: [
    ['html', { open: 'never' }],
    ['list'],  // コンソールに進捗表示
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  
  /* 🎭 共通設定 */
  use: {
    /* Base URL */
    baseURL: 'http://localhost:3000',
    
    /* 🕐 アクション待機時間 */
    actionTimeout: 15 * 1000,  // クリックなどのアクション: 15秒
    navigationTimeout: 30 * 1000,  // ページ遷移: 30秒
    
    /* 📸 デバッグ用設定 */
    trace: 'retain-on-failure',  // 失敗時のみトレース保存
    screenshot: 'only-on-failure',  // 失敗時のみスクリーンショット
    video: process.env.CI ? 'retain-on-failure' : 'off',  // CI環境では失敗時のビデオ保存
    
    /* 🌐 ブラウザ設定 */
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    /* ⏳ 待機戦略 */
  },

  /* 🖥️ テストプロジェクト（優先度順） */
  projects: [
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
    },
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Chrome固有の安定性設定
        launchOptions: {
          args: [
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
          ],
        },
      },
      dependencies: ['setup'],
    },
    // 他のブラウザは必要に応じて実行
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['chromium'],  // Chromiumの後に実行
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['firefox'],  // Firefoxの後に実行
    },
  ],

  /* 🚀 開発サーバー設定 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 3 * 60 * 1000,  // 起動タイムアウト: 3分
    stdout: 'pipe',
    stderr: 'pipe',
  },
})