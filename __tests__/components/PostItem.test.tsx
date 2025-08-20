import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PostItem from '@/components/PostItem'
import { Post } from '@/app/page'

// fetchのモック
global.fetch = jest.fn()

// confirmのモック
global.confirm = jest.fn()

describe('PostItem', () => {
  const mockPost: Post = {
    _id: '1',
    title: 'テストタイトル',
    author: 'テスト投稿者',
    content: 'テスト内容',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  }

  const mockOnDeleted = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('投稿が正しく表示される', () => {
    render(<PostItem post={mockPost} onDeleted={mockOnDeleted} />)
    
    expect(screen.getByText('テストタイトル')).toBeInTheDocument()
    expect(screen.getByText('投稿者: テスト投稿者')).toBeInTheDocument()
    expect(screen.getByText('テスト内容')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument()
  })

  it('長い内容は省略表示される', () => {
    const longPost = {
      ...mockPost,
      content: 'あ'.repeat(201),
    }
    
    render(<PostItem post={longPost} onDeleted={mockOnDeleted} />)
    
    expect(screen.getByText('あ'.repeat(200) + '...')).toBeInTheDocument()
    expect(screen.getByText('続きを読む')).toBeInTheDocument()
  })

  it('続きを読むクリックで全文表示される', () => {
    const longPost = {
      ...mockPost,
      content: 'あ'.repeat(201),
    }
    
    render(<PostItem post={longPost} onDeleted={mockOnDeleted} />)
    
    const expandButton = screen.getByText('続きを読む')
    fireEvent.click(expandButton)
    
    expect(screen.getByText('あ'.repeat(201))).toBeInTheDocument()
    expect(screen.getByText('折りたたむ')).toBeInTheDocument()
  })

  it('編集ボタンクリックで編集フォームが表示される', () => {
    render(<PostItem post={mockPost} onDeleted={mockOnDeleted} />)
    
    const editButton = screen.getByRole('button', { name: '編集' })
    fireEvent.click(editButton)
    
    expect(screen.getByText('投稿を編集')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument()
  })

  it('削除確認でキャンセルすると削除されない', () => {
    (confirm as jest.Mock).mockReturnValue(false)
    
    render(<PostItem post={mockPost} onDeleted={mockOnDeleted} />)
    
    const deleteButton = screen.getByRole('button', { name: '削除' })
    fireEvent.click(deleteButton)
    
    expect(confirm).toHaveBeenCalledWith('本当に削除しますか？')
    expect(fetch).not.toHaveBeenCalled()
    expect(mockOnDeleted).not.toHaveBeenCalled()
  })

  it('削除確認でOKすると削除される', async () => {
    (confirm as jest.Mock).mockReturnValue(true)
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true }),
    })
    
    render(<PostItem post={mockPost} onDeleted={mockOnDeleted} />)
    
    const deleteButton = screen.getByRole('button', { name: '削除' })
    fireEvent.click(deleteButton)
    
    expect(confirm).toHaveBeenCalledWith('本当に削除しますか？')
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/posts/1', {
        method: 'DELETE',
      })
    })
    
    await waitFor(() => {
      expect(mockOnDeleted).toHaveBeenCalled()
    })
  })

  it('削除エラー時にアラートが表示される', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation()
    ;(confirm as jest.Mock).mockReturnValue(true)
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: false }),
    })
    
    render(<PostItem post={mockPost} onDeleted={mockOnDeleted} />)
    
    const deleteButton = screen.getByRole('button', { name: '削除' })
    fireEvent.click(deleteButton)
    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('削除に失敗しました')
    })
    
    expect(mockOnDeleted).not.toHaveBeenCalled()
    
    alertSpy.mockRestore()
  })

  it('日付が表示される', () => {
    render(<PostItem post={mockPost} onDeleted={mockOnDeleted} />)
    
    // 日付フォーマットのテスト（実際の表示形式に依存）
    const dateElement = screen.getByText(/2025\/1\/1/)
    expect(dateElement).toBeInTheDocument()
  })
})