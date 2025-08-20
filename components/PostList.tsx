'use client';
import PostItem from './PostItem';
import { Post } from '@/app/page';

interface PostListProps {
  posts: Post[];
  onPostDeleted: () => void;
}

export default function PostList({ posts, onPostDeleted }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center" data-testid="empty-state">
        <p className="text-gray-600">まだ投稿がありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="post-list">
      {posts.map((post, index) => (
        <PostItem 
          key={post._id} 
          post={post} 
          index={index}
          onPostDeleted={onPostDeleted} 
        />
      ))}
    </div>
  );
}