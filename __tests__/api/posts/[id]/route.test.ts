import { GET, PUT, DELETE } from '@/app/api/posts/[id]/route';
import { NextRequest } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: Promise.resolve({
    db: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue({
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn(),
        deleteOne: jest.fn(),
      }),
    }),
  }),
}));

jest.mock('mongodb', () => ({
  ObjectId: jest.fn((id) => id),
}));

describe('/api/posts/[id]', () => {
  let mockCollection: any;
  const mockId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    jest.clearAllMocks();
    mockCollection = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
    };

    (clientPromise as any).then((client: any) => {
      client.db().collection.mockReturnValue(mockCollection);
    });
  });

  describe('GET /api/posts/[id]', () => {
    it('指定IDの投稿を取得できる', async () => {
      const mockPost = {
        _id: mockId,
        title: 'テスト投稿',
        author: '作成者',
        content: 'テスト内容',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockCollection.findOne.mockResolvedValue(mockPost);

      const response = await GET(
        new NextRequest('http://localhost:3000/api/posts/' + mockId),
        { params: { id: mockId } }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockPost);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: mockId });
    });

    it('存在しないIDの場合は404を返す', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const response = await GET(
        new NextRequest('http://localhost:3000/api/posts/' + mockId),
        { params: { id: mockId } }
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('投稿が見つかりません');
    });

    it('無効なIDの場合は400を返す', async () => {
      const invalidId = 'invalid-id';

      const response = await GET(
        new NextRequest('http://localhost:3000/api/posts/' + invalidId),
        { params: { id: invalidId } }
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('無効なIDです');
    });
  });

  describe('PUT /api/posts/[id]', () => {
    it('投稿を更新できる', async () => {
      const updateData = {
        title: '更新後のタイトル',
        author: '更新後の作成者',
        content: '更新後の内容',
      };

      const updatedPost = {
        _id: mockId,
        ...updateData,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
      };

      mockCollection.findOneAndUpdate.mockResolvedValue({
        value: updatedPost,
      });

      const request = new NextRequest('http://localhost:3000/api/posts/' + mockId, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      const response = await PUT(request, { params: { id: mockId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(updatedPost);
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockId },
        {
          $set: {
            ...updateData,
            updatedAt: expect.any(Date),
          },
        },
        { returnDocument: 'after' }
      );
    });

    it('存在しないIDの更新は404を返す', async () => {
      mockCollection.findOneAndUpdate.mockResolvedValue({ value: null });

      const request = new NextRequest('http://localhost:3000/api/posts/' + mockId, {
        method: 'PUT',
        body: JSON.stringify({
          title: '更新タイトル',
          author: '更新作成者',
          content: '更新内容',
        }),
      });

      const response = await PUT(request, { params: { id: mockId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('投稿が見つかりません');
    });

    it('文字数制限を超えた更新は400を返す', async () => {
      const invalidUpdate = {
        title: 'a'.repeat(101),
        author: '作成者',
        content: '内容',
      };

      const request = new NextRequest('http://localhost:3000/api/posts/' + mockId, {
        method: 'PUT',
        body: JSON.stringify(invalidUpdate),
      });

      const response = await PUT(request, { params: { id: mockId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('入力値が無効です');
    });
  });

  describe('DELETE /api/posts/[id]', () => {
    it('投稿を削除できる', async () => {
      mockCollection.deleteOne.mockResolvedValue({
        deletedCount: 1,
      });

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/posts/' + mockId),
        { params: { id: mockId } }
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('投稿を削除しました');
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: mockId });
    });

    it('存在しないIDの削除は404を返す', async () => {
      mockCollection.deleteOne.mockResolvedValue({
        deletedCount: 0,
      });

      const response = await DELETE(
        new NextRequest('http://localhost:3000/api/posts/' + mockId),
        { params: { id: mockId } }
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('投稿が見つかりません');
    });
  });
});