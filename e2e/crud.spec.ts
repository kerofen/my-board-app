import { test, expect } from '@playwright/test'
import {
  waitForPageReady,
  waitAndClick,
  safeType,
  waitForPost,
  createPost,
  deletePost,
  navigateAndWait
} from './helpers/test-helpers'

test.describe('掲示板CRUD操作', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page, '/')
  })

  test('新規投稿を作成できる', async ({ page }) => {
    // 投稿を作成
    await createPost(page, {
      title: 'E2Eテスト投稿',
      author: 'E2Eテスター',
      content: 'これはE2Eテストの投稿内容です'
    })
    
    // 投稿が表示されることを確認
    await expect(page.locator('text="E2Eテスト投稿"')).toBeVisible()
    await expect(page.locator('text="投稿者: E2Eテスター"')).toBeVisible()
    await expect(page.locator('text="これはE2Eテストの投稿内容です"')).toBeVisible()
  })

  test('投稿を編集できる', async ({ page }) => {
    // まず投稿を作成
    await createPost(page, {
      title: '編集前のタイトル',
      author: '編集前の作成者',
      content: '編集前の内容'
    })
    
    // 編集ボタンをクリック
    const postItem = page.locator('.bg-white').filter({ hasText: '編集前のタイトル' })
    await waitAndClick(postItem, 'button:has-text("編集")')
    
    // 編集フォームが表示されることを確認
    await expect(page.locator('h2:has-text("投稿を編集")')).toBeVisible()
    
    // 内容を編集
    await safeType(page, 'input[name="title"]', '編集後のタイトル')
    await safeType(page, 'input[name="author"]', '編集後の作成者')
    await safeType(page, 'textarea[name="content"]', '編集後の内容')
    
    // 保存ボタンをクリック
    await waitAndClick(page, 'button:has-text("保存")')
    
    // 編集された内容が表示されることを確認
    await waitForPost(page, '編集後のタイトル')
    await expect(page.locator('text="投稿者: 編集後の作成者"')).toBeVisible()
    await expect(page.locator('text="編集後の内容"')).toBeVisible()
  })

  test('投稿を削除できる', async ({ page }) => {
    // まず投稿を作成
    await createPost(page, {
      title: '削除テスト投稿',
      author: '削除テスター',
      content: '削除される投稿'
    })
    
    // 投稿が表示されることを確認
    await expect(page.locator('text="削除テスト投稿"')).toBeVisible()
    
    // 投稿を削除
    await deletePost(page, '削除テスト投稿')
    
    // 投稿が削除されたことを確認
    await expect(page.locator('text="削除テスト投稿"')).not.toBeVisible()
  })

  test('複数投稿が新しい順で表示される', async ({ page }) => {
    // 3つの投稿を作成
    for (let i = 1; i <= 3; i++) {
      await createPost(page, {
        title: `投稿${i}`,
        author: `作成者${i}`,
        content: `内容${i}`
      })
      await page.waitForTimeout(1000) // 順序を確実にするため待機
    }
    
    // 投稿が新しい順（3→2→1）で表示されることを確認
    const posts = page.locator('[data-testid="post-item"]')
    await expect(posts).toHaveCount(3)
    
    // 最初の投稿が「投稿3」であることを確認
    const firstPost = posts.first()
    await expect(firstPost.locator('h2')).toContainText('投稿3')
    
    // 最後の投稿が「投稿1」であることを確認
    const lastPost = posts.last()
    await expect(lastPost.locator('h2')).toContainText('投稿1')
  })

  test('長い内容の投稿で続きを読む機能が動作する', async ({ page }) => {
    // 長い内容の投稿を作成
    const longContent = 'あ'.repeat(201)
    await createPost(page, {
      title: '長い投稿',
      author: '作成者',
      content: longContent
    })
    
    // 「続きを読む」リンクが表示されることを確認
    await expect(page.locator('text="続きを読む"')).toBeVisible()
    
    // 内容が省略されていることを確認（200文字 + "..."）
    const contentElement = page.locator('[data-testid="post-content"]').first()
    const content = await contentElement.textContent()
    expect(content?.length).toBeLessThanOrEqual(204) // 200文字 + "..."
    
    // 「続きを読む」をクリック
    await waitAndClick(page, 'text="続きを読む"')
    
    // 全文が表示されることを確認
    await expect(page.locator('text="折りたたむ"')).toBeVisible()
    const expandedContent = await contentElement.textContent()
    expect(expandedContent).toBe(longContent)
  })

  test('バリデーションエラーが表示される', async ({ page }) => {
    // ダイアログリスナーを設定
    let dialogMessage = ''
    page.once('dialog', async dialog => {
      dialogMessage = dialog.message()
      await dialog.accept()
    })
    
    // 空のフォームで投稿を試みる
    await waitAndClick(page, 'button[type="submit"]')
    
    // エラーメッセージが表示されることを確認
    await page.waitForTimeout(1000)
    expect(dialogMessage).toContain('すべての項目を入力してください')
    
    // タイトルのみ入力して投稿を試みる
    dialogMessage = ''
    page.once('dialog', async dialog => {
      dialogMessage = dialog.message()
      await dialog.accept()
    })
    
    await safeType(page, 'input[name="title"]', 'タイトルのみ')
    await waitAndClick(page, 'button[type="submit"]')
    
    // エラーメッセージが表示されることを確認
    await page.waitForTimeout(1000)
    expect(dialogMessage).toContain('すべての項目を入力してください')
  })

  test('文字数制限が機能する', async ({ page }) => {
    // タイトル（最大100文字）
    const titleInput = page.locator('input[name="title"]')
    await titleInput.fill('a'.repeat(150))
    const titleValue = await titleInput.inputValue()
    expect(titleValue.length).toBeLessThanOrEqual(100)
    
    // 作成者名（最大50文字）
    const authorInput = page.locator('input[name="author"]')
    await authorInput.fill('a'.repeat(100))
    const authorValue = await authorInput.inputValue()
    expect(authorValue.length).toBeLessThanOrEqual(50)
    
    // 内容（最大2000文字）
    const contentInput = page.locator('textarea[name="content"]')
    await contentInput.fill('a'.repeat(3000))
    const contentValue = await contentInput.inputValue()
    expect(contentValue.length).toBeLessThanOrEqual(2000)
  })

  test('編集をキャンセルできる', async ({ page }) => {
    // 投稿を作成
    await createPost(page, {
      title: '元のタイトル',
      author: '元の作成者',
      content: '元の内容'
    })
    
    // 編集ボタンをクリック
    const postItem = page.locator('.bg-white').filter({ hasText: '元のタイトル' })
    await waitAndClick(postItem, 'button:has-text("編集")')
    
    // 編集フォームで内容を変更
    await safeType(page, 'input[name="title"]', '変更後のタイトル')
    
    // キャンセルボタンをクリック
    await waitAndClick(page, 'button:has-text("キャンセル")')
    
    // 元の内容が表示されることを確認
    await expect(page.locator('text="元のタイトル"')).toBeVisible()
    await expect(page.locator('text="変更後のタイトル"')).not.toBeVisible()
  })
})