import { test, expect } from '@playwright/test'

test.describe('Smoke Tests @smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Application loads @smoke', async ({ page }) => {
    await expect(page).toHaveTitle(/Simple Board/)
    const header = page.locator('h1')
    await expect(header).toBeVisible()
    await expect(header).toHaveText('シンプル掲示板')
  })

  test('Post form is visible @smoke', async ({ page }) => {
    const postForm = page.locator('[data-testid="post-form"]')
    await expect(postForm).toBeVisible()
  })

  test('Can create a post @smoke @critical', async ({ page }) => {
    await page.fill('[data-testid="post-form-title"]', 'Smoke Test')
    await page.fill('[data-testid="post-form-author"]', 'Tester')
    await page.fill('[data-testid="post-form-content"]', 'Test content')
    await page.click('[data-testid="post-form-submit"]')
    
    await page.waitForTimeout(1000)
    
    const newPost = page.locator('[data-testid="post-item-0"]')
    await expect(newPost).toBeVisible({ timeout: 5000 })
  })
})