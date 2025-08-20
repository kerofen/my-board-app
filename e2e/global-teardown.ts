import { chromium, FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('\n🏁 E2Eテストのグローバルティアダウン開始...')
  
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  
  const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000'
  
  try {
    await page.goto(baseURL, { timeout: 30000 })
    
    // テスト後のクリーンアップ
    console.log('🧹 テスト後のクリーンアップ中...')
    const response = await page.request.get(`${baseURL}/api/posts`)
    const result = await response.json()
    
    if (result.success) {
      const posts = result.data
      const testPosts = posts.filter((post: any) => 
        post.title?.includes('E2Eテスト') || 
        post.title?.includes('スモークテスト') ||
        post.title?.includes('テスト投稿') ||
        post.author?.includes('E2Eテスト') ||
        post.author?.includes('テストユーザー')
      )
      
      console.log(`📊 ${testPosts.length}件のテストデータを検出`)
      
      let deletedCount = 0
      for (const post of testPosts) {
        if (post._id) {
          try {
            await page.request.delete(`${baseURL}/api/posts/${post._id}`)
            deletedCount++
          } catch (error) {
            console.error(`  ❌ 削除失敗: ${post.title}`)
          }
        }
      }
      
      console.log(`✨ ${deletedCount}件のテストデータを削除しました`)
    }
    
    // 最終的なデータ数を確認
    const finalResponse = await page.request.get(`${baseURL}/api/posts`)
    const finalResult = await finalResponse.json()
    if (finalResult.success) {
      console.log(`📊 最終的なデータ数: ${finalResult.data.length}件`)
    }
    
  } catch (error) {
    console.error('❌ グローバルティアダウン中にエラーが発生しました:', error)
  } finally {
    await browser.close()
  }
  
  console.log('✅ グローバルティアダウン完了')
}

export default globalTeardown