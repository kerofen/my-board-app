'use client';

import { useState, useEffect, lazy, Suspense } from 'react';

const PostForm = lazy(() => import('@/components/PostForm'));
const PostList = lazy(() => import('@/components/PostList'));

export interface Post {
  _id: string;
  title: string;
  author: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts');
      const data = await response.json();
      if (data.success) {
        setPosts(data.data);
        setIsOfflineMode(data.mock === true);
        if (data.warning) {
          console.warn(data.warning);
        }
      }
    } catch (error) {
      console.error('投稿の取得に失敗しました:', error);
      setIsOfflineMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostCreated = () => {
    fetchPosts();
  };

  const handlePostDeleted = () => {
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">シンプル掲示板</h1>
        
        {isOfflineMode && (
          <div className="max-w-4xl mx-auto mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded" data-testid="offline-banner">
            <p className="font-bold">オフラインモード</p>
            <p className="text-sm">MongoDBに接続できないため、データは一時的にメモリに保存されます。</p>
          </div>
        )}
        
        <div className="max-w-4xl mx-auto">
          <Suspense fallback={
            <div className="text-center py-8">
              <p className="text-gray-600">フォームを読み込み中...</p>
            </div>
          }>
            <PostForm onPostCreated={handlePostCreated} />
          </Suspense>
          
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">読み込み中...</p>
            </div>
          ) : (
            <Suspense fallback={
              <div className="text-center py-8">
                <p className="text-gray-600">投稿一覧を読み込み中...</p>
              </div>
            }>
              <PostList posts={posts} onPostDeleted={handlePostDeleted} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}