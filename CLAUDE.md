# my-board-app プロジェクト仕様書

## プロジェクト概要
シンプルな掲示板アプリケーション。日本語UIで、投稿の作成・閲覧・編集・削除（CRUD）機能を提供する。

## 技術スタック
- **フレームワーク**: Next.js 15.4.5 (App Router使用)
- **言語**: TypeScript
- **データベース**: MongoDB (Mongoose 8.17.1)
- **スタイリング**: Tailwind CSS v4
- **UI**: React 19.1.0

## プロジェクト構造
```
my-board-app/
├── app/                     # Next.js App Router
│   ├── api/                 # APIルート
│   │   └── posts/          # 投稿関連API
│   │       ├── route.ts    # GET（一覧）、POST（作成）
│   │       └── [id]/       
│   │           └── route.ts # GET、PUT、DELETE（個別操作）
│   ├── globals.css         # グローバルスタイル
│   ├── layout.tsx          # ルートレイアウト
│   └── page.tsx            # メインページ（掲示板）
├── components/             # Reactコンポーネント
│   ├── EditForm.tsx       # 投稿編集フォーム
│   ├── PostForm.tsx       # 新規投稿フォーム
│   ├── PostItem.tsx       # 個別投稿表示
│   └── PostList.tsx       # 投稿一覧
├── lib/                    # ユーティリティ
│   ├── mongodb.ts         # MongoDB接続管理
│   └── mongodb-mock.ts    # オフラインモック
├── models/                # データモデル
│   └── Post.ts           # 投稿スキーマ定義
└── logs/                  # 開発ログ

```

## 主要機能

### 1. 投稿管理（CRUD）
- **作成**: タイトル、投稿者名、内容を入力して投稿
- **読み取り**: 投稿一覧表示（最新順）
- **更新**: 既存投稿の編集
- **削除**: 投稿の削除

### 2. データモデル (Post)
```typescript
{
  title: string;      // 最大100文字
  author: string;     // 最大50文字
  content: string;    // 最大2000文字
  createdAt: Date;    // 自動生成
  updatedAt: Date;    // 自動更新
}
```

### 3. オフラインモード
MongoDBに接続できない場合、自動的にメモリ内モックデータベースに切り替わる。
ユーザーには黄色い警告バナーで通知される。

## API エンドポイント

### `GET /api/posts`
投稿一覧を取得（作成日時の降順）

### `POST /api/posts`
新規投稿を作成

### `GET /api/posts/[id]`
特定の投稿を取得

### `PUT /api/posts/[id]`
投稿を更新

### `DELETE /api/posts/[id]`
投稿を削除

## 環境設定
`.env.local` ファイルに以下を設定：
```
MONGODB_URI=mongodb://localhost:27017/simple-board
```

## 開発コマンド
```bash
npm run dev    # 開発サーバー起動（Turbopack使用）
npm run build  # プロダクションビルド
npm run start  # プロダクションサーバー起動
npm run lint   # ESLintチェック
```

## UI/UX 特徴
- 日本語インターフェース
- レスポンシブデザイン（モバイル対応）
- リアルタイム更新（投稿後に自動リロード）
- エラーハンドリングとユーザーフィードバック
- オフラインモード対応

## 注意事項
1. MongoDB未接続時は自動的にモックデータベースを使用
2. モックデータはサーバー再起動で消失
3. 本番環境では適切なMongoDB接続文字列の設定が必要

## 今後の改善候補
- ページネーション機能
- 検索機能
- ユーザー認証
- リアルタイム更新（WebSocket）
- 画像アップロード対応