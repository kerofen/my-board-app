/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/posts/route';
import { NextRequest } from 'next/server';

// NextRequestのモック
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}));

// MongoDBモックデータベース
const mockDb = {
  posts: [] as any[],
  find: jest.fn(),
  insertOne: jest.fn(),
};

jest.mock('@/lib/mongodb-mock', () => ({
  __esModule: true,
  default: mockDb,
}));

// clientPromiseのモック
jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: Promise.reject(new Error('MongoDB not available')),
}));

describe('/api/posts', () => {
  let mockCollection: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCollection = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          toArray: jest.fn(),
        }),
      }),
      insertOne: jest.fn(),
    };

    (clientPromise as any).then((client: any) => {
      client.db().collection.mockReturnValue(mockCollection);
    });
  });

  describe('GET /api/posts', () => {
    it('投稿一覧を取得できる', async () => {
      const mockPosts = [
        {
          _id: '1',
          title: 'テスト投稿1',
          author: '作成者1',
          content: 'テスト内容1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          _id: '2',
          title: 'テスト投稿2',
          author: '作成者2',
          content: 'テスト内容2',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockCollection.find().sort().toArray.mockResolvedValue(mockPosts);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockPosts);
      expect(mockCollection.find).toHaveBeenCalledWith({});
      expect(mockCollection.find().sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('エラー時は500を返す', async () => {
      mockCollection.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('投稿の取得に失敗しました');
    });
  });

  describe('POST /api/posts', () => {
    it('新規投稿を作成できる', async () => {
      const newPost = {
        title: '新規投稿',
        author: '新規作成者',
        content: '新規内容',
      };

      const mockInsertedPost = {
        _id: '123',
        ...newPost,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCollection.insertOne.mockResolvedValue({
        insertedId: '123',
        acknowledged: true,
      });

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify(newPost),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          title: newPost.title,
          author: newPost.author,
          content: newPost.content,
        })
      );
    });

    it('必須フィールドが不足している場合は400を返す', async () => {
      const invalidPost = {
        title: '新規投稿',
        // authorとcontentが不足
      };

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify(invalidPost),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('必須フィールドが不足しています');
    });

    it('文字数制限を超えた場合は400を返す', async () => {
      const invalidPost = {
        title: 'a'.repeat(101), // 100文字制限を超過
        author: '作成者',
        content: '内容',
      };

      const request = new NextRequest('http://localhost:3000/api/posts', {
        method: 'POST',
        body: JSON.stringify(invalidPost),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('入力値が無効です');
    });
  });
});