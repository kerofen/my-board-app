// test-data.ts はテストヘルパーであり、テスト自体ではないため、テストは不要
import { Post } from '@/app/page'

// テスト用の投稿データファクトリー
export function createMockPost(overrides?: Partial<Post>): Post {
  return {
    _id: 'test-id-' + Math.random().toString(36).substr(2, 9),
    title: 'テスト投稿',
    author: 'テストユーザー',
    content: 'これはテスト用の投稿内容です。',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

// 複数の投稿データを生成
export function createMockPosts(count: number): Post[] {
  return Array.from({ length: count }, (_, i) => 
    createMockPost({
      _id: `test-id-${i}`,
      title: `テスト投稿 ${i + 1}`,
      author: `テストユーザー ${i + 1}`,
      content: `これはテスト投稿 ${i + 1} の内容です。`,
    })
  )
}

// 境界値テスト用データ
export const boundaryTestData = {
  title: {
    min: 'あ',
    max: 'あ'.repeat(100),
    over: 'あ'.repeat(101),
  },
  author: {
    min: 'あ',
    max: 'あ'.repeat(50),
    over: 'あ'.repeat(51),
  },
  content: {
    min: 'あ',
    max: 'あ'.repeat(140),
    over: 'あ'.repeat(141),
  },
}

// 特殊文字を含むテストデータ
export const specialCharacterData = {
  title: '<script>alert("XSS")</script>',
  author: '"; DROP TABLE posts; --',
  content: '改行を\n含む\nテキスト',
}

// 空白文字のテストデータ
export const whitespaceData = {
  empty: '',
  spaces: '   ',
  tabs: '\t\t\t',
  newlines: '\n\n\n',
  mixed: '  \t\n  ',
}