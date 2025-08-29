'use client';

import { useState, useEffect } from 'react';
import { Post } from '@/app/page';
import EditForm from './EditForm';
import { isOwner } from '@/lib/user';

interface PostItemProps {
  post: Post;
  onPostDeleted: () => void;
  index?: number;
}

export default function PostItem({ post, onPostDeleted, index }: PostItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    setCanEdit(isOwner(post.userId));
  }, [post.userId]);

  const handleDelete = async () => {
    if (!confirm('本当に削除しますか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${post._id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': post.userId,
        },
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
      className="bg-white rounded-lg shadow-md p-4 sm:p-6"
      data-testid={index !== undefined ? `post-item-${index}` : 'post-item'}
      data-post-id={post._id}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold mb-2 break-words" data-testid="post-item-title">{post.title}</h3>
          <div className="flex flex-col sm:flex-row text-sm text-gray-600 sm:space-x-4 space-y-1 sm:space-y-0">
            <span data-testid="post-item-author" className="break-words">投稿者: {post.author}</span>
            <span data-testid="post-item-date" className="text-xs sm:text-sm">{formatDate(post.createdAt)}</span>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2 self-start sm:self-auto">
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
        )}
      </div>

      <div className="text-gray-800 break-words overflow-wrap-anywhere" data-testid="post-item-content">
        {isExpanded || post.content.length <= 200 ? (
          <p className="whitespace-pre-wrap break-words">{post.content}</p>
        ) : (
          <>
            <p className="whitespace-pre-wrap break-words">{post.content.substring(0, 200)}...</p>
            <button
              onClick={() => setIsExpanded(true)}
              className="text-blue-500 hover:underline mt-2 inline-block"
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