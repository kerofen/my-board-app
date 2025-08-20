// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock環境変数
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db'

// グローバルなモック設定
global.fetch = jest.fn()

// console.errorをモック（テスト中の不要なエラー出力を抑制）
const originalError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalError
})

// 各テスト後にモックをリセット
afterEach(() => {
  jest.clearAllMocks()
})