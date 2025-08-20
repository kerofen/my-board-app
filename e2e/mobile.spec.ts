import { test, expect, devices } from '@playwright/test'

test.use({
  ...devices['iPhone 12'],
})

test.describe('モバイル版掲示板アプリケーション', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('モバイルビューでレスポンシブデザインが適用される', async ({ page }) => {
    // ビューポートサイズの確認
    const viewportSize = page.viewportSize()
    expect(viewportSize?.width).toBeLessThanOrEqual(414) // iPhone 12の幅
    
    // モバイルでも主要要素が表示される
    await expect(page.locator('h1')).toContainText('シンプル掲示板')
    await expect(page.locator('h2')).toContainText('新規投稿')
    
    // フォーム要素がモバイル幅に対応
    const formContainer = page.locator('.bg-white.rounded-lg.shadow-md').first()
    await expect(formContainer).toBeVisible()
  })

  test('モバイルで投稿を作成できる', async ({ page }) => {
    // タッチ操作で入力
    await page.tap('#title')
    await page.fill('#title', 'モバイル投稿')
    
    await page.tap('#author')
    await page.fill('#author', 'モバイルユーザー')
    
    await page.tap('#content')
    await page.fill('#content', 'スマートフォンからの投稿テスト')
    
    // 投稿ボタンをタップ
    await page.tap('button:has-text("投稿する")')
    
    // 投稿が表示されるまで待機
    await page.waitForSelector('text=モバイル投稿')
    
    // 投稿内容の確認
    await expect(page.locator('text=モバイル投稿')).toBeVisible()
    await expect(page.locator('text=投稿者: モバイルユーザー')).toBeVisible()
  })

  test('モバイルで編集・削除ボタンが操作できる', async ({ page }) => {
    // まず投稿を作成
    await page.fill('#title', 'モバイル操作テスト')
    await page.fill('#author', 'テストユーザー')
    await page.fill('#content', 'ボタン操作のテスト')
    await page.tap('button:has-text("投稿する")')
    
    // 投稿が表示されるまで待機
    await page.waitForSelector('text=モバイル操作テスト')
    
    // 編集ボタンをタップ
    await page.tap('button:has-text("編集")')
    
    // 編集フォームが表示されることを確認
    await expect(page.locator('h3:has-text("投稿を編集")')).toBeVisible()
    
    // キャンセルボタンをタップ
    await page.tap('button:has-text("キャンセル")')
    
    // 削除確認ダイアログのリスナーを設定
    page.on('dialog', async dialog => {
      if (dialog.message().includes('この投稿を削除しますか？')) {
        await dialog.accept()
      }
    })
    
    // 削除ボタンをタップ
    await page.tap('button:has-text("削除")')
    
    // 投稿が削除されたことを確認
    await page.waitForSelector('text=モバイル操作テスト', { state: 'detached' })
  })

  test('モバイルで文字数カウンターが見やすく表示される', async ({ page }) => {
    const contentInput = page.locator('#content')
    
    // 入力フィールドにフォーカス
    await page.tap('#content')
    
    // テキスト入力
    await contentInput.fill('モバイルでの入力テスト')
    
    // 文字数カウンターが表示される
    const counter = page.locator('span:has-text("/140")')
    await expect(counter).toBeVisible()
    
    // カウンターがラベルの横に表示される
    const label = page.locator('label[for="content"]')
    await expect(label).toContainText('内容')
    await expect(label).toContainText('/140')
  })

  test('モバイルでスクロールが正しく動作する', async ({ page }) => {
    // 複数の投稿を作成
    for (let i = 1; i <= 5; i++) {
      await page.fill('#title', `投稿 ${i}`)
      await page.fill('#author', `ユーザー ${i}`)
      await page.fill('#content', `内容 ${i}`)
      await page.tap('button:has-text("投稿する")')
      await page.waitForSelector(`text=投稿 ${i}`)
    }
    
    // 最初の投稿までスクロール
    await page.locator('text=投稿 5').scrollIntoViewIfNeeded()
    await expect(page.locator('text=投稿 5')).toBeInViewport()
    
    // 新規投稿フォームまでスクロール
    await page.locator('h2:has-text("新規投稿")').scrollIntoViewIfNeeded()
    await expect(page.locator('h2:has-text("新規投稿")')).toBeInViewport()
  })
})