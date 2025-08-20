'use client';

import { useState } from 'react';
import { Post } from '@/app/page';
import EditForm from './EditForm';

interface PostItemProps {
  post: Post;
  onPostDeleted: () => void;
  index?: number;
}

export default function PostItem({ post, onPostDeleted, index }: PostItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDelete = async () => {
    if (!confirm('本当に削除しますか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${post._id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        onPostDeleted();
      } else {
        alert('削除に失敗しました');
      }
    } catch (error) {
      console.error('エラー:', error);
      alert('削除に失敗しました');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP');
  };

  if (isEditing) {
    return (
      <EditForm
        post={post}
        onCancel={() => setIsEditing(false)}
        onSaved={() => {
          setIsEditing(false);
          onPostDeleted();
        }}
      />
    );
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-6"
      data-testid={index !== undefined ? `post-item-${index}` : 'post-item'}
      data-post-id={post._id}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2" data-testid="post-item-title">{post.title}</h3>
          <div className="text-sm text-gray-600 space-x-4">
            <span data-testid="post-item-author">投稿者: {post.author}</span>
            <span data-testid="post-item-date">{formatDate(post.createdAt)}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsEditing(true)}
            data-testid="post-item-edit"
            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            編集
          </button>
          <button
            onClick={handleDelete}
            data-testid="post-item-delete"
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            削除
          </button>
        </div>
      </div>

      <div className="text-gray-800" data-testid="post-item-content">
        {isExpanded || post.content.length <= 200 ? (
          <p className="whitespace-pre-wrap">{post.content}</p>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{post.content.substring(0, 200)}...</p>
            <button
              onClick={() => setIsExpanded(true)}
              className="text-blue-500 hover:underline mt-2"
            >
              続きを読む
            </button>
          </>
        )}
        {isExpanded && post.content.length > 200 && (
          <button
            onClick={() => setIsExpanded(false)}
            className="text-blue-500 hover:underline mt-2 block"
          >
            折りたたむ
          </button>
        )}
      </div>
    </div>
  );
}