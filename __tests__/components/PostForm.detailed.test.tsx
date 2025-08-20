import { render, screen, fireEvent, waitFor } from '../../test-helpers/test-utils'
import userEvent from '@testing-library/user-event'
import PostForm from '@/components/PostForm'
import { boundaryTestData, specialCharacterData, whitespaceData } from '../../test-helpers/test-data'

// fetchのモック
global.fetch = jest.fn()

describe('PostForm コンポーネント詳細テスト', () => {
  const mockOnPostCreated = jest.fn()
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    jest.clearAllMocks()
    user = userEvent.setup()
    // fetchのデフォルトモック
    ;(fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ success: true, data: { _id: 'new-id' } }),
    })
  })

  describe('レンダリングと初期状態', () => {
    it('すべての必要な要素が表示される', () => {
      render(<PostForm onPostCreated={mockOnPostCreated} />)
      
      // フォーム要素の存在確認
      expect(screen.getByRole('heading', { name: '新規投稿' })).toBeInTheDocument()
      expect(screen.getByLabelText('タイトル')).toBeInTheDocument()
      expect(screen.getByLabelText('投稿者名')).toBeInTheDocument()
      expect(screen.getByLabelText(/内容/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '投稿する' })).toBeInTheDocument()
    })

    it('初期状態ですべてのフィールドが空', () => {
      render(<PostForm onPostCreated={mockOnPostCreated} />)
      
      expect(screen.getByLabelText('タイトル')).toHaveValue('')
      expect(screen.getByLabelText('投稿者名')).toHaveValue('')
      expect(screen.getByLabelText(/内容/)).toHaveValue('')
    })

    it('投稿ボタンは初期状態で有効', () => {
      render(<PostForm onPostCreated={mockOnPostCreated} />)
      
      const submitButton = screen.getByRole('button', { name: '投稿する' })
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('フォーム入力と検証', () => {
    it('正常な入力ができる', async () => {
      render(<PostForm onPostCreated={mockOnPostCreated} />)
      
      await user.type(screen.getByLabelText('タイトル'), 'テストタイトル')
      await user.type(screen.getByLabelText('投稿者名'), 'テストユーザー')
      await user.type(screen.getByLabelText(/内容/), 'テスト内容')
      
      expect(screen.getByLabelText('タイトル')).toHaveValue('テストタイトル')
      expect(screen.getByLabelText('投稿者名')).toHaveValue('テストユーザー')
      expect(screen.getByLabelText(/内容/)).toHaveValue('テスト内容')
    })

    it('maxLength属性が正しく設定されている', () => {
      render(<PostForm onPostCreated={mockOnPostCreated} />)
      
      expect(screen.getByLabelText('タイトル')).toHaveAttribute('maxLength', '100')
      expect(screen.getByLabelText('投稿者名')).toHaveAttribute('maxLength', '50')
      expect(screen.getByLabelText(/内容/)).toHaveAttribute('maxLength', '140')
    })

    it('空白のみの入力を拒否する', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation()
      render(<PostForm onPostCreated={mockOnPostCreated} />)
      
      await user.type(screen.getByLabelText('タイトル'), whitespaceData.spaces)
      await user.type(screen.getByLabelText('投稿者名'), whitespaceData.tabs)
      await user.type(screen.getByLabelText(/内容/), whitespaceData.mixed)
      
      fireEvent.click(screen.getByRole('button', { name: '投稿する' }))
      
      expect(alertSpy).toHaveBeenCalledWith('すべての項目を入力してください')
      expect(fetch).not.toHaveBeenCalled()
      
      alertSpy.mockRestore()
    })
  })

  describe('文字数カウンター機能', () => {
    it('入力に応じて文字数が更新される', async () => {
      render(<PostForm onPostCreated={mockOnPostCreated} />)
      const contentInput = screen.getByLabelText(/内容/)
      
      // 10文字入力
      await user.type(contentInput, '1234567890')
      expect(screen.getByText('(10/140)')).toBeInTheDocument()
      
      // クリアして50文字入力
      await user.clear(contentInput)
      await user.type(contentInput, 'あ'.repeat(50))
      expect(screen.getByText('(50/140)')).toBeInTheDocument()
    })

    it('140文字ちょうどの時は通常色で表示', async () => {
      render(<PostForm onPostCreated={mockOnPostCreated} />)
      
      await user.type(screen.getByLabelText(/内容/), boundaryTestData.content.max)
      
      const counter = screen.getByText('(140/140)')
      expect(counter).toBeInTheDocument()
      expect(counter).toHaveClass('text-gray-500')
    })

    it('141文字以上の時は赤色で表示', async () => {
      render(<PostForm onPostCreated={mockOnPostCreated} />)
      
      await user.type(screen.getByLabelText(/内容/), boundaryTestData.content.over)
      
      const counter = screen.getByText('(141/140)')
      expect(counter).toBeInTheDocument()
      expect(counter).toHaveClass('text-red-500')
    })

    it('文字数0の時はカウンターが表示されない', () => {
      render(<PostForm onPostCreated={mockOnPostCreated} />)
      
      expect(screen.queryByText(/\/140/)).not.toBeInTheDocument()
    })
  })

  describe('境界値テスト', () => {
    it('最小文字数（1文字）で投稿できる', async () => {
      render(<PostForm onPostCreated={mockOnPostCreated} />)
      
      await user.type(screen.getByLabelText('タイトル'), boundaryTestData.title.min)
      await user.type(screen.getByLabelText('投稿者名'), boundaryTestData.author.min)
      await user.type(screen.getByLabelText(/内容/), boundaryTestData.content.min)
      
      fireEvent.click(screen.getByRole('button', { name: '投稿する' }))
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/posts', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            title: boundaryTestData.title.min,
            author: boundaryTestData.author.min,
            content: boundaryTestData.content.min,
          }),
        }))
      })
    })

    it('最大文字数で投稿できる', async () => {
      render(<PostForm onPostCreated={mockOnPostCreated} />)
      
      await user.type(screen.getByLabelText('タイトル'), boundaryTestData.title.max)
      await user.type(screen.getByLabelText('投稿者名'), boundaryTestData.author.max)
      await user.type(screen.getByLabelText(/内容/), boundaryTestData.content.max)
      
      fireEvent.click(screen.getByRole('button', { name: '投稿する' }))
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled()
        expect(mockOnPostCreated).toHaveBeenCalled()
      })
    })

    it('内容が140文字を超える場合は投稿できない', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation()
      render(<PostForm onPostCreated={mockOnPostCreated} />)
      
      await user.type(screen.getByLabelText('タイトル'), 'タイトル')
      await user.type(screen.getByLabelText('投稿者名'), '投稿者')
      await user.type(screen.getByLabelText(/内容/), boundaryTestData.content.over)
      
      fireEvent.click(screen.getByRole('button', { name: '投稿する' }))
      
      expect(alertSpy).toHaveBeenCalledWith('投稿文は140文字以内で入力してください')
      expect(fetch).not.toHaveBeenCalled()
      
      alertSpy.mockRestore()
    })
  })

  describe('特殊文字の処理', () => {
    it('特殊文字を含む投稿ができる', async () => {
      render(<PostForm onPostCreated={mockOnPostCreated} />)
      
      await user.type(screen.getByLabelText('タイトル'), specialCharacterData.title)
      await user.type(screen.getByLabelText('投稿者名'), specialCharacterData.author)
      await user.type(screen.getByLabelText(/内容/), specialCharacterData.content)
      
      fireEvent.click(screen.getByRole('button', { name: '投稿する' }))
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/posts', expect.objectContaining({
          body: JSON.stringify(specialCharacterData),
        }))
      })
    })
  })

  describe('非同期処理とローディング状態', () => {
    it('投稿中はローディング状態になる', async () => {
      let resolvePromise: (value: any) => void
      ;(fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => { resolvePromise = resolve })
      )
      
      render(<PostForm onPostCreated={mockOnPostCreated} />)
      
      await user.type(screen.getByLabelText('タイトル'), 'テスト')
      await user.type(screen.getByLabelText('投稿者名'), 'ユーザー')
      await user.type(screen.getByLabelText(/内容/), '内容')
      
      const submitButton = screen.getByRole('button', { name: '投稿する' })
      fireEvent.click(submitButton)
      
      // ローディング状態の確認
      expect(submitButton).toBeDisabled()
      expect(screen.getByText('投稿中...')).toBeInTheDocument()
      expect(screen.getByLabelText('タイトル')).toBeDisabled()
      expect(screen.getByLabelText('投稿者名')).toBeDisabled()
      expect(screen.getByLabelText(/内容/)).toBeDisabled()
      
      // 投稿完了
      resolvePromise!({ json: async () => ({ success: true, data: { _id: '1' } }) })
      
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
        expect(screen.getByText('投稿する')).toBeInTheDocument()
      })
    })

    it('投稿成功後にフォームがリセットされる', async () => {
      render(<PostForm onPostCreated={mockOnPostCreated} />)
      
      await user.type(screen.getByLabelText('タイトル'), 'テスト')
      await user.type(screen.getByLabelText('投稿者名'), 'ユーザー')
      await user.type(screen.getByLabelText(/内容/), '内容')
      
      fireEvent.click(screen.getByRole('button', { name: '投稿する' }))
      
      await waitFor(() => {
        expect(screen.getByLabelText('タイトル')).toHaveValue('')
        expect(screen.getByLabelText('投稿者名')).toHaveValue('')
        expect(screen.getByLabelText(/内容/)).toHaveValue('')
      })
    })

    it('投稿失敗時にエラーメッセージが表示される', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation()
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: false, error: 'サーバーエラー' }),
      })
      
      render(<PostForm onPostCreated={mockOnPostCreated} />)
      
      await user.type(screen.getByLabelText('タイトル'), 'テスト')
      await user.type(screen.getByLabelText('投稿者名'), 'ユーザー')
      await user.type(screen.getByLabelText(/内容/), '内容')
      
      fireEvent.click(screen.getByRole('button', { name: '投稿する' }))
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('投稿の作成に失敗しました')
      })
      
      // フォームはリセットされない
      expect(screen.getByLabelText('タイトル')).toHaveValue('テスト')
      
      alertSpy.mockRestore()
    })

    it('ネットワークエラー時に適切に処理される', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation()
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
      
      render(<PostForm onPostCreated={mockOnPostCreated} />)
      
      await user.type(screen.getByLabelText('タイトル'), 'テスト')
      await user.type(screen.getByLabelText('投稿者名'), 'ユーザー')
      await user.type(screen.getByLabelText(/内容/), '内容')
      
      fireEvent.click(screen.getByRole('button', { name: '投稿する' }))
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('投稿の作成に失敗しました')
        expect(consoleErrorSpy).toHaveBeenCalledWith('エラー:', expect.any(Error))
      })
      
      alertSpy.mockRestore()
      consoleErrorSpy.mockRestore()
    })
  })

  describe('コールバック関数', () => {
    it('投稿成功時にonPostCreatedが呼ばれる', async () => {
      render(<PostForm onPostCreated={mockOnPostCreated} />)
      
      await user.type(screen.getByLabelText('タイトル'), 'テスト')
      await user.type(screen.getByLabelText('投稿者名'), 'ユーザー')
      await user.type(screen.getByLabelText(/内容/), '内容')
      
      fireEvent.click(screen.getByRole('button', { name: '投稿する' }))
      
      await waitFor(() => {
        expect(mockOnPostCreated).toHaveBeenCalledTimes(1)
      })
    })

    it('投稿失敗時にonPostCreatedが呼ばれない', async () => {
      jest.spyOn(window, 'alert').mockImplementation()
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: false }),
      })
      
      render(<PostForm onPostCreated={mockOnPostCreated} />)
      
      await user.type(screen.getByLabelText('タイトル'), 'テスト')
      await user.type(screen.getByLabelText('投稿者名'), 'ユーザー')
      await user.type(screen.getByLabelText(/内容/), '内容')
      
      fireEvent.click(screen.getByRole('button', { name: '投稿する' }))
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled()
      })
      
      expect(mockOnPostCreated).not.toHaveBeenCalled()
    })
  })

  describe('アクセシビリティ', () => {
    it('フォーム要素に適切なラベルが付いている', () => {
      render(<PostForm onPostCreated={mockOnPostCreated} />)
      
      expect(screen.getByLabelText('タイトル')).toHaveAttribute('id', 'title')
      expect(screen.getByLabelText('投稿者名')).toHaveAttribute('id', 'author')
      expect(screen.getByLabelText(/内容/)).toHaveAttribute('id', 'content')
    })

    it('キーボード操作でフォームを送信できる', async () => {
      render(<PostForm onPostCreated={mockOnPostCreated} />)
      
      const titleInput = screen.getByLabelText('タイトル')
      await user.type(titleInput, 'テスト')
      await user.tab()
      
      const authorInput = screen.getByLabelText('投稿者名')
      await user.type(authorInput, 'ユーザー')
      await user.tab()
      
      const contentInput = screen.getByLabelText(/内容/)
      await user.type(contentInput, '内容')
      
      // Enterキーでフォーム送信
      await user.keyboard('{Enter}')
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalled()
      })
    })
  })
})