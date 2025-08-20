import { GET, POST } from '@/app/api/posts/route'
import { GET as GET_BY_ID, PUT, DELETE } from '@/app/api/posts/[id]/route'
import { NextRequest } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Post from '@/models/Post'
import * as mockDb from '@/lib/mongodb-mock'
import { createMockPost, createMockPosts, boundaryTestData, specialCharacterData } from '../../test-helpers/test-data'

// モジュールのモック
jest.mock('@/lib/mongodb')
jest.mock('@/models/Post')
jest.mock('@/lib/mongodb-mock')

describe('CRUD API 詳細テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // デフォルトのモック設定
    ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
  })

  describe('POST /api/posts - 投稿作成', () => {
    describe('正常系', () => {
      it('有効なデータで投稿を作成できる', async () => {
        const newPost = createMockPost()
        ;(Post.create as jest.Mock).mockResolvedValueOnce(newPost)
        
        const request = new NextRequest('http://localhost:3000/api/posts', {
          method: 'POST',
          body: JSON.stringify({
            title: newPost.title,
            author: newPost.author,
            content: newPost.content,
          }),
        })
        
        const response = await POST(request)
        const data = await response.json()
        
        expect(response.status).toBe(201)
        expect(data).toEqual({
          success: true,
          data: newPost,
        })
        expect(Post.create).toHaveBeenCalledWith({
          title: newPost.title,
          author: newPost.author,
          content: newPost.content,
        })
      })

      it('最小文字数で投稿を作成できる', async () => {
        const minPost = createMockPost({
          title: boundaryTestData.title.min,
          author: boundaryTestData.author.min,
          content: boundaryTestData.content.min,
        })
        ;(Post.create as jest.Mock).mockResolvedValueOnce(minPost)
        
        const request = new NextRequest('http://localhost:3000/api/posts', {
          method: 'POST',
          body: JSON.stringify({
            title: boundaryTestData.title.min,
            author: boundaryTestData.author.min,
            content: boundaryTestData.content.min,
          }),
        })
        
        const response = await POST(request)
        expect(response.status).toBe(201)
      })

      it('最大文字数で投稿を作成できる', async () => {
        const maxPost = createMockPost({
          title: boundaryTestData.title.max,
          author: boundaryTestData.author.max,
          content: boundaryTestData.content.max,
        })
        ;(Post.create as jest.Mock).mockResolvedValueOnce(maxPost)
        
        const request = new NextRequest('http://localhost:3000/api/posts', {
          method: 'POST',
          body: JSON.stringify({
            title: boundaryTestData.title.max,
            author: boundaryTestData.author.max,
            content: boundaryTestData.content.max,
          }),
        })
        
        const response = await POST(request)
        expect(response.status).toBe(201)
      })

      it('特殊文字を含む投稿を作成できる', async () => {
        const specialPost = createMockPost(specialCharacterData)
        ;(Post.create as jest.Mock).mockResolvedValueOnce(specialPost)
        
        const request = new NextRequest('http://localhost:3000/api/posts', {
          method: 'POST',
          body: JSON.stringify(specialCharacterData),
        })
        
        const response = await POST(request)
        const data = await response.json()
        
        expect(response.status).toBe(201)
        expect(data.success).toBe(true)
      })
    })

    describe('異常系', () => {
      it('タイトルが欠落している場合400エラー', async () => {
        ;(Post.create as jest.Mock).mockRejectedValueOnce({
          name: 'ValidationError',
          message: 'タイトルは必須です',
        })
        
        const request = new NextRequest('http://localhost:3000/api/posts', {
          method: 'POST',
          body: JSON.stringify({
            author: 'テストユーザー',
            content: 'テスト内容',
          }),
        })
        
        const response = await POST(request)
        const data = await response.json()
        
        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
        expect(data.error).toContain('タイトルは必須です')
      })

      it('文字数制限を超える場合400エラー', async () => {
        ;(Post.create as jest.Mock).mockRejectedValueOnce({
          name: 'ValidationError',
          message: '内容は140文字以内で入力してください',
        })
        
        const request = new NextRequest('http://localhost:3000/api/posts', {
          method: 'POST',
          body: JSON.stringify({
            title: 'テスト',
            author: 'テストユーザー',
            content: boundaryTestData.content.over,
          }),
        })
        
        const response = await POST(request)
        const data = await response.json()
        
        expect(response.status).toBe(400)
        expect(data.error).toContain('140文字以内')
      })

      it('不正なJSONの場合500エラー', async () => {
        const request = new NextRequest('http://localhost:3000/api/posts', {
          method: 'POST',
          body: 'invalid json',
        })
        
        const response = await POST(request)
        const data = await response.json()
        
        expect(response.status).toBe(500)
        expect(data.success).toBe(false)
      })
    })

    describe('フォールバック処理', () => {
      it('MongoDB接続失敗時はモックDBを使用', async () => {
        ;(dbConnect as jest.Mock).mockRejectedValueOnce(new Error('接続失敗'))
        const mockPost = createMockPost({ _id: 'mock_1' })
        ;(mockDb.create as jest.Mock).mockReturnValueOnce(mockPost)
        
        const request = new NextRequest('http://localhost:3000/api/posts', {
          method: 'POST',
          body: JSON.stringify({
            title: 'テスト',
            author: 'ユーザー',
            content: '内容',
          }),
        })
        
        const response = await POST(request)
        const data = await response.json()
        
        expect(response.status).toBe(201)
        expect(data.success).toBe(true)
        expect(data.mock).toBe(true)
        expect(data.data).toEqual(mockPost)
      })
    })
  })

  describe('GET /api/posts - 投稿一覧取得', () => {
    describe('正常系', () => {
      it('投稿一覧を取得できる', async () => {
        const mockPosts = createMockPosts(5)
        ;(Post.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValueOnce(mockPosts),
        })
        
        const response = await GET()
        const data = await response.json()
        
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toHaveLength(5)
        expect(data.data).toEqual(mockPosts)
        expect(Post.find).toHaveBeenCalled()
      })

      it('投稿が0件の場合空配列を返す', async () => {
        ;(Post.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValueOnce([]),
        })
        
        const response = await GET()
        const data = await response.json()
        
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toEqual([])
      })

      it('投稿が作成日時の降順でソートされる', async () => {
        const sortMock = jest.fn().mockResolvedValueOnce([])
        ;(Post.find as jest.Mock).mockReturnValue({ sort: sortMock })
        
        await GET()
        
        expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 })
      })
    })

    describe('異常系', () => {
      it('データベースエラー時は500エラー', async () => {
        ;(Post.find as jest.Mock).mockReturnValue({
          sort: jest.fn().mockRejectedValueOnce(new Error('DB Error')),
        })
        
        const response = await GET()
        const data = await response.json()
        
        expect(response.status).toBe(500)
        expect(data.success).toBe(false)
        expect(data.error).toBe('投稿の取得に失敗しました')
      })
    })

    describe('フォールバック処理', () => {
      it('MongoDB接続失敗時はモックDBを使用', async () => {
        ;(dbConnect as jest.Mock).mockRejectedValueOnce(new Error('接続失敗'))
        const mockPosts = createMockPosts(3)
        ;(mockDb.find as jest.Mock).mockReturnValueOnce(mockPosts)
        
        const response = await GET()
        const data = await response.json()
        
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.mock).toBe(true)
        expect(data.warning).toContain('オフラインモード')
        expect(data.data).toEqual(mockPosts)
      })
    })
  })

  describe('GET /api/posts/[id] - 個別投稿取得', () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/posts/123')
    const mockParams = { params: Promise.resolve({ id: '123' }) }

    describe('正常系', () => {
      it('指定IDの投稿を取得できる', async () => {
        const mockPost = createMockPost({ _id: '123' })
        ;(Post.findById as jest.Mock).mockResolvedValueOnce(mockPost)
        
        const response = await GET_BY_ID(mockRequest, mockParams)
        const data = await response.json()
        
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toEqual(mockPost)
        expect(Post.findById).toHaveBeenCalledWith('123')
      })
    })

    describe('異常系', () => {
      it('投稿が見つからない場合404エラー', async () => {
        ;(Post.findById as jest.Mock).mockResolvedValueOnce(null)
        
        const response = await GET_BY_ID(mockRequest, mockParams)
        const data = await response.json()
        
        expect(response.status).toBe(404)
        expect(data.success).toBe(false)
        expect(data.error).toBe('投稿が見つかりません')
      })

      it('データベースエラー時は500エラー', async () => {
        ;(Post.findById as jest.Mock).mockRejectedValueOnce(new Error('DB Error'))
        
        const response = await GET_BY_ID(mockRequest, mockParams)
        const data = await response.json()
        
        expect(response.status).toBe(500)
        expect(data.success).toBe(false)
      })
    })
  })

  describe('PUT /api/posts/[id] - 投稿更新', () => {
    const mockParams = { params: Promise.resolve({ id: '123' }) }

    describe('正常系', () => {
      it('投稿を更新できる', async () => {
        const updatedPost = createMockPost({
          _id: '123',
          title: '更新後のタイトル',
        })
        ;(Post.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(updatedPost)
        
        const request = new NextRequest('http://localhost:3000/api/posts/123', {
          method: 'PUT',
          body: JSON.stringify({
            title: '更新後のタイトル',
            author: '更新後の投稿者',
            content: '更新後の内容',
          }),
        })
        
        const response = await PUT(request, mockParams)
        const data = await response.json()
        
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toEqual(updatedPost)
        expect(Post.findByIdAndUpdate).toHaveBeenCalledWith(
          '123',
          expect.objectContaining({
            title: '更新後のタイトル',
            author: '更新後の投稿者',
            content: '更新後の内容',
          }),
          { new: true, runValidators: true }
        )
      })

      it('部分更新ができる', async () => {
        const updatedPost = createMockPost({ _id: '123' })
        ;(Post.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(updatedPost)
        
        const request = new NextRequest('http://localhost:3000/api/posts/123', {
          method: 'PUT',
          body: JSON.stringify({
            title: '新しいタイトルのみ',
            author: '既存の投稿者',
            content: '既存の内容',
          }),
        })
        
        const response = await PUT(request, mockParams)
        
        expect(response.status).toBe(200)
      })
    })

    describe('異常系', () => {
      it('投稿が見つからない場合404エラー', async () => {
        ;(Post.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(null)
        
        const request = new NextRequest('http://localhost:3000/api/posts/123', {
          method: 'PUT',
          body: JSON.stringify({
            title: '更新',
            author: '更新',
            content: '更新',
          }),
        })
        
        const response = await PUT(request, mockParams)
        const data = await response.json()
        
        expect(response.status).toBe(404)
        expect(data.error).toBe('投稿が見つかりません')
      })

      it('バリデーションエラー時は400エラー', async () => {
        ;(Post.findByIdAndUpdate as jest.Mock).mockRejectedValueOnce({
          name: 'ValidationError',
          message: '内容は140文字以内で入力してください',
        })
        
        const request = new NextRequest('http://localhost:3000/api/posts/123', {
          method: 'PUT',
          body: JSON.stringify({
            title: 'タイトル',
            author: '投稿者',
            content: boundaryTestData.content.over,
          }),
        })
        
        const response = await PUT(request, mockParams)
        const data = await response.json()
        
        expect(response.status).toBe(400)
        expect(data.error).toContain('140文字以内')
      })
    })
  })

  describe('DELETE /api/posts/[id] - 投稿削除', () => {
    const mockParams = { params: Promise.resolve({ id: '123' }) }
    const mockRequest = new NextRequest('http://localhost:3000/api/posts/123')

    describe('正常系', () => {
      it('投稿を削除できる', async () => {
        const deletedPost = createMockPost({ _id: '123' })
        ;(Post.findByIdAndDelete as jest.Mock).mockResolvedValueOnce(deletedPost)
        
        const response = await DELETE(mockRequest, mockParams)
        const data = await response.json()
        
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.data).toBe(null)
        expect(Post.findByIdAndDelete).toHaveBeenCalledWith('123')
      })
    })

    describe('異常系', () => {
      it('投稿が見つからない場合404エラー', async () => {
        ;(Post.findByIdAndDelete as jest.Mock).mockResolvedValueOnce(null)
        
        const response = await DELETE(mockRequest, mockParams)
        const data = await response.json()
        
        expect(response.status).toBe(404)
        expect(data.success).toBe(false)
        expect(data.error).toBe('投稿が見つかりません')
      })

      it('データベースエラー時は500エラー', async () => {
        ;(Post.findByIdAndDelete as jest.Mock).mockRejectedValueOnce(new Error('DB Error'))
        
        const response = await DELETE(mockRequest, mockParams)
        const data = await response.json()
        
        expect(response.status).toBe(500)
        expect(data.success).toBe(false)
        expect(data.error).toBe('投稿の削除に失敗しました')
      })
    })

    describe('フォールバック処理', () => {
      it('MongoDB接続失敗時はモックDBを使用', async () => {
        ;(dbConnect as jest.Mock).mockRejectedValueOnce(new Error('接続失敗'))
        const deletedPost = createMockPost({ _id: 'mock_123' })
        ;(mockDb.findByIdAndDelete as jest.Mock).mockReturnValueOnce(deletedPost)
        
        const response = await DELETE(mockRequest, mockParams)
        const data = await response.json()
        
        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.mock).toBe(true)
      })
    })
  })

  describe('エラーハンドリング共通処理', () => {
    it('予期しないエラーが発生した場合500エラー', async () => {
      ;(Post.find as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error')
      })
      
      const response = await GET()
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    it('開発環境ではエラー詳細が含まれる', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      ;(Post.find as jest.Mock).mockImplementation(() => {
        throw new Error('Detailed error message')
      })
      
      const response = await GET()
      const data = await response.json()
      
      expect(data.error).toContain('Detailed error message')
      
      process.env.NODE_ENV = originalEnv
    })
  })
})