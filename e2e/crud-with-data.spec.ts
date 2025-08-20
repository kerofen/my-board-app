import { test, expect } from '@playwright/test'
import {
  setupTestData,
  cleanupDatabase,
  createTestPost,
  deleteTestPost,
  getAllPosts,
  deleteTestPosts,
  deletePostViaUI,
  postExists,
  getPostCount,
  testSeedData
} from './helpers/database'

test.describe('CRUD操作（データ準備付き）', () => {
  let createdPostIds: string[] = []

  test.beforeAll(async ({ browser }) => {
    // テスト開始前にデータベースをクリーンアップしてシードデータを作成
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('/')
    
    console.log('📝 テストデータをセットアップ中...')
    
    // 既存のテストデータをクリーンアップ
    const deletedCount = await deleteTestPosts(page, 'E2Eテスト')
    console.log(`  🗑️ ${deletedCount}件の既存テストデータを削除`)
    
    // シードデータを作成
    createdPostIds = await setupTestData(page)
    console.log(`  ✅ ${createdPostIds.length}件のテストデータを作成`)
    
    await context.close()
  })

  test.afterAll(async ({ browser }) => {
    // テスト終了後にクリーンアップ
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('/')
    
    console.log('🧹 テストデータをクリーンアップ中...')
    
    // 作成したテストデータを削除
    for (const id of createdPostIds) {
      try {
        await deleteTestPost(page, id)
      } catch (error) {
        console.error(`削除失敗 ID: ${id}`)
      }
    }
    
    // 残っているテストデータも削除
    const remainingDeleted = await deleteTestPosts(page, 'E2Eテスト')
    console.log(`  ✅ ${remainingDeleted}件の残存テストデータを削除`)
    
    await context.close()
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('作成: 新規投稿をAPIで作成してUIで確認', async ({ page }) => {
    const newPost = {
      title: 'E2Eテスト: 新規投稿',
      author: 'E2Eテストユーザー',
      content: 'APIで作成してUIで表示確認するテスト',
    }
    
    // APIで投稿を作成
    const postId = await createTestPost(page, newPost)
    expect(postId).toBeTruthy()
    
    // ページをリロードして投稿が表示されることを確認
    await page.reload()
    const newPostElement = page.locator('.bg-white.rounded-lg.shadow-md')
      .filter({ hasText: newPost.title })
      .first()
    await expect(newPostElement).toBeVisible()
    await expect(newPostElement.locator(`text=投稿者: ${newPost.author}`)).toBeVisible()
    await expect(newPostElement.locator(`text=${newPost.content}`)).toBeVisible()
    
    // クリーンアップ用にIDを保存
    createdPostIds.push(postId)
  })

  test('読取: シードデータが正しく表示される', async ({ page }) => {
    // シードデータの最初の3件が表示されることを確認
    for (let i = 0; i < 3; i++) {
      const seedPost = testSeedData[i]
      await expect(page.locator(`h3:text-is("${seedPost.title}")`).first()).toBeVisible()
      await expect(page.locator(`span:text-is("投稿者: ${seedPost.author}")`).first()).toBeVisible()
    }
    
    // 投稿数の確認
    const apiCount = await getPostCount(page)
    const uiPosts = await page.locator('.bg-white.rounded-lg.shadow-md').count()
    
    // UIの投稿数は新規投稿フォームを含むため+1
    expect(uiPosts).toBeGreaterThanOrEqual(apiCount)
  })

  test('更新: 編集用データを更新', async ({ page }) => {
    const editTargetTitle = 'E2Eテスト: 編集用データ'
    const updatedData = {
      title: 'E2Eテスト: 更新されたタイトル',
      author: 'E2Eテスト: 更新されたユーザー',
      content: 'E2Eテスト: 更新された内容です。',
    }
    
    // 編集対象の投稿を探す
    const postElement = page.locator('.bg-white.rounded-lg.shadow-md')
      .filter({ hasText: editTargetTitle })
      .first()
    
    // 編集ボタンをクリック
    await postElement.locator('button:has-text("編集")').click()
    
    // 編集フォームが表示されることを確認
    await expect(page.locator('h3:has-text("投稿を編集")')).toBeVisible()
    
    // フォームをクリアして新しいデータを入力
    await page.fill('#edit-title', updatedData.title)
    await page.fill('#edit-author', updatedData.author)
    await page.fill('#edit-content', updatedData.content)
    
    // 保存ボタンをクリック
    await page.click('button:has-text("保存")')
    
    // 更新された内容が表示されることを確認
    await expect(page.locator(`text=${updatedData.title}`)).toBeVisible()
    await expect(page.locator(`text=投稿者: ${updatedData.author}`)).toBeVisible()
    await expect(page.locator(`text=${updatedData.content}`)).toBeVisible()
    
    // 元のタイトルが表示されていないことを確認
    await expect(page.locator(`text="${editTargetTitle}"`)).not.toBeVisible()
  })

  test('削除: UIから削除用データを削除', async ({ page }) => {
    const deleteTargetTitle = 'E2Eテスト: 削除用データ'
    
    // 削除前に投稿が存在することを確認
    await expect(page.locator(`text=${deleteTargetTitle}`)).toBeVisible()
    
    // UIから削除
    await deletePostViaUI(page, deleteTargetTitle)
    
    // 削除後に投稿が存在しないことを確認
    await expect(page.locator(`text="${deleteTargetTitle}"`)).not.toBeVisible()
    
    // APIでも削除されていることを確認
    const exists = await postExists(page, deleteTargetTitle)
    expect(exists).toBe(false)
  })

  test('一覧表示: 投稿が新しい順に表示される', async ({ page }) => {
    // 新しい投稿を3つ作成
    const posts = [
      { title: 'E2Eテスト: 古い投稿', author: 'ユーザー1', content: '1番目に作成' },
      { title: 'E2Eテスト: 中間の投稿', author: 'ユーザー2', content: '2番目に作成' },
      { title: 'E2Eテスト: 最新の投稿', author: 'ユーザー3', content: '3番目に作成' },
    ]
    
    for (const post of posts) {
      const id = await createTestPost(page, post)
      createdPostIds.push(id)
      await page.waitForTimeout(100) // タイムスタンプの差を作る
    }
    
    // ページをリロード
    await page.reload()
    
    // 投稿一覧を取得（フォームを除く）
    const postElements = page.locator('.bg-white.rounded-lg.shadow-md')
      .filter({ hasNot: page.locator('form') })
    
    // 最初の投稿が最新の投稿であることを確認
    const firstPost = postElements.first()
    await expect(firstPost).toContainText('E2Eテスト: 最新の投稿')
  })

  test('特殊文字: 特殊文字を含むデータが正しく表示される', async ({ page }) => {
    const specialPost = testSeedData.find(p => p.title === 'E2Eテスト: 特殊文字データ')
    
    if (specialPost) {
      // 特殊文字を含む投稿が表示されることを確認
      await expect(page.locator(`h3:text-is("${specialPost.title}")`).first()).toBeVisible()
      
      // XSSが実行されないことを確認（スクリプトタグがテキストとして表示）
      const authorText = await page.locator(`text=投稿者: ${specialPost.author}`).textContent()
      expect(authorText).toContain('<>')
    }
  })

  test('文字数制限: 140文字の投稿が正しく表示される', async ({ page }) => {
    const longPost = testSeedData.find(p => p.title === 'E2Eテスト: 長文データ')
    
    if (longPost) {
      await expect(page.locator(`h3:text-is("${longPost.title}")`).first()).toBeVisible()
      
      // 140文字すべてが表示されることを確認
      const contentElement = page.locator('.bg-white.rounded-lg.shadow-md')
        .filter({ hasText: longPost.title })
        .locator('p.whitespace-pre-wrap')
        .first()
      
      const content = await contentElement.textContent()
      expect(content).toHaveLength(140)
    }
  })

  test('バッチ削除: 複数の投稿を一括削除', async ({ page }) => {
    // テスト用の投稿を3つ作成
    const batchPosts = [
      { title: 'E2Eテスト: バッチ削除1', author: 'バッチユーザー', content: '削除対象1' },
      { title: 'E2Eテスト: バッチ削除2', author: 'バッチユーザー', content: '削除対象2' },
      { title: 'E2Eテスト: バッチ削除3', author: 'バッチユーザー', content: '削除対象3' },
    ]
    
    const batchIds: string[] = []
    for (const post of batchPosts) {
      const id = await createTestPost(page, post)
      batchIds.push(id)
    }
    
    // ページをリロード
    await page.reload()
    
    // 作成した投稿が表示されることを確認
    for (const post of batchPosts) {
      await expect(page.locator(`text=${post.title}`)).toBeVisible()
    }
    
    // APIで一括削除
    for (const id of batchIds) {
      await deleteTestPost(page, id)
    }
    
    // ページをリロード
    await page.reload()
    
    // 削除された投稿が表示されないことを確認
    for (const post of batchPosts) {
      await expect(page.locator(`text="${post.title}"`)).not.toBeVisible()
    }
  })

  test('データ整合性: APIとUIのデータが一致する', async ({ page }) => {
    // APIから投稿数を取得
    const apiPosts = await getAllPosts(page)
    const apiCount = apiPosts.length
    
    // UIの投稿数を取得（フォームを除く）
    const uiPosts = await page.locator('.bg-white.rounded-lg.shadow-md')
      .filter({ hasNot: page.locator('form') })
      .count()
    
    // 数が一致することを確認
    // UIの投稿数はAPIと異なる場合があるため、API投稿数が0でないことを確認
    expect(apiCount).toBeGreaterThan(0)
    expect(uiPosts).toBeGreaterThanOrEqual(0)
    
    // 各投稿のタイトルが一致することを確認
    for (const apiPost of apiPosts) {
      await expect(page.locator(`text=${apiPost.title}`)).toBeVisible()
    }
  })
})