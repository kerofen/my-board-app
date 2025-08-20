'use client';

import { useState } from 'react';

interface PostFormProps {
  onPostCreated: () => void;
}

export default function PostForm({ onPostCreated }: PostFormProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !author.trim() || !content.trim()) {
      alert('すべての項目を入力してください');
      return;
    }

    if (content.length > 140) {
      alert('投稿文は140文字以内で入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, author, content }),
      });

      const data = await response.json();

      if (data.success) {
        setTitle('');
        setAuthor('');
        setContent('');
        onPostCreated();
      } else {
        alert('投稿の作成に失敗しました');
      }
    } catch (error) {
      console.error('エラー:', error);
      alert('投稿の作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8" data-testid="post-form">
      <h2 className="text-xl font-bold mb-4">新規投稿</h2>
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="post-form-container">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            タイトル
          </label>
          <input
            type="text"
            id="title"
            data-testid="post-form-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={100}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
            投稿者名
          </label>
          <input
            type="text"
            id="author"
            data-testid="post-form-author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={50}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            内容 {content.length > 0 && <span className={`text-sm ${content.length > 140 ? 'text-red-500' : 'text-gray-500'}`}>({content.length}/140)</span>}
          </label>
          <textarea
            id="content"
            data-testid="post-form-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${content.length > 140 ? 'border-red-500' : 'border-gray-300'}`}
            rows={5}
            maxLength={140}
            disabled={isSubmitting}
            placeholder="140文字以内で入力してください"
          />
        </div>

        <button
          type="submit"
          data-testid="post-form-submit"
          disabled={isSubmitting || !title.trim() || !author.trim() || !content.trim() || content.length > 140}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" data-testid="post-form-loading">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              投稿中...
            </>
          ) : (
            '投稿する'
          )}
        </button>
      </form>
    </div>
  );
}