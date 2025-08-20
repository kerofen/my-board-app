import { test, expect } from '@playwright/test';

test.describe('オフラインモード', () => {
  test('MongoDBに接続できない場合、警告バナーが表示される', async ({ page, context }) => {
    // ネットワークをオフラインにする（MongoDBへの接続を遮断）
    await context.route('**/api/posts', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
        headers: {
          'X-Database-Mode': 'mock'
        }
      });
    });
    
    await page.goto('/');
    
    // 警告バナーが表示されることを確認
    await expect(page.locator('.bg-yellow-100')).toBeVisible();
    await expect(page.locator('text=オフラインモード')).toBeVisible();
    await expect(page.locator('text=MongoDBに接続できないため、モックデータを使用しています')).toBeVisible();
  });

  test('オフラインモードでもCRUD操作が可能', async ({ page, context }) => {
    // APIリクエストをモックモードでインターセプト
    let mockPosts: any[] = [];
    let nextId = 1;
    
    await context.route('**/api/posts', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockPosts),
          headers: { 'X-Database-Mode': 'mock' }
        });
      } else if (request.method() === 'POST') {
        request.postDataJSON().then(data => {
          const newPost = {
            _id: String(nextId++),
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          mockPosts.unshift(newPost);
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify(newPost),
            headers: { 'X-Database-Mode': 'mock' }
          });
        });
      }
    });
    
    await context.route('**/api/posts/*', (route, request) => {
      const id = request.url().split('/').pop();
      
      if (request.method() === 'PUT') {
        request.postDataJSON().then(data => {
          const index = mockPosts.findIndex(p => p._id === id);
          if (index !== -1) {
            mockPosts[index] = {
              ...mockPosts[index],
              ...data,
              updatedAt: new Date().toISOString()
            };
            route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(mockPosts[index]),
              headers: { 'X-Database-Mode': 'mock' }
            });
          } else {
            route.fulfill({ status: 404 });
          }
        });
      } else if (request.method() === 'DELETE') {
        const index = mockPosts.findIndex(p => p._id === id);
        if (index !== -1) {
          mockPosts.splice(index, 1);
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ message: '削除しました' }),
            headers: { 'X-Database-Mode': 'mock' }
          });
        } else {
          route.fulfill({ status: 404 });
        }
      }
    });
    
    await page.goto('/');
    
    // 警告バナーが表示される
    await expect(page.locator('.bg-yellow-100')).toBeVisible();
    
    // 新規投稿を作成
    await page.fill('input[name="title"]', 'オフライン投稿');
    await page.fill('input[name="author"]', 'オフラインユーザー');
    await page.fill('textarea[name="content"]', 'オフラインでも投稿できる');
    await page.click('button[type="submit"]');
    
    // 投稿が表示される
    await expect(page.locator('text=オフライン投稿')).toBeVisible();
    
    // 編集も可能
    await page.click('button:has-text("編集")');
    await page.fill('input[name="title"]', 'オフライン編集後');
    await page.click('button:has-text("保存")');
    await expect(page.locator('text=オフライン編集後')).toBeVisible();
    
    // 削除も可能
    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("削除")');
    await expect(page.locator('text=オフライン編集後')).not.toBeVisible();
  });

  test('オンラインに復帰するとバナーが消える', async ({ page, context }) => {
    let isOnline = false;
    
    await context.route('**/api/posts', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
        headers: isOnline ? {} : { 'X-Database-Mode': 'mock' }
      });
    });
    
    // 初回はオフライン
    await page.goto('/');
    await expect(page.locator('.bg-yellow-100')).toBeVisible();
    
    // オンラインに切り替え
    isOnline = true;
    await page.reload();
    
    // バナーが消える
    await expect(page.locator('.bg-yellow-100')).not.toBeVisible();
  });
});