import { defineConfig, devices } from '@playwright/test'

/**
 * 安定したE2Eテスト実行のための設定
 * - 直列実行
 * - 長めのタイムアウト
 * - リトライ機能
 */
export default defineConfig({
  testDir: './e2e',
  
  /* グローバル設定 */
  globalSetup: require.resolve('./e2e/global-setup'),
  globalTeardown: require.resolve('./e2e/global-teardown'),
  
  /* 直列実行（安定性優先） */
  fullyParallel: false,
  workers: 1,
  
  /* CI設定 */
  forbidOnly: !!process.env.CI,
  
  /* リトライ設定 */
  retries: 2,
  
  /* タイムアウト設定 */
  timeout: 60 * 1000,
  expect: {
    timeout: 15 * 1000,
  },
  globalTimeout: 20 * 60 * 1000,
  
  /* レポート設定 */
  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],
  
  /* 共通設定 */
  use: {
    /* 柔軟なベースURL設定 */
    baseURL: process.env.BASE_URL || 'http://localhost:3004',
    
    /* アクション待機時間 */
    actionTimeout: 20 * 1000,
    navigationTimeout: 30 * 1000,
    
    /* デバッグ用設定 */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    
    /* ブラウザ設定 */
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },

  /* テストプロジェクト */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
          ],
        },
      },
    },
  ],

  /* 開発サーバー設定（無効化） */
  // webServerを無効化して手動起動したサーバーを使用
})