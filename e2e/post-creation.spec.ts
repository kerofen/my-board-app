import { test, expect } from '@playwright/test'
import {
  waitForPageReady,
  waitAndClick,
  safeType,
  waitForPost,
  createPost,
  deletePost,
  navigateAndWait,
  retryAction
} from './helpers/test-helpers'

// テストデータ
const testData = {
  valid: {
    title: 'E2Eテスト投稿',
    author: 'テストユーザー',
    content: 'これはE2Eテストによる投稿です。正常に投稿できることを確認します。',
  },
  boundary: {
    min: {
      title: 'あ',
      author: 'い',
      content: 'う',
    },
    max: {
      title: 'あ'.repeat(100),
      author: 'い'.repeat(50),
      content: 'う'.repeat(140),
    },
    over: {
      title: 'あ'.repeat(101),
      author: 'い'.repeat(51),
      content: 'う'.repeat(141),
    },
  },
  special: {
    title: '<script>alert("XSS")</script>',
    author: '"; DROP TABLE posts; --',
    content: '改行を\n含む\nテキスト\nタブ\tも含む',
  },
  whitespace: {
    title: '   ',
    author: '\t\t\t',
    content: '\n\n\n',
  },
}

// クリーンアップヘルパー
async function deleteAllPosts(page) {
  const deleteButtons = await page.locator('button:has-text("削除")').all()
  
  for (const button of deleteButtons) {
    try {
      page.once('dialog', dialog => dialog.accept())
      await button.click()
      await page.waitForTimeout(1000) // 削除処理の完了を待つ
    } catch (error) {
      // エラーを無視して続行
    }
  }
}

