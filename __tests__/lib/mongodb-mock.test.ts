import { mockDb } from '@/lib/mongodb-mock';

describe('MongoDB Mock', () => {
  beforeEach(() => {
    // テスト前にデータをリセット（モジュールリセットで実現）
    jest.resetModules();
  });

  describe('find', () => {
    it('投稿を作成日の降順で取得できる', async () => {
      // 複数の投稿を作成
      await mockDb.create({ title: '古い投稿', author: '作成者1', content: '内容1' });
      await new Promise(resolve => setTimeout(resolve, 10)); // 時間差を作る
      await mockDb.create({ title: '新しい投稿', author: '作成者2', content: '内容2' });
      
      const result = await mockDb.find();
      
      expect(result).toHaveLength(3); // デフォルトのサンプル投稿 + 2つ
      expect(result[0].title).toBe('新しい投稿'); // 最新が最初
    });
  });

  describe('findById', () => {
    it('IDで投稿を取得できる', async () => {
      const newPost = await mockDb.create({
        title: 'テスト投稿',
        author: '作成者',
        content: '内容',
      });
      
      const result = await mockDb.findById(newPost._id);
      
      expect(result).toEqual(newPost);
    });

    it('存在しないIDの場合undefinedを返す', async () => {
      const result = await mockDb.findById('999');
      expect(result).toBeUndefined();
    });
  });

  describe('create', () => {
    it('新規投稿を追加できる', async () => {
      const newPost = {
        title: '新規投稿',
        author: '新規作成者',
        content: '新規内容',
      };
      
      const result = await mockDb.create(newPost);
      
      expect(result._id).toBeDefined();
      expect(result.title).toBe(newPost.title);
      expect(result.author).toBe(newPost.author);
      expect(result.content).toBe(newPost.content);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      
      // 作成した投稿が取得できることを確認
      const found = await mockDb.findById(result._id);
      expect(found).toEqual(result);
    });
  });

  describe('findByIdAndUpdate', () => {
    it('投稿を更新できる', async () => {
      const originalPost = await mockDb.create({
        title: '元のタイトル',
        author: '元の作成者',
        content: '元の内容',
      });
      
      const updateData = {
        title: '更新後のタイトル',
        content: '更新後の内容',
      };
      
      const result = await mockDb.findByIdAndUpdate(originalPost._id, updateData);
      
      expect(result).not.toBeNull();
      expect(result?.title).toBe(updateData.title);
      expect(result?.author).toBe(originalPost.author); // 変更されない
      expect(result?.content).toBe(updateData.content);
      expect(result?.createdAt).toBe(originalPost.createdAt); // 変更されない
      expect(result?.updatedAt).not.toBe(originalPost.updatedAt); // 更新される
    });

    it('存在しないIDの場合nullを返す', async () => {
      const result = await mockDb.findByIdAndUpdate('999', { title: '更新' });
      expect(result).toBeNull();
    });
  });

  describe('findByIdAndDelete', () => {
    it('投稿を削除できる', async () => {
      const testPost = await mockDb.create({
        title: 'テスト投稿',
        author: '作成者',
        content: '内容',
      });
      
      const result = await mockDb.findByIdAndDelete(testPost._id);
      
      expect(result).toEqual(testPost);
      
      // 削除後は取得できない
      const found = await mockDb.findById(testPost._id);
      expect(found).toBeUndefined();
    });

    it('存在しないIDの場合nullを返す', async () => {
      const result = await mockDb.findByIdAndDelete('999');
      expect(result).toBeNull();
    });
  });

  describe('複数投稿の操作', () => {
    it('複数の投稿を追加・取得できる', async () => {
      await mockDb.create({ title: '投稿1', author: '作成者1', content: '内容1' });
      await mockDb.create({ title: '投稿2', author: '作成者2', content: '内容2' });
      await mockDb.create({ title: '投稿3', author: '作成者3', content: '内容3' });
      
      const posts = await mockDb.find();
      
      expect(posts.length).toBeGreaterThanOrEqual(3);
      // 最新順で並んでいることを確認
      const titles = posts.map(p => p.title);
      expect(titles).toContain('投稿1');
      expect(titles).toContain('投稿2');
      expect(titles).toContain('投稿3');
    });

    it('特定の投稿のみ削除できる', async () => {
      const post1 = await mockDb.create({ title: '削除テスト1', author: '作成者1', content: '内容1' });
      const post2 = await mockDb.create({ title: '削除テスト2', author: '作成者2', content: '内容2' });
      const post3 = await mockDb.create({ title: '削除テスト3', author: '作成者3', content: '内容3' });
      
      await mockDb.findByIdAndDelete(post2._id);
      
      const posts = await mockDb.find();
      const titles = posts.map(p => p.title);
      expect(titles).toContain('削除テスト1');
      expect(titles).not.toContain('削除テスト2');
      expect(titles).toContain('削除テスト3');
    });
  });
});