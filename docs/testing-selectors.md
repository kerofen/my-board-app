# E2Eテスト セレクタ戦略ガイド

## 概要
このドキュメントは、E2Eテストにおけるセレクタの優先順位とdata-testid属性の使用方法を定義します。

## セレクタ優先順位

### 1. 優先度: 高 (推奨)
**data-testid属性**を最優先で使用します。

```typescript
// 良い例
await page.locator('[data-testid="post-form"]')
await page.locator('[data-testid="submit-button"]')
```

**利点:**
- UIの変更に強い
- 明確なテスト意図
- 保守性が高い
- 言語に依存しない

### 2. 優先度: 中
セマンティックなHTML要素とARIA属性を使用します。

```typescript
// 許容される例
await page.getByRole('button', { name: '投稿' })
await page.getByRole('heading', { level: 1 })
await page.getByLabel('タイトル')
```

**使用場面:**
- アクセシビリティを考慮したい場合
- フォーム要素の操作
- 基本的なHTML要素

### 3. 優先度: 低 (避ける)
テキストやCSSセレクタの使用は最小限に留めます。

```typescript
// 避けるべき例
await page.locator('.bg-white.rounded-lg')  // クラス名に依存
await page.locator('text=投稿者')           // テキストに依存
await page.locator('#edit-title')           // IDに依存（data-testid以外）
```

**問題点:**
- スタイル変更で壊れやすい
- 多言語対応で問題
- 実装詳細に依存

## data-testid命名規則

### 基本フォーマット
`[コンポーネント]-[要素]-[修飾子]`

### 命名例

#### フォーム関連
```html
data-testid="post-form"                 <!-- 投稿フォーム全体 -->
data-testid="post-form-title"           <!-- タイトル入力欄 -->
data-testid="post-form-author"          <!-- 投稿者入力欄 -->
data-testid="post-form-content"         <!-- 内容入力欄 -->
data-testid="post-form-submit"          <!-- 送信ボタン -->
data-testid="post-form-cancel"          <!-- キャンセルボタン -->
data-testid="post-form-error"           <!-- エラーメッセージ -->
data-testid="post-form-loading"         <!-- ローディング状態 -->
```

#### リスト・アイテム関連
```html
data-testid="post-list"                 <!-- 投稿リスト全体 -->
data-testid="post-item"                 <!-- 個別投稿 -->
data-testid="post-item-title"           <!-- 投稿タイトル -->
data-testid="post-item-author"          <!-- 投稿者名 -->
data-testid="post-item-content"         <!-- 投稿内容 -->
data-testid="post-item-date"            <!-- 投稿日時 -->
data-testid="post-item-edit"            <!-- 編集ボタン -->
data-testid="post-item-delete"          <!-- 削除ボタン -->
```

#### 編集フォーム関連
```html
data-testid="edit-form"                 <!-- 編集フォーム全体 -->
data-testid="edit-form-title"           <!-- タイトル編集欄 -->
data-testid="edit-form-author"          <!-- 投稿者編集欄 -->
data-testid="edit-form-content"         <!-- 内容編集欄 -->
data-testid="edit-form-save"            <!-- 保存ボタン -->
data-testid="edit-form-cancel"          <!-- キャンセルボタン -->
```

#### 状態・メッセージ関連
```html
data-testid="loading-spinner"           <!-- ローディングスピナー -->
data-testid="error-message"             <!-- エラーメッセージ -->
data-testid="success-message"           <!-- 成功メッセージ -->
data-testid="empty-state"               <!-- 空状態表示 -->
data-testid="offline-banner"            <!-- オフラインバナー -->
```

## 実装ガイドライン

### 1. 必須要素への適用
以下の要素には必ずdata-testidを付与します：
- フォーム要素（input, textarea, select）
- ボタン（submit, cancel, delete, edit）
- 主要なコンテナ（form, list, item）
- 動的コンテンツ（エラー、成功メッセージ）

### 2. 動的要素への対応
リストアイテムなど繰り返し要素には、インデックスやIDを付加します：

```typescript
// 実装例
posts.map((post, index) => (
  <div 
    key={post._id}
    data-testid={`post-item-${index}`}
    data-post-id={post._id}
  >
    {/* コンテンツ */}
  </div>
))
```

### 3. 条件付き表示要素
条件によって表示される要素にも必ずdata-testidを付与します：

```typescript
{isLoading && (
  <div data-testid="loading-spinner">
    読み込み中...
  </div>
)}

{error && (
  <div data-testid="error-message">
    {error}
  </div>
)}
```

## E2Eテストでの使用例

### 基本的な使用方法
```typescript
// 要素の取得
const postForm = page.locator('[data-testid="post-form"]')
const submitButton = page.locator('[data-testid="post-form-submit"]')

// 要素の存在確認
await expect(postForm).toBeVisible()

// フォーム操作
await page.fill('[data-testid="post-form-title"]', 'テストタイトル')
await page.fill('[data-testid="post-form-author"]', 'テストユーザー')
await page.fill('[data-testid="post-form-content"]', 'テスト内容')
await submitButton.click()

// 結果の確認
await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
```

### 複数要素の操作
```typescript
// すべての投稿アイテムを取得
const postItems = page.locator('[data-testid^="post-item-"]')
const count = await postItems.count()

// 特定のアイテムを操作
const firstPost = page.locator('[data-testid="post-item-0"]')
await firstPost.locator('[data-testid="post-item-edit"]').click()
```

### カスタムヘルパー関数
```typescript
// ヘルパー関数の作成
async function fillPostForm(page: Page, data: PostData) {
  await page.fill('[data-testid="post-form-title"]', data.title)
  await page.fill('[data-testid="post-form-author"]', data.author)
  await page.fill('[data-testid="post-form-content"]', data.content)
  await page.click('[data-testid="post-form-submit"]')
}

// 使用例
await fillPostForm(page, {
  title: 'テスト投稿',
  author: 'テストユーザー',
  content: 'これはテストです'
})
```

## ベストプラクティス

### ✅ DO（推奨事項）
1. **一貫性のある命名**: プロジェクト全体で統一された命名規則を使用
2. **説明的な名前**: 要素の役割が明確にわかる名前を使用
3. **早期実装**: 開発初期段階からdata-testidを実装
4. **ドキュメント化**: 新しいdata-testidは必ずドキュメントに追加

### ❌ DON'T（避けるべき事項）
1. **実装詳細の露出**: 内部状態やロジックを反映した名前は避ける
2. **過度な階層**: 深すぎる階層構造は避ける
3. **動的生成**: ランダムや予測不可能な値は使用しない
4. **重複**: 同じdata-testidを複数要素に使用しない

## メンテナンス

### 定期レビュー
- 四半期ごとにdata-testidの使用状況をレビュー
- 不要になったdata-testidの削除
- 命名規則の遵守確認

### 変更管理
- data-testidの変更は必ずE2Eテストも同時に更新
- 重大な変更はチーム全体で共有
- 変更履歴の記録

## 移行ガイド

### 既存テストの移行手順
1. 新しいdata-testidを実装
2. テストを段階的に更新
3. 古いセレクタを削除
4. 回帰テストの実行

### 優先順位
1. 不安定なテストから優先的に移行
2. 頻繁に失敗するセレクタを特定
3. ビジネスクリティカルな機能を優先

---

作成日: 2025年8月16日
バージョン: 1.0.0