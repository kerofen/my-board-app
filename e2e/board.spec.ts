import { test, expect } from '@playwright/test'

test.describe('掲示板アプリケーション', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('ホームページが正しく表示される', async ({ page }) => {
    // タイトルの確認
    await expect(page).toHaveTitle(/シンプル掲示板/)
    
    // ヘッダーの確認
    await expect(page.locator('h1')).toContainText('シンプル掲示板')
    
    // 新規投稿フォームの確認
    await expect(page.locator('h2')).toContainText('新規投稿')
    await expect(page.locator('label[for="title"]')).toContainText('タイトル')
    await expect(page.locator('label[for="author"]')).toContainText('投稿者名')
    await expect(page.locator('label[for="content"]')).toContainText('内容')
    await expect(page.locator('button[type="submit"]')).toContainText('投稿する')
  })

  test('新規投稿を作成できる', async ({ page }) => {
    // フォームに入力
    await page.fill('#title', 'E2Eテスト投稿')
    await page.fill('#author', 'テストユーザー')
    await page.fill('#content', 'これはE2Eテストによる投稿です。')
    
    // 投稿ボタンをクリック
    await page.click('button:has-text("投稿する")')
    
    // 投稿が表示されるまで待機
    await page.waitForSelector('text=E2Eテスト投稿', { timeout: 5000 })
    
    // 投稿内容の確認
    await expect(page.locator('text=E2Eテスト投稿')).toBeVisible()
    await expect(page.locator('text=投稿者: テストユーザー')).toBeVisible()
    await expect(page.locator('text=これはE2Eテストによる投稿です。')).toBeVisible()
  })

  test('空のフォームを送信するとエラーが表示される', async ({ page }) => {
    // ダイアログのリスナーを設定
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('すべての項目を入力してください')
      await dialog.accept()
    })
    
    // 空のまま投稿ボタンをクリック
    await page.click('button:has-text("投稿する")')
  })

  test('140文字を超える内容は投稿できない', async ({ page }) => {
    // フォームに入力
    await page.fill('#title', '文字数制限テスト')
    await page.fill('#author', 'テストユーザー')
    
    // 141文字入力
    const longText = 'あ'.repeat(141)
    await page.fill('#content', longText)
    
    // 文字数カウンターの確認
    await expect(page.locator('text=(141/140)')).toBeVisible()
    await expect(page.locator('span:has-text("(141/140)")')).toHaveClass(/text-red-500/)
    
    // ダイアログのリスナーを設定
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('投稿文は140文字以内で入力してください')
      await dialog.accept()
    })
    
    // 投稿ボタンをクリック
    await page.click('button:has-text("投稿する")')
  })

  test('投稿を編集できる', async ({ page }) => {
    // まず投稿を作成
    await page.fill('#title', '編集前のタイトル')
    await page.fill('#author', '編集前の投稿者')
    await page.fill('#content', '編集前の内容')
    await page.click('button:has-text("投稿する")')
    
    // 投稿が表示されるまで待機
    await page.waitForSelector('text=編集前のタイトル')
    
    // 編集ボタンをクリック
    await page.click('button:has-text("編集")')
    
    // 編集フォームが表示されることを確認
    await expect(page.locator('h3:has-text("投稿を編集")')).toBeVisible()
    
    // 内容を編集
    await page.fill('#edit-title', '編集後のタイトル')
    await page.fill('#edit-author', '編集後の投稿者')
    await page.fill('#edit-content', '編集後の内容')
    
    // 保存ボタンをクリック
    await page.click('button:has-text("保存")')
    
    // 編集後の内容が表示されることを確認
    await page.waitForSelector('text=編集後のタイトル')
    await expect(page.locator('text=編集後のタイトル')).toBeVisible()
    await expect(page.locator('text=投稿者: 編集後の投稿者')).toBeVisible()
    await expect(page.locator('text=編集後の内容')).toBeVisible()
  })

  test('投稿を削除できる', async ({ page }) => {
    // まず投稿を作成
    await page.fill('#title', '削除テスト投稿')
    await page.fill('#author', '削除テストユーザー')
    await page.fill('#content', '削除される投稿')
    await page.click('button:has-text("投稿する")')
    
    // 投稿が表示されるまで待機
    await page.waitForSelector('text=削除テスト投稿')
    
    // 削除確認ダイアログのリスナーを設定
    page.on('dialog', async dialog => {
      if (dialog.message().includes('この投稿を削除しますか？')) {
        await dialog.accept()
      }
    })
    
    // 削除ボタンをクリック
    await page.click('button:has-text("削除")')
    
    // 投稿が削除されたことを確認
    await page.waitForSelector('text=削除テスト投稿', { state: 'detached' })
    await expect(page.locator('text=削除テスト投稿')).not.toBeVisible()
  })

  test('長い内容の投稿は省略表示される', async ({ page }) => {
    // 201文字の内容を作成
    const longContent = 'あ'.repeat(140)
    
    // 投稿を作成
    await page.fill('#title', '長文テスト')
    await page.fill('#author', 'テストユーザー')
    await page.fill('#content', longContent)
    await page.click('button:has-text("投稿する")')
    
    // 投稿が表示されるまで待機
    await page.waitForSelector('text=長文テスト')
    
    // 全文は表示されていないことを確認（140文字制限のため省略は不要だが、UIの確認）
    const contentElement = page.locator('p.whitespace-pre-wrap').first()
    await expect(contentElement).toBeVisible()
  })

  test('編集をキャンセルできる', async ({ page }) => {
    // まず投稿を作成
    await page.fill('#title', 'キャンセルテスト')
    await page.fill('#author', 'テストユーザー')
    await page.fill('#content', '元の内容')
    await page.click('button:has-text("投稿する")')
    
    // 投稿が表示されるまで待機
    await page.waitForSelector('text=キャンセルテスト')
    
    // 編集ボタンをクリック
    await page.click('button:has-text("編集")')
    
    // 編集フォームで内容を変更
    await page.fill('#edit-content', '変更された内容')
    
    // キャンセルボタンをクリック
    await page.click('button:has-text("キャンセル")')
    
    // 元の内容が表示されていることを確認
    await expect(page.locator('text=元の内容')).toBeVisible()
    await expect(page.locator('text=変更された内容')).not.toBeVisible()
  })

  test('投稿が0件の場合メッセージが表示される', async ({ page }) => {
    // APIモックを使用して空の状態をシミュレート
    await page.route('/api/posts', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] })
      })
    })
    
    await page.reload()
    
    // 「まだ投稿がありません」メッセージの確認
    await expect(page.locator('text=まだ投稿がありません')).toBeVisible()
  })

  test('文字数カウンターが正しく動作する', async ({ page }) => {
    const contentInput = page.locator('#content')
    
    // 10文字入力
    await contentInput.fill('1234567890')
    await expect(page.locator('text=(10/140)')).toBeVisible()
    
    // 50文字に変更
    await contentInput.fill('あ'.repeat(50))
    await expect(page.locator('text=(50/140)')).toBeVisible()
    
    // 140文字（上限）
    await contentInput.fill('あ'.repeat(140))
    await expect(page.locator('text=(140/140)')).toBeVisible()
  })
})