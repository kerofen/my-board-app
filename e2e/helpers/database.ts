import { Page } from '@playwright/test'

// テストデータの型定義
export interface TestPost {
  title: string
  author: string
  content: string
  _id?: string
}

// APIを使用してデータを作成
export async function createTestPost(page: Page, post: TestPost): Promise<string> {
  const response = await page.request.post('/api/posts', {
    data: post,
  })
  
  const result = await response.json()
  if (!result.success) {
    throw new Error(`Failed to create test post: ${result.error}`)
  }
  
  return result.data._id
}

// APIを使用してデータを削除
export async function deleteTestPost(page: Page, postId: string): Promise<void> {
  const response = await page.request.delete(`/api/posts/${postId}`)
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(`Failed to delete test post: ${result.error}`)
  }
}

// すべての投稿を取得
export async function getAllPosts(page: Page): Promise<TestPost[]> {
  const response = await page.request.get('/api/posts')
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(`Failed to get posts: ${result.error}`)
  }
  
  return result.data
}

// テストパターンを含む投稿を削除
export async function deleteTestPosts(page: Page, pattern: string = 'テスト'): Promise<number> {
  const posts = await getAllPosts(page)
  const testPosts = posts.filter(post => 
    post.title.includes(pattern) || 
    post.author.includes(pattern) ||
    post.content.includes(pattern)
  )
  
  let deletedCount = 0
  for (const post of testPosts) {
    if (post._id) {
      try {
        await deleteTestPost(page, post._id)
        deletedCount++
      } catch (error) {
        console.error(`Failed to delete post ${post._id}:`, error)
      }
    }
  }
  
  return deletedCount
}

// データベースを完全にクリーンアップ
export async function cleanupDatabase(page: Page): Promise<void> {
  const posts = await getAllPosts(page)
  
  for (const post of posts) {
    if (post._id) {
      try {
        await deleteTestPost(page, post._id)
      } catch (error) {
        console.error(`Failed to delete post ${post._id}:`, error)
      }
    }
  }
}

// テスト用のシードデータ
export const testSeedData: TestPost[] = [
  {
    title: 'E2Eテスト: 編集用データ',
    author: 'E2Eテストユーザー1',
    content: 'このデータは編集テストで使用されます。自動テスト用のデータです。',
  },
  {
    title: 'E2Eテスト: 削除用データ',
    author: 'E2Eテストユーザー2',
    content: 'このデータは削除テストで使用されます。自動テスト用のデータです。',
  },
  {
    title: 'E2Eテスト: 表示確認用データ',
    author: 'E2Eテストユーザー3',
    content: 'このデータは表示確認テストで使用されます。自動テスト用のデータです。',
  },
  {
    title: 'E2Eテスト: 長文データ',
    author: 'E2Eテストユーザー4',
    content: 'あ'.repeat(140), // 最大文字数
  },
  {
    title: 'E2Eテスト: 特殊文字データ',
    author: 'E2Eテスト<>ユーザー',
    content: '改行\nタブ\t特殊文字!"#$%&\'()=~|',
  },
]

// テストデータをセットアップ
export async function setupTestData(page: Page): Promise<string[]> {
  const createdIds: string[] = []
  
  for (const post of testSeedData) {
    try {
      const id = await createTestPost(page, post)
      createdIds.push(id)
    } catch (error) {
      console.error('Failed to create test data:', error)
    }
  }
  
  return createdIds
}

// UIを使用して投稿を削除（ダイアログ処理付き）
export async function deletePostViaUI(page: Page, title: string): Promise<void> {
  // 削除確認ダイアログを自動承認
  page.on('dialog', async dialog => {
    if (dialog.message().includes('削除')) {
      await dialog.accept()
    }
  })
  
  // 投稿を探して削除ボタンをクリック
  const postElement = page.locator('.bg-white.rounded-lg.shadow-md')
    .filter({ hasText: title })
    .first()
  
  const deleteButton = postElement.locator('button:has-text("削除")')
  await deleteButton.click()
  
  // 削除完了を待つ
  await page.waitForSelector(`text=${title}`, { state: 'detached', timeout: 5000 })
}

// UIを使用してすべての投稿を削除
export async function deleteAllPostsViaUI(page: Page): Promise<void> {
  // 削除確認ダイアログを自動承認
  page.on('dialog', async dialog => {
    if (dialog.message().includes('削除')) {
      await dialog.accept()
    }
  })
  
  // すべての削除ボタンを取得
  let deleteButtons = await page.locator('button:has-text("削除")').all()
  
  while (deleteButtons.length > 0) {
    // 最初の削除ボタンをクリック
    await deleteButtons[0].click()
    
    // 削除完了を待つ
    await page.waitForTimeout(500)
    
    // 残りの削除ボタンを再取得
    deleteButtons = await page.locator('button:has-text("削除")').all()
  }
}

// 投稿が存在するか確認
export async function postExists(page: Page, title: string): Promise<boolean> {
  const posts = await getAllPosts(page)
  return posts.some(post => post.title === title)
}

// 投稿数を取得
export async function getPostCount(page: Page): Promise<number> {
  const posts = await getAllPosts(page)
  return posts.length
}