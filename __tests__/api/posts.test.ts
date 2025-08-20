import { GET, POST } from '@/app/api/posts/route'
import { NextRequest } from 'next/server'
import connectDB from '@/lib/mongodb'
import Post from '@/models/Post'
import * as mockDb from '@/lib/mongodb-mock'

// モジュールのモック
jest.mock('@/lib/mongodb')
jest.mock('@/models/Post')
jest.mock('@/lib/mongodb-mock')

describe('POST /api/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('新規投稿を作成できる', async () => {
    const mockPost = {
      _id: '1',
      title: 'テストタイトル',
      author: 'テスト投稿者',
      content: 'テスト内容',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    ;(connectDB as jest.Mock).mockResolvedValueOnce(undefined)
    ;(Post.create as jest.Mock).mockResolvedValueOnce(mockPost)
    
    const request = new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: 'テストタイトル',
        author: 'テスト投稿者',
        content: 'テスト内容',
      }),
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockPost)
  })

  it('必須フィールドがない場合エラーを返す', async () => {
    ;(connectDB as jest.Mock).mockResolvedValueOnce(undefined)
    ;(Post.create as jest.Mock).mockRejectedValueOnce(
      new Error('タイトルは必須です')
    )
    
    const request = new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      body: JSON.stringify({
        author: 'テスト投稿者',
        content: 'テスト内容',
      }),
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('タイトルは必須です')
  })

  it('MongoDB接続失敗時はモックDBを使用する', async () => {
    const mockPost = {
      _id: 'mock_1',
      title: 'テストタイトル',
      author: 'テスト投稿者',
      content: 'テスト内容',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    ;(connectDB as jest.Mock).mockRejectedValueOnce(new Error('接続失敗'))
    ;(mockDb.create as jest.Mock).mockReturnValueOnce(mockPost)
    
    const request = new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: 'テストタイトル',
        author: 'テスト投稿者',
        content: 'テスト内容',
      }),
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockPost)
    expect(data.mock).toBe(true)
  })
})

describe('GET /api/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('投稿一覧を取得できる', async () => {
    const mockPosts = [
      {
        _id: '1',
        title: 'テスト1',
        author: '投稿者1',
        content: '内容1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: '2',
        title: 'テスト2',
        author: '投稿者2',
        content: '内容2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    
    ;(connectDB as jest.Mock).mockResolvedValueOnce(undefined)
    ;(Post.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockResolvedValueOnce(mockPosts),
    })
    
    const response = await GET()
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockPosts)
  })

  it('投稿が0件の場合空配列を返す', async () => {
    ;(connectDB as jest.Mock).mockResolvedValueOnce(undefined)
    ;(Post.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockResolvedValueOnce([]),
    })
    
    const response = await GET()
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
  })

  it('MongoDB接続失敗時はモックDBを使用する', async () => {
    const mockPosts = [
      {
        _id: 'mock_1',
        title: 'モックテスト',
        author: 'モック投稿者',
        content: 'モック内容',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    
    ;(connectDB as jest.Mock).mockRejectedValueOnce(new Error('接続失敗'))
    ;(mockDb.find as jest.Mock).mockReturnValueOnce(mockPosts)
    
    const response = await GET()
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockPosts)
    expect(data.mock).toBe(true)
    expect(data.warning).toContain('オフラインモード')
  })
})