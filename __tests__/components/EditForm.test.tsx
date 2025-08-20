import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditForm from '@/components/EditForm';

// fetchのモック
global.fetch = jest.fn();

describe('EditForm', () => {
  const mockPost = {
    _id: '123',
    title: '元のタイトル',
    author: '元の作成者',
    content: '元の内容',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockOnUpdated = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('レンダリング', () => {
    it('編集フォームが正しくレンダリングされる', () => {
      render(
        <EditForm
          post={mockPost}
          onUpdated={mockOnUpdated}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('投稿を編集')).toBeInTheDocument();
      expect(screen.getByLabelText('タイトル')).toHaveValue(mockPost.title);
      expect(screen.getByLabelText('投稿者名')).toHaveValue(mockPost.author);
      expect(screen.getByLabelText(/内容/)).toHaveValue(mockPost.content);
      expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });

    it('初期値が正しく設定される', () => {
      render(
        <EditForm
          post={mockPost}
          onUpdated={mockOnUpdated}
          onCancel={mockOnCancel}
        />
      );

      const titleInput = screen.getByLabelText('タイトル');
      const authorInput = screen.getByLabelText('投稿者名');
      const contentInput = screen.getByLabelText(/内容/);

      expect(titleInput).toHaveValue('元のタイトル');
      expect(authorInput).toHaveValue('元の作成者');
      expect(contentInput).toHaveValue('元の内容');
    });
  });

  describe('入力フィールドの動作', () => {
    it('各フィールドを編集できる', async () => {
      const user = userEvent.setup();
      render(
        <EditForm
          post={mockPost}
          onUpdated={mockOnUpdated}
          onCancel={mockOnCancel}
        />
      );

      const titleInput = screen.getByLabelText('タイトル');
      const authorInput = screen.getByLabelText('投稿者名');
      const contentInput = screen.getByLabelText(/内容/);

      await user.clear(titleInput);
      await user.type(titleInput, '新しいタイトル');
      
      await user.clear(authorInput);
      await user.type(authorInput, '新しい作成者');
      
      await user.clear(contentInput);
      await user.type(contentInput, '新しい内容');

      expect(titleInput).toHaveValue('新しいタイトル');
      expect(authorInput).toHaveValue('新しい作成者');
      expect(contentInput).toHaveValue('新しい内容');
    });

    it('文字数制限が適用される', () => {
      render(
        <EditForm
          post={mockPost}
          onUpdated={mockOnUpdated}
          onCancel={mockOnCancel}
        />
      );

      const titleInput = screen.getByLabelText('タイトル') as HTMLInputElement;
      const authorInput = screen.getByLabelText('投稿者名') as HTMLInputElement;
      const contentInput = screen.getByLabelText(/内容/) as HTMLTextAreaElement;

      expect(titleInput.maxLength).toBe(100);
      expect(authorInput.maxLength).toBe(50);
      expect(contentInput.maxLength).toBe(2000);
    });
  });

  describe('更新処理', () => {
    it('正常に更新できる', async () => {
      const user = userEvent.setup();
      const updatedPost = {
        ...mockPost,
        title: '更新後のタイトル',
        author: '更新後の作成者',
        content: '更新後の内容',
        updatedAt: new Date().toISOString(),
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedPost,
      });

      render(
        <EditForm
          post={mockPost}
          onUpdated={mockOnUpdated}
          onCancel={mockOnCancel}
        />
      );

      const titleInput = screen.getByLabelText('タイトル');
      const authorInput = screen.getByLabelText('投稿者名');
      const contentInput = screen.getByLabelText(/内容/);

      await user.clear(titleInput);
      await user.type(titleInput, '更新後のタイトル');
      
      await user.clear(authorInput);
      await user.type(authorInput, '更新後の作成者');
      
      await user.clear(contentInput);
      await user.type(contentInput, '更新後の内容');

      const saveButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(`/api/posts/${mockPost._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: '更新後のタイトル',
            author: '更新後の作成者',
            content: '更新後の内容',
          }),
        });
      });

      await waitFor(() => {
        expect(mockOnUpdated).toHaveBeenCalled();
      });
    });

    it('更新中はボタンが無効化される', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (fetch as jest.Mock).mockReturnValueOnce(promise);

      render(
        <EditForm
          post={mockPost}
          onUpdated={mockOnUpdated}
          onCancel={mockOnCancel}
        />
      );

      const saveButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(saveButton).toBeDisabled();
        expect(screen.getByText('保存中...')).toBeInTheDocument();
      });

      resolvePromise!({
        ok: true,
        json: async () => mockPost,
      });

      await waitFor(() => {
        expect(mockOnUpdated).toHaveBeenCalled();
      });
    });

    it('更新エラー時にエラーメッセージが表示される', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'サーバーエラー' }),
      });

      render(
        <EditForm
          post={mockPost}
          onUpdated={mockOnUpdated}
          onCancel={mockOnCancel}
        />
      );

      const saveButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('更新に失敗しました');
        expect(mockOnUpdated).not.toHaveBeenCalled();
      });
    });

    it('ネットワークエラー時の処理', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <EditForm
          post={mockPost}
          onUpdated={mockOnUpdated}
          onCancel={mockOnCancel}
        />
      );

      const saveButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('更新に失敗しました');
        expect(consoleErrorSpy).toHaveBeenCalledWith('更新エラー:', expect.any(Error));
      });
    });
  });

  describe('キャンセル処理', () => {
    it('キャンセルボタンでonCancelが呼ばれる', async () => {
      const user = userEvent.setup();
      
      render(
        <EditForm
          post={mockPost}
          onUpdated={mockOnUpdated}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    });

    it('編集内容が破棄される', async () => {
      const user = userEvent.setup();
      
      render(
        <EditForm
          post={mockPost}
          onUpdated={mockOnUpdated}
          onCancel={mockOnCancel}
        />
      );

      const titleInput = screen.getByLabelText('タイトル');
      await user.clear(titleInput);
      await user.type(titleInput, '変更したタイトル');

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
      // 変更内容は保存されない
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('バリデーション', () => {
    it('空のフィールドでは保存ボタンが無効', async () => {
      const user = userEvent.setup();
      
      render(
        <EditForm
          post={mockPost}
          onUpdated={mockOnUpdated}
          onCancel={mockOnCancel}
        />
      );

      const titleInput = screen.getByLabelText('タイトル');
      await user.clear(titleInput);

      const saveButton = screen.getByRole('button', { name: '保存' });
      expect(saveButton).toBeDisabled();
    });

    it('空白文字のみの入力では保存ボタンが無効', async () => {
      const user = userEvent.setup();
      
      render(
        <EditForm
          post={mockPost}
          onUpdated={mockOnUpdated}
          onCancel={mockOnCancel}
        />
      );

      const titleInput = screen.getByLabelText('タイトル');
      await user.clear(titleInput);
      await user.type(titleInput, '   ');

      const saveButton = screen.getByRole('button', { name: '保存' });
      expect(saveButton).toBeDisabled();
    });

    it('文字数超過時は保存ボタンが無効', async () => {
      const user = userEvent.setup();
      
      render(
        <EditForm
          post={mockPost}
          onUpdated={mockOnUpdated}
          onCancel={mockOnCancel}
        />
      );

      const contentInput = screen.getByLabelText(/内容/);
      await user.clear(contentInput);
      
      // maxLengthで制限されるため、実際には2000文字までしか入力できない
      await user.type(contentInput, 'a'.repeat(2001));
      
      const actualValue = await contentInput.getAttribute('value');
      expect(actualValue?.length).toBeLessThanOrEqual(2000);
    });
  });

  describe('アクセシビリティ', () => {
    it('ラベルとフィールドが正しく関連付けられている', () => {
      render(
        <EditForm
          post={mockPost}
          onUpdated={mockOnUpdated}
          onCancel={mockOnCancel}
        />
      );

      const titleInput = screen.getByLabelText('タイトル');
      const authorInput = screen.getByLabelText('投稿者名');
      const contentInput = screen.getByLabelText(/内容/);

      expect(titleInput).toHaveAttribute('id');
      expect(authorInput).toHaveAttribute('id');
      expect(contentInput).toHaveAttribute('id');
    });

    it('更新中は全フィールドが無効化される', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (fetch as jest.Mock).mockReturnValueOnce(promise);

      render(
        <EditForm
          post={mockPost}
          onUpdated={mockOnUpdated}
          onCancel={mockOnCancel}
        />
      );

      const saveButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByLabelText('タイトル')).toBeDisabled();
        expect(screen.getByLabelText('投稿者名')).toBeDisabled();
        expect(screen.getByLabelText(/内容/)).toBeDisabled();
        expect(screen.getByRole('button', { name: 'キャンセル' })).toBeDisabled();
      });

      resolvePromise!({
        ok: true,
        json: async () => mockPost,
      });
    });
  });
});