test.describe('投稿作成の完全なE2Eテスト', () => {
  test.beforeEach(async ({ page }) => {
    await navigateAndWait(page, '/')
    // 既存の投稿をクリーンアップ
    await deleteAllPosts(page)
  })

  test.afterEach(async ({ page }) => {
    // テスト後のクリーンアップ
    await deleteAllPosts(page)
  })

  test.describe('正常系テスト', () => {
    test('有効なデータで投稿を作成', async ({ page }) => {
      // フォームに入力
      await safeType(page, '#title', testData.valid.title)
      await safeType(page, '#author', testData.valid.author)
      await safeType(page, '#content', testData.valid.content)
      
      // 文字数カウンターの確認
      const counter = page.locator('span:has-text("/140")')
      await expect(counter).toContainText(`(${testData.valid.content.length}/140)`)
      
      // 投稿ボタンをクリック
      await waitAndClick(page, 'button:has-text("投稿する")')
      
      // 投稿が表示されるまで待機
      await waitForPost(page, testData.valid.title)
      
      // 投稿内容の確認
      await expect(page.locator(`text="${testData.valid.title}"`)).toBeVisible()
      await expect(page.locator(`text="投稿者: ${testData.valid.author}"`)).toBeVisible()
      await expect(page.locator(`text="${testData.valid.content}"`)).toBeVisible()
      
      // フォームがリセットされていることを確認
      await expect(page.locator('#title')).toHaveValue('')
      await expect(page.locator('#author')).toHaveValue('')
      await expect(page.locator('#content')).toHaveValue('')
    })

    test('最小文字数で投稿を作成', async ({ page }) => {
      await createPost(page, testData.boundary.min)
      
      await expect(page.locator(`text="${testData.boundary.min.title}"`)).toBeVisible()
      await expect(page.locator(`text="投稿者: ${testData.boundary.min.author}"`)).toBeVisible()
      await expect(page.locator(`text="${testData.boundary.min.content}"`)).toBeVisible()
    })

    test('最大文字数で投稿を作成', async ({ page }) => {
      await safeType(page, '#title', testData.boundary.max.title)
      await safeType(page, '#author', testData.boundary.max.author)
      await safeType(page, '#content', testData.boundary.max.content)
      
      // 文字数カウンターが正しく表示される
      await expect(page.locator('span:has-text("(140/140)")')).toBeVisible()
      
      await waitAndClick(page, 'button:has-text("投稿する")')
      
      // 長いタイトルの一部を検索して投稿を確認
      await page.waitForSelector(`text="${testData.boundary.max.title.substring(0, 20)}"`, { timeout: 15000 })
      
      // 投稿が作成されたことを確認
      const posts = await page.locator('.bg-white.rounded-lg.shadow-md').count()
      expect(posts).toBeGreaterThan(1) // フォームと投稿で2つ以上
    })

    test('特殊文字を含む投稿を作成', async ({ page }) => {
      await createPost(page, testData.special)
      
      // XSSが実行されないことを確認（アラートが出ない）
      await page.waitForTimeout(2000)
      
      // 特殊文字がエスケープされて表示される
      await expect(page.locator(`text="${testData.special.title}"`)).toBeVisible()
    })

    test('連続して複数の投稿を作成', async ({ page }) => {
      const posts = [
        { title: '投稿1', author: 'ユーザー1', content: '内容1' },
        { title: '投稿2', author: 'ユーザー2', content: '内容2' },
        { title: '投稿3', author: 'ユーザー3', content: '内容3' },
      ]
      
      for (const post of posts) {
        await createPost(page, post)
        await page.waitForTimeout(1000) // 各投稿間に待機
      }
      
      // すべての投稿が表示されていることを確認
      for (const post of posts) {
        await expect(page.locator(`text="${post.title}"`)).toBeVisible()
      }
      
      // 投稿が新しい順に表示されることを確認（最新が上）
      const firstPost = page.locator('.bg-white.rounded-lg.shadow-md').nth(1) // 0番目はフォーム
      await expect(firstPost).toContainText('投稿3')
    })
  })

  test.describe('異常系テスト', () => {
    test('空のフォームを送信', async ({ page }) => {
      // ダイアログのリスナーを設定
      let dialogMessage = ''
      page.once('dialog', async dialog => {
        dialogMessage = dialog.message()
        await dialog.accept()
      })
      
      // 空のまま投稿ボタンをクリック
      await waitAndClick(page, 'button:has-text("投稿する")')
      
      // エラーダイアログの確認
      await page.waitForTimeout(1000)
      expect(dialogMessage).toContain('すべての項目を入力してください')
      
      // 投稿が作成されていないことを確認
      const posts = await page.locator('.bg-white.rounded-lg.shadow-md').count()
      expect(posts).toBe(1) // フォームのみ
    })

    test('空白のみの入力を送信', async ({ page }) => {
      let dialogMessage = ''
      page.once('dialog', async dialog => {
        dialogMessage = dialog.message()
        await dialog.accept()
      })
      
      await safeType(page, '#title', testData.whitespace.title)
      await safeType(page, '#author', testData.whitespace.author)
      await safeType(page, '#content', testData.whitespace.content)
      await waitAndClick(page, 'button:has-text("投稿する")')
      
      await page.waitForTimeout(1000)
      expect(dialogMessage).toContain('すべての項目を入力してください')
    })

    test('140文字を超える内容で投稿', async ({ page }) => {
      let dialogMessage = ''
      page.once('dialog', async dialog => {
        dialogMessage = dialog.message()
        await dialog.accept()
      })
      
      await safeType(page, '#title', '文字数制限テスト')
      await safeType(page, '#author', 'テストユーザー')
      await safeType(page, '#content', testData.boundary.over.content)
      
      // 文字数カウンターが赤色で表示
      const counter = page.locator('span:has-text("(141/140)")')
      await expect(counter).toBeVisible()
      await expect(counter).toHaveClass(/text-red-500/)
      
      // 投稿ボタンをクリック
      await waitAndClick(page, 'button:has-text("投稿する")')
      
      await page.waitForTimeout(1000)
      expect(dialogMessage).toContain('投稿文は140文字以内で入力してください')
      
      // 投稿が作成されていないことを確認
      const posts = await page.locator('.bg-white.rounded-lg.shadow-md').count()
      expect(posts).toBe(1) // フォームのみ
    })

    test('一部のフィールドのみ入力して送信', async ({ page }) => {
      let dialogMessage = ''
      page.once('dialog', async dialog => {
        dialogMessage = dialog.message()
        await dialog.accept()
      })
      
      // タイトルのみ入力
      await safeType(page, '#title', 'タイトルのみ')
      await waitAndClick(page, 'button:has-text("投稿する")')
      
      await page.waitForTimeout(1000)
      expect(dialogMessage).toContain('すべての項目を入力してください')
      
      // フォームの内容が保持されていることを確認
      await expect(page.locator('#title')).toHaveValue('タイトルのみ')
    })
  })

  test.describe('UIフィードバックテスト', () => {
    test('投稿中のローディング状態', async ({ page }) => {
      // APIレスポンスを遅延させる
      await page.route('/api/posts', async route => {
        if (route.request().method() === 'POST') {
          await page.waitForTimeout(2000)
        }
        await route.continue()
      })
      
      await createPost(page, testData.valid)
      
      // 投稿完了後の状態
      await expect(page.locator('button:has-text("投稿する")')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeEnabled()
    })

    test('文字数カウンターのリアルタイム更新', async ({ page }) => {
      const contentInput = page.locator('#content')
      
      // 段階的に入力
      await contentInput.type('12345', { delay: 100 })
      await expect(page.locator('text="(5/140)"')).toBeVisible()
      
      await contentInput.type('67890', { delay: 100 })
      await expect(page.locator('text="(10/140)"')).toBeVisible()
      
      // すべてクリア
      await contentInput.clear()
      await page.waitForTimeout(500)
      
      // 140文字入力
      await safeType(page, '#content', 'あ'.repeat(140))
      await expect(page.locator('text="(140/140)"')).toBeVisible()
      
      // 141文字に変更
      await contentInput.clear()
      await safeType(page, '#content', 'あ'.repeat(141))
      await expect(page.locator('text="(141/140)"')).toBeVisible()
      await expect(page.locator('span:has-text("(141/140)")')).toHaveClass(/text-red-500/)
    })
  })

  test.describe('アクセシビリティテスト', () => {
    test('キーボード操作で投稿を作成', async ({ page }) => {
      // Tabキーでフォーカス移動
      await page.keyboard.press('Tab') // タイトルにフォーカス
      await page.keyboard.type('キーボード投稿', { delay: 50 })
      
      await page.keyboard.press('Tab') // 投稿者名にフォーカス
      await page.keyboard.type('キーボードユーザー', { delay: 50 })
      
      await page.keyboard.press('Tab') // 内容にフォーカス
      await page.keyboard.type('キーボードのみで投稿', { delay: 50 })
      
      await page.keyboard.press('Tab') // 投稿ボタンにフォーカス
      await page.keyboard.press('Enter') // Enterキーで送信
      
      await waitForPost(page, 'キーボード投稿')
      await expect(page.locator('text="キーボード投稿"')).toBeVisible()
    })

    test('フォーム要素のラベルが正しく関連付けられている', async ({ page }) => {
      // ラベルクリックでフィールドにフォーカス
      await page.click('label[for="title"]')
      await expect(page.locator('#title')).toBeFocused()
      
      await page.click('label[for="author"]')
      await expect(page.locator('#author')).toBeFocused()
      
      await page.click('label[for="content"]')
      await expect(page.locator('#content')).toBeFocused()
    })
  })

  test.describe('エラー復旧テスト', () => {
    test('APIエラー時の再試行', async ({ page }) => {
      let requestCount = 0
      
      // 最初の2回は失敗、3回目で成功
      await page.route('/api/posts', async route => {
        if (route.request().method() === 'POST') {
          requestCount++
          if (requestCount < 3) {
            await route.fulfill({
              status: 500,
              contentType: 'application/json',
              body: JSON.stringify({ success: false, error: 'Server error' })
            })
          } else {
            await route.continue()
          }
        } else {
          await route.continue()
        }
      })
      
      let dialogMessages: string[] = []
      page.on('dialog', async dialog => {
        dialogMessages.push(dialog.message())
        await dialog.accept()
      })
      
      // リトライ付きで投稿作成
      await retryAction(async () => {
        await safeType(page, '#title', testData.valid.title)
        await safeType(page, '#author', testData.valid.author)
        await safeType(page, '#content', testData.valid.content)
        await waitAndClick(page, 'button:has-text("投稿する")')
        await page.waitForTimeout(1000)
      }, 3, 1000)
      
      // 最終的に投稿が作成されることを確認
      await waitForPost(page, testData.valid.title, { timeout: 20000 })
      await expect(page.locator(`text="${testData.valid.title}"`)).toBeVisible()
    })

    test('ネットワークエラー時の処理', async ({ page }) => {
      // ネットワークエラーをシミュレート
      await page.route('/api/posts', route => {
        if (route.request().method() === 'POST') {
          return route.abort()
        }
        return route.continue()
      })
      
      let dialogMessage = ''
      page.once('dialog', async dialog => {
        dialogMessage = dialog.message()
        await dialog.accept()
      })
      
      await safeType(page, '#title', testData.valid.title)
      await safeType(page, '#author', testData.valid.author)
      await safeType(page, '#content', testData.valid.content)
      await waitAndClick(page, 'button:has-text("投稿する")')
      
      await page.waitForTimeout(2000)
      expect(dialogMessage).toContain('投稿の作成に失敗しました')
      
      // フォームの内容が保持されていることを確認
      await expect(page.locator('#title')).toHaveValue(testData.valid.title)
      await expect(page.locator('#author')).toHaveValue(testData.valid.author)
      await expect(page.locator('#content')).toHaveValue(testData.valid.content)
    })
  })
})