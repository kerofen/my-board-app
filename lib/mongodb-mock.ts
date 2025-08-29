// MongoDBが利用できない場合のモックデータ
export const mockPosts = [
  {
    _id: '1',
    title: 'サンプル投稿',
    author: 'テストユーザー',
    content: 'これはMongoDBが接続できない場合のサンプル投稿です。',
    userId: 'system_user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

let inMemoryPosts = [...mockPosts];
let nextId = 2;

export const mockDb = {
  async find() {
    return inMemoryPosts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
  
  async create(data: { title: string; author: string; content: string; userId: string }) {
    const newPost = {
      _id: String(nextId++),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryPosts.push(newPost);
    return newPost;
  },
  
  async findById(id: string) {
    return inMemoryPosts.find(p => p._id === id);
  },
  
  async findByIdAndUpdate(id: string, data: { title?: string; author?: string; content?: string }) {
    const index = inMemoryPosts.findIndex(p => p._id === id);
    if (index === -1) return null;
    
    inMemoryPosts[index] = {
      ...inMemoryPosts[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return inMemoryPosts[index];
  },
  
  async findByIdAndDelete(id: string) {
    const index = inMemoryPosts.findIndex(p => p._id === id);
    if (index === -1) return null;
    
    const deleted = inMemoryPosts[index];
    inMemoryPosts = inMemoryPosts.filter(p => p._id !== id);
    return deleted;
  }
};