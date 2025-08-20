import { Page, expect } from '@playwright/test'

/**
 * E2Eテスト用ヘルパー関数
 * 安定性向上のための待機処理とリトライロジックを提供
 */

/**
 * ページが完全に読み込まれるまで待機
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.waitForLoadState('domcontentloaded')
  // 追加の安定化待機
  await page.waitForTimeout(500)
}

/**
 * 要素が表示されてクリック可能になるまで待機
 */
export async function waitAndClick(page: Page, selector: string, options?: { timeout?: number }) {
  const element = page.locator(selector)
  await element.waitFor({ state: 'visible', timeout: options?.timeout || 10000 })
  await element.waitFor({ state: 'attached', timeout: options?.timeout || 10000 })
  await page.waitForTimeout(200) // 微小な待機
  await element.click({ force: false })
}

/**
 * テキスト入力を安定的に実行
 */
export async function safeType(page: Page, selector: string, text: string, options?: { delay?: number }) {
  const element = page.locator(selector)
  await element.waitFor({ state: 'visible', timeout: 10000 })
  await expect(element).toBeEnabled({ timeout: 10000 })
  await element.clear()
  await page.waitForTimeout(100)
  await element.type(text, { delay: options?.delay || 50 })
}

/**
 * フォーム送信を安定的に実行
 */
export async function submitForm(page: Page, formSelector: string) {
  const form = page.locator(formSelector)
  await form.waitFor({ state: 'visible', timeout: 10000 })
  
  // Enterキーで送信を試みる
  await page.keyboard.press('Enter')
  
  // ネットワークアイドル状態まで待機
  await page.waitForLoadState('networkidle', { timeout: 15000 })
}

/**
 * 投稿が表示されるまで待機
 */
export async function waitForPost(page: Page, title: string, options?: { timeout?: number }) {
  const postLocator = page.locator(`text="${title}"`)
  await postLocator.waitFor({ 
    state: 'visible', 
    timeout: options?.timeout || 15000 
  })
  // 投稿が完全に表示されるまで追加待機
  await page.waitForTimeout(500)
}

/**
 * エラーメッセージのチェック
 */
export async function checkErrorMessage(page: Page, expectedMessage: string) {
  const errorLocator = page.locator('.text-red-500, .text-red-600, [role="alert"]')
  await errorLocator.waitFor({ state: 'visible', timeout: 5000 })
  const errorText = await errorLocator.textContent()
  expect(errorText).toContain(expectedMessage)
}

/**
 * 成功メッセージのチェック
 */
export async function checkSuccessMessage(page: Page, expectedMessage: string) {
  const successLocator = page.locator('.text-green-500, .text-green-600, .bg-green-100')
  await successLocator.waitFor({ state: 'visible', timeout: 5000 })
  const successText = await successLocator.textContent()
  expect(successText).toContain(expectedMessage)
}

/**
 * リトライ付きアクション実行
 */
export async function retryAction<T>(
  action: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}

/**
 * 投稿の作成ヘルパー
 */
export async function createPost(
  page: Page,
  data: { title: string; author: string; content: string }
) {
  await safeType(page, 'input[name="title"]', data.title)
  await safeType(page, 'input[name="author"]', data.author)
  await safeType(page, 'textarea[name="content"]', data.content)
  
  // 送信ボタンをクリック
  await waitAndClick(page, 'button[type="submit"]:has-text("投稿する")')
  
  // 投稿が表示されるまで待機
  await waitForPost(page, data.title)
}

/**
 * 投稿の削除ヘルパー
 */
export async function deletePost(page: Page, title: string) {
  // 投稿を探す
  const postItem = page.locator('.bg-white').filter({ hasText: title })
  await postItem.waitFor({ state: 'visible', timeout: 10000 })
  
  // 削除ボタンをクリック
  const deleteButton = postItem.locator('button:has-text("削除")')
  await deleteButton.click()
  
  // 確認ダイアログでOKをクリック
  page.once('dialog', dialog => dialog.accept())
  
  // 投稿が削除されるまで待機
  await postItem.waitFor({ state: 'hidden', timeout: 10000 })
}

/**
 * ナビゲーション待機ヘルパー
 */
export async function navigateAndWait(page: Page, url: string) {
  await page.goto(url, { 
    waitUntil: 'networkidle',
    timeout: 30000 
  })
  await waitForPageReady(page)
}

/**
 * モバイルビューポート設定
 */
export async function setMobileViewport(page: Page) {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.waitForTimeout(500) // ビューポート変更後の安定化待機
}

/**
 * デスクトップビューポート設定
 */
export async function setDesktopViewport(page: Page) {
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.waitForTimeout(500) // ビューポート変更後の安定化待機
}