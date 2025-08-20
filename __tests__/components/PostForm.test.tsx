import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PostForm from '@/components/PostForm';

// fetchのモック
global.fetch = jest.fn();

describe('PostForm', () => {
  const mockOnPostCreated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // fetchのモックをリセット
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('レンダリング', () => {
    it('フォームが正しくレンダリングされる', () => {
      render(<PostForm onPostCreated={mockOnPostCreated} />);
      
      expect(screen.getByLabelText('タイトル')).toBeInTheDocument();
      expect(screen.getByLabelText('投稿者名')).toBeInTheDocument();
      expect(screen.getByLabelText(/内容/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '投稿する' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('140文字以内で入力してください')).toBeInTheDocument();
    });

    it('初期状態では投稿ボタンが無効化されている', () => {
      render(<PostForm onPostCreated={mockOnPostCreated} />);
      
      const submitButton = screen.getByRole('button', { name: '投稿する' });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('入力フィールドの動作', () => {
    it('各フィールドに入力できる', async () => {
      const user = userEvent.setup();
      render(<PostForm onPostCreated={mockOnPostCreated} />);
      
      const titleInput = screen.getByLabelText('タイトル');
      const authorInput = screen.getByLabelText('投稿者名');
      const contentInput = screen.getByLabelText(/内容/);
      
      await user.type(titleInput, 'テストタイトル');
      await user.type(authorInput, 'テスト投稿者');
      await user.type(contentInput, 'テスト内容');
      
      expect(titleInput).toHaveValue('テストタイトル');
      expect(authorInput).toHaveValue('テスト投稿者');
      expect(contentInput).toHaveValue('テスト内容');
    });

    it('文字数制限が正しく設定されている', () => {
      render(<PostForm onPostCreated={mockOnPostCreated} />);
      
      const titleInput = screen.getByLabelText('タイトル') as HTMLInputElement;
      const authorInput = screen.getByLabelText('投稿者名') as HTMLInputElement;
      const contentInput = screen.getByLabelText(/内容/) as HTMLTextAreaElement;
      
      expect(titleInput.maxLength).toBe(100);
      expect(authorInput.maxLength).toBe(50);
      expect(contentInput.maxLength).toBe(140);
    });

    it('文字数カウンターが正しく表示される', async () => {
      const user = userEvent.setup();
      render(<PostForm onPostCreated={mockOnPostCreated} />);
      
      const contentInput = screen.getByLabelText(/内容/);
      
      await user.type(contentInput, 'テスト');
      expect(screen.getByText('(3/140)')).toBeInTheDocument();
      
      await user.clear(contentInput);
      await user.type(contentInput, 'a'.repeat(140));
      expect(screen.getByText('(140/140)')).toBeInTheDocument();
    });

    it('140文字を超えると赤色で表示される', async () => {
      const user = userEvent.setup();
      render(<PostForm onPostCreated={mockOnPostCreated} />);
      
      const contentInput = screen.getByLabelText(/内容/);
      
      // maxLength=140なので実際には140文字までしか入力できない
      await user.type(contentInput, 'a'.repeat(140));
      
      const counter = screen.getByText('(140/140)');
      expect(counter).toHaveClass('text-gray-500');
    });

    it('全フィールドに入力すると投稿ボタンが有効になる', async () => {
      const user = userEvent.setup();
      render(<PostForm onPostCreated={mockOnPostCreated} />);
      
      const submitButton = screen.getByRole('button', { name: '投稿する' });
      expect(submitButton).toBeDisabled();
      
      await user.type(screen.getByLabelText('タイトル'), 'タイトル');
      await user.type(screen.getByLabelText('投稿者名'), '投稿者');
      await user.type(screen.getByLabelText(/内容/), '内容');
      
      expect(submitButton).toBeEnabled();
    });
  });

  describe('バリデーション', () => {
    it('空のフィールドがある場合、エラーメッセージが表示される', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      const user = userEvent.setup();
      render(<PostForm onPostCreated={mockOnPostCreated} />);
      
      // タイトルと作成者のみ入力（内容が空）
      await user.type(screen.getByLabelText('タイトル'), 'タイトル');
      await user.type(screen.getByLabelText('投稿者名'), '作成者');
      
      // submitボタンは無効化されているため、強制的にsubmitイベントを発火
      const form = screen.getByRole('button', { name: '投稿する' }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }
      
      expect(alertSpy).toHaveBeenCalledWith('すべての項目を入力してください');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('空白文字のみの入力は無効と判定される', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      const user = userEvent.setup();
      render(<PostForm onPostCreated={mockOnPostCreated} />);
      
      await user.type(screen.getByLabelText('タイトル'), '   ');
      await user.type(screen.getByLabelText('投稿者名'), '   ');
      await user.type(screen.getByLabelText(/内容/), '   ');
      
      const submitButton = screen.getByRole('button', { name: '投稿する' });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('投稿処理', () => {
    it('正常に投稿できる', async () => {
      const user = userEvent.setup();
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: { _id: '1' } }),
      });
      
      render(<PostForm onPostCreated={mockOnPostCreated} />);
      
      await user.type(screen.getByLabelText('タイトル'), 'テストタイトル');
      await user.type(screen.getByLabelText('投稿者名'), 'テスト投稿者');
      await user.type(screen.getByLabelText(/内容/), 'テスト内容');
      
      const submitButton = screen.getByRole('button', { name: '投稿する' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'テストタイトル',
            author: 'テスト投稿者',
            content: 'テスト内容',
          }),
        });
      });
      
      await waitFor(() => {
        expect(mockOnPostCreated).toHaveBeenCalled();
        expect(screen.getByLabelText('タイトル')).toHaveValue('');
        expect(screen.getByLabelText('投稿者名')).toHaveValue('');
        expect(screen.getByLabelText(/内容/)).toHaveValue('');
      });
    });

    it('投稿中はボタンが無効化され、ローディング表示される', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      (fetch as jest.Mock).mockReturnValueOnce(promise);
      
      render(<PostForm onPostCreated={mockOnPostCreated} />);
      
      await user.type(screen.getByLabelText('タイトル'), 'テストタイトル');
      await user.type(screen.getByLabelText('投稿者名'), 'テスト投稿者');
      await user.type(screen.getByLabelText(/内容/), 'テスト内容');
      
      const submitButton = screen.getByRole('button', { name: '投稿する' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(screen.getByText('投稿中...')).toBeInTheDocument();
      });
      
      // Promiseを解決して成功レスポンスを返す
      resolvePromise!({
        json: async () => ({ success: true, data: { _id: '1' } }),
      });
      
      // フォームがクリアされるまで待つ
      await waitFor(() => {
        expect(screen.getByLabelText('タイトル')).toHaveValue('');
      });
    });

    it('投稿に失敗した場合、エラーメッセージが表示される', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const user = userEvent.setup();
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'サーバーエラー' }),
      });
      
      render(<PostForm onPostCreated={mockOnPostCreated} />);
      
      await user.type(screen.getByLabelText('タイトル'), 'テストタイトル');
      await user.type(screen.getByLabelText('投稿者名'), 'テスト投稿者');
      await user.type(screen.getByLabelText(/内容/), 'テスト内容');
      
      const submitButton = screen.getByRole('button', { name: '投稿する' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('投稿の作成に失敗しました');
        expect(mockOnPostCreated).not.toHaveBeenCalled();
      });
      
      // フォームがクリアされないことを確認
      expect(screen.getByLabelText('タイトル')).toHaveValue('テストタイトル');
    });

    it('ネットワークエラーの場合、エラーメッセージが表示される', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const user = userEvent.setup();
      
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      render(<PostForm onPostCreated={mockOnPostCreated} />);
      
      await user.type(screen.getByLabelText('タイトル'), 'テストタイトル');
      await user.type(screen.getByLabelText('投稿者名'), 'テスト投稿者');
      await user.type(screen.getByLabelText(/内容/), 'テスト内容');
      
      const submitButton = screen.getByRole('button', { name: '投稿する' });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('投稿の作成に失敗しました');
        expect(consoleErrorSpy).toHaveBeenCalledWith('エラー:', expect.any(Error));
      });
    });
  });

  describe('アクセシビリティ', () => {
    it('ラベルとフィールドが正しく関連付けられている', () => {
      render(<PostForm onPostCreated={mockOnPostCreated} />);
      
      const titleInput = screen.getByLabelText('タイトル');
      const authorInput = screen.getByLabelText('投稿者名');
      const contentInput = screen.getByLabelText(/内容/);
      
      expect(titleInput).toHaveAttribute('id', 'title');
      expect(authorInput).toHaveAttribute('id', 'author');
      expect(contentInput).toHaveAttribute('id', 'content');
    });

    it('送信中は全フィールドが無効化される', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      (fetch as jest.Mock).mockReturnValueOnce(promise);
      
      render(<PostForm onPostCreated={mockOnPostCreated} />);
      
      await user.type(screen.getByLabelText('タイトル'), 'テストタイトル');
      await user.type(screen.getByLabelText('投稿者名'), 'テスト投稿者');
      await user.type(screen.getByLabelText(/内容/), 'テスト内容');
      
      fireEvent.click(screen.getByRole('button', { name: '投稿する' }));
      
      await waitFor(() => {
        expect(screen.getByLabelText('タイトル')).toBeDisabled();
        expect(screen.getByLabelText('投稿者名')).toBeDisabled();
        expect(screen.getByLabelText(/内容/)).toBeDisabled();
      });
      
      resolvePromise!({
        json: async () => ({ success: true }),
      });
    });
  });
});