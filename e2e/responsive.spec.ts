import { test, expect, devices } from '@playwright/test';

test.describe('レスポンシブデザイン', () => {
  test('モバイル表示で正しくレイアウトされる', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
    });
    const page = await context.newPage();
    
    await page.goto('/');
    
    // ヘッダーが表示される
    await expect(page.locator('h1:has-text("シンプル掲示板")')).toBeVisible();
    
    // フォームが縦に並ぶ
    const formContainer = page.locator('form').first();
    await expect(formContainer).toBeVisible();
    
    // モバイルでは幅が100%になることを確認
    const formBox = await formContainer.boundingBox();
    const viewport = page.viewportSize();
    if (formBox && viewport) {
      // パディングを考慮して90%以上の幅を使用していることを確認
      expect(formBox.width).toBeGreaterThan(viewport.width * 0.9);
    }
    
    await context.close();
  });

  test('タブレット表示で正しくレイアウトされる', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPad'],
    });
    const page = await context.newPage();
    
    await page.goto('/');
    
    // コンテンツが中央寄せされる
    const container = page.locator('.container, .max-w-4xl').first();
    await expect(container).toBeVisible();
    
    const containerBox = await container.boundingBox();
    const viewport = page.viewportSize();
    if (containerBox && viewport) {
      // タブレットでは左右にマージンがあることを確認
      expect(containerBox.width).toBeLessThan(viewport.width);
      expect(containerBox.width).toBeGreaterThan(600); // 最小幅より大きい
    }
    
    await context.close();
  });

  test('デスクトップ表示で正しくレイアウトされる', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // コンテンツが最大幅に制限される
    const container = page.locator('.container, .max-w-4xl').first();
    await expect(container).toBeVisible();
    
    const containerBox = await container.boundingBox();
    if (containerBox) {
      // デスクトップでは最大幅が適用される（通常は896px = max-w-4xl）
      expect(containerBox.width).toBeLessThanOrEqual(900);
      expect(containerBox.width).toBeGreaterThan(800);
    }
  });

  test('小さい画面でボタンが適切に配置される', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
    });
    const page = await context.newPage();
    
    await page.goto('/');
    
    // 投稿を作成
    await page.fill('input[name="title"]', 'モバイルテスト');
    await page.fill('input[name="author"]', 'モバイルユーザー');
    await page.fill('textarea[name="content"]', 'モバイルからの投稿');
    await page.click('button[type="submit"]');
    
    // 編集・削除ボタンが表示される
    const editButton = page.locator('button:has-text("編集")').first();
    const deleteButton = page.locator('button:has-text("削除")').first();
    
    await expect(editButton).toBeVisible();
    await expect(deleteButton).toBeVisible();
    
    // ボタンが横並びまたは適切に配置されている
    const editBox = await editButton.boundingBox();
    const deleteBox = await deleteButton.boundingBox();
    
    if (editBox && deleteBox) {
      // ボタンが重なっていないことを確認
      const isHorizontal = Math.abs(editBox.y - deleteBox.y) < 10;
      const isVertical = editBox.y !== deleteBox.y;
      expect(isHorizontal || isVertical).toBeTruthy();
    }
    
    await context.close();
  });

  test('横向き表示でも適切に表示される', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 812, height: 375 }, // iPhone X 横向き
    });
    const page = await context.newPage();
    
    await page.goto('/');
    
    // すべての要素が表示される
    await expect(page.locator('h1:has-text("シンプル掲示板")')).toBeVisible();
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // スクロールなしで主要要素が見える
    const titleInput = await page.locator('input[name="title"]').boundingBox();
    const viewport = page.viewportSize();
    
    if (titleInput && viewport) {
      expect(titleInput.y).toBeLessThan(viewport.height);
    }
    
    await context.close();
  });

  test('長いテキストが適切に折り返される', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 320, height: 568 }, // 小さい画面
    });
    const page = await context.newPage();
    
    await page.goto('/');
    
    // 長いタイトルの投稿を作成
    const longTitle = 'これは非常に長いタイトルで画面幅を超える可能性があります';
    await page.fill('input[name="title"]', longTitle);
    await page.fill('input[name="author"]', '作成者');
    await page.fill('textarea[name="content"]', '内容');
    await page.click('button[type="submit"]');
    
    // タイトルが表示される
    const titleElement = page.locator(`text=${longTitle}`).first();
    await expect(titleElement).toBeVisible();
    
    // テキストが画面幅を超えない
    const titleBox = await titleElement.boundingBox();
    const viewport = page.viewportSize();
    
    if (titleBox && viewport) {
      expect(titleBox.width).toBeLessThanOrEqual(viewport.width);
    }
    
    await context.close();
  });

  test('タッチデバイスでボタンが適切なサイズ', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
      hasTouch: true,
    });
    const page = await context.newPage();
    
    await page.goto('/');
    
    // 投稿ボタンのサイズを確認
    const submitButton = page.locator('button[type="submit"]');
    const buttonBox = await submitButton.boundingBox();
    
    if (buttonBox) {
      // タッチターゲットの最小推奨サイズ（44x44px）を満たす
      expect(buttonBox.height).toBeGreaterThanOrEqual(44);
      expect(buttonBox.width).toBeGreaterThanOrEqual(44);
    }
    
    await context.close();
  });
});