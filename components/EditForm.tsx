'use client';

import { useState } from 'react';
import { Post } from '@/app/page';

interface EditFormProps {
  post: Post;
  onCancel: () => void;
  onSaved: () => void;
}

export default function EditForm({ post, onCancel, onSaved }: EditFormProps) {
  const [title, setTitle] = useState(post.title);
  const [author, setAuthor] = useState(post.author);
  const [content, setContent] = useState(post.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !author || !content) {
      alert('すべての項目を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/posts/${post._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': post.userId,
        },
        body: JSON.stringify({ title, author, content }),
      });

      const data = await response.json();

      if (data.success) {
        onSaved();
      } else {
        alert('更新に失敗しました');
      }
    } catch (error) {
      console.error('エラー:', error);
      alert('更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6" data-testid="edit-form">
      <h3 className="text-lg sm:text-xl font-bold mb-4">投稿を編集</h3>
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="edit-form-container">
        <div>
          <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
            タイトル
          </label>
          <input
            type="text"
            id="edit-title"
            data-testid="edit-form-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={100}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="edit-author" className="block text-sm font-medium text-gray-700 mb-1">
            投稿者名
          </label>
          <input
            type="text"
            id="edit-author"
            data-testid="edit-form-author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={50}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="edit-content" className="block text-sm font-medium text-gray-700 mb-1">
            内容
          </label>
          <textarea
            id="edit-content"
            data-testid="edit-form-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={5}
            maxLength={140}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            data-testid="edit-form-save"
            disabled={isSubmitting}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? '保存中...' : '保存'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            data-testid="edit-form-cancel"
            disabled={isSubmitting}
            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}