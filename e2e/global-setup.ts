import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 E2Eテストのグローバルセットアップ開始...')
  
  // ブラウザを起動してAPIを使用したデータクリーンアップ
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000'
  
  try {
    // アプリケーションが起動しているか確認
    console.log(`📡 ${baseURL} への接続を確認中...`)
    await page.goto(baseURL, { timeout: 30000 })
    console.log('✅ アプリケーション接続確認完了')
    
    // 既存のテストデータをクリーンアップ
    console.log('🧹 既存のテストデータをクリーンアップ中...')
    const response = await page.request.get(`${baseURL}/api/posts`)
    const result = await response.json()
    
    if (result.success) {
      const posts = result.data
      const testPosts = posts.filter((post: any) => 
        post.title?.includes('E2Eテスト') || 
        post.title?.includes('テストデータ') ||
        post.author?.includes('E2Eテスト') ||
        post.author?.includes('テストユーザー')
      )
      
      console.log(`📊 ${testPosts.length}件のテストデータを検出`)
      
      for (const post of testPosts) {
        if (post._id) {
          try {
            await page.request.delete(`${baseURL}/api/posts/${post._id}`)
            console.log(`  🗑️ 削除: ${post.title}`)
          } catch (error) {
            console.error(`  ❌ 削除失敗: ${post.title}`)
          }
        }
      }
      
      console.log('✨ クリーンアップ完了')
    } else {
      console.warn('⚠️ APIからデータ取得できませんでした')
    }
    
  } catch (error) {
    console.error('❌ グローバルセットアップ中にエラーが発生しました:', error)
    // エラーが発生してもテストは続行
  } finally {
    await browser.close()
  }
  
  console.log('✅ グローバルセットアップ完了\n')
}

export default globalSetup