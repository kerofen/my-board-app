# データベース仕様書

## 1. データベース概要

### 1.1 基本情報
| 項目 | 内容 |
|------|------|
| データベース種別 | MongoDB (NoSQL) |
| バージョン | 4.4以上推奨 |
| ORM/ODM | Mongoose 8.17.1 |
| データベース名 | simple-board |
| 文字コード | UTF-8 |
| タイムゾーン | UTC（表示時にJSTに変換） |

### 1.2 接続情報
| 環境 | 接続文字列 |
|------|-----------|
| 開発環境 | mongodb://localhost:27017/simple-board |
| 本番環境 | 環境変数MONGODB_URIで設定 |

#### 環境変数設定方法
`.env.local`ファイルをプロジェクトルートに作成：
```bash
MONGODB_URI=mongodb://localhost:27017/simple-board
```

※ `.env.local`ファイルはGitに含めないよう`.gitignore`に追加済み

### 1.3 フォールバック機構
MongoDBに接続できない場合、自動的にインメモリのモックデータベースで動作する。

## 2. データモデル

### 2.1 コレクション一覧
| コレクション名 | 説明 | ドキュメント数（想定） |
|---------------|------|---------------------|
| posts | 投稿データ | 1,000～10,000件 |

### 2.2 Postコレクション

#### スキーマ定義
```javascript
{
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  author: {
    type: String,
    required: true,
    maxlength: 50
  },
  content: {
    type: String,
    required: true,
    maxlength: 140
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

#### フィールド仕様

| フィールド名 | 型 | 必須 | 制約 | 説明 |
|-------------|-----|------|------|------|
| _id | ObjectId | ○（自動） | ユニーク | MongoDBが自動生成する一意識別子 |
| title | String | ○ | 最大100文字 | 投稿のタイトル |
| author | String | ○ | 最大50文字 | 投稿者の名前 |
| content | String | ○ | 最大140文字 | 投稿の本文 |
| createdAt | Date | ○（自動） | - | 投稿作成日時（UTC） |
| updatedAt | Date | ○（自動） | - | 最終更新日時（UTC） |

#### サンプルドキュメント
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "初めての投稿",
  "author": "山田太郎",
  "content": "こんにちは！このアプリケーションの初めての投稿です。よろしくお願いします。",
  "createdAt": "2025-08-09T02:30:00.000Z",
  "updatedAt": "2025-08-09T02:30:00.000Z",
  "__v": 0
}
```

## 3. インデックス仕様

### 3.1 既存インデックス
| インデックス名 | フィールド | タイプ | 用途 |
|---------------|-----------|--------|------|
| _id_ | _id | 昇順 | プライマリキー（自動作成） |
| createdAt_-1 | createdAt | 降順 | 投稿一覧の並び替え用（推奨） |

### 3.2 推奨インデックス
```javascript
// 投稿一覧取得の高速化
db.posts.createIndex({ createdAt: -1 })

// 将来的な検索機能用（オプション）
db.posts.createIndex({ 
  title: "text", 
  content: "text" 
}, {
  default_language: "japanese"
})
```

## 4. バリデーション仕様

### 4.1 Mongooseバリデーション
| フィールド | バリデーション | エラーメッセージ |
|-----------|---------------|-----------------|
| title | required | タイトルは必須です |
| title | maxlength(100) | タイトルは100文字以内で入力してください |
| author | required | 投稿者名は必須です |
| author | maxlength(50) | 投稿者名は50文字以内で入力してください |
| content | required | 内容は必須です |
| content | maxlength(140) | 内容は140文字以内で入力してください |

### 4.2 カスタムバリデーション
現在は実装なし。将来的に以下を検討：
- 不適切な言葉のフィルタリング
- スパム投稿の検出
- 連続投稿の制限

## 5. トランザクション仕様

### 5.1 現在の実装
- 単一ドキュメント操作のみのため、トランザクション未使用
- MongoDBの単一ドキュメント操作はACID特性を保証

### 5.2 将来の実装検討
複数コレクションにまたがる操作が必要になった場合：
```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // トランザクション処理
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

## 6. モックデータベース仕様

### 6.1 概要
MongoDBが利用不可の場合に使用されるインメモリデータベース。

### 6.2 実装詳細
```typescript
class MockDatabase {
  private posts: MockPost[] = [];
  private idCounter: number = 1;
}
```

### 6.3 データ構造
| フィールド | 型 | 説明 |
|-----------|-----|------|
| _id | string | "mock_" + 連番 |
| title | string | 投稿タイトル |
| author | string | 投稿者名 |
| content | string | 投稿内容 |
| createdAt | Date | 作成日時 |
| updatedAt | Date | 更新日時 |

### 6.4 制限事項
- データはメモリ上に保存（永続化なし）
- サーバー再起動でデータ消失
- 複雑なクエリ未対応
- トランザクション未対応

### 6.5 初期データ
```javascript
{
  _id: "mock_1",
  title: "ようこそ！",
  author: "システム",
  content: "これはサンプル投稿です。MongoDBに接続できない場合、データは一時的に保存されます。",
  createdAt: new Date(),
  updatedAt: new Date()
}
```

## 7. データベース接続管理

### 7.1 接続プール設定
```javascript
{
  bufferCommands: false,  // バッファリング無効化
  maxPoolSize: 10,        // 最大接続数
  minPoolSize: 2,         // 最小接続数
  socketTimeoutMS: 45000, // ソケットタイムアウト
  serverSelectionTimeoutMS: 5000 // サーバー選択タイムアウト
}
```

### 7.2 接続管理
- グローバル接続キャッシュを使用
- 接続の再利用により、パフォーマンス向上
- エラー時の自動再接続

### 7.3 接続状態の監視
```javascript
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});
```

## 8. バックアップとリストア

### 8.1 バックアップ戦略（推奨）
| 種類 | 頻度 | 保持期間 |
|------|------|----------|
| フルバックアップ | 日次 | 7日間 |
| 増分バックアップ | 1時間ごと | 24時間 |
| スナップショット | 週次 | 1ヶ月 |

### 8.2 バックアップコマンド
```bash
# エクスポート
mongodump --uri="mongodb://localhost:27017/simple-board" --out=./backup

# インポート
mongorestore --uri="mongodb://localhost:27017/simple-board" ./backup/simple-board
```

### 8.3 データエクスポート（JSON形式）
```bash
mongoexport --uri="mongodb://localhost:27017/simple-board" \
  --collection=posts \
  --out=posts.json \
  --jsonArray
```

## 9. パフォーマンス最適化

### 9.1 クエリ最適化
- `lean()`メソッドの使用（Mongooseドキュメントではなくプレーンオブジェクトを返す）
- 必要なフィールドのみ選択（projection）
- 適切なインデックスの作成

### 9.2 推奨設定
```javascript
// 例：投稿一覧取得の最適化
Post.find()
  .select('title author content createdAt')
  .sort({ createdAt: -1 })
  .limit(100)
  .lean()
```

### 9.3 パフォーマンス指標
| 操作 | 目標応答時間 | 最大許容時間 |
|------|-------------|-------------|
| 単一ドキュメント取得 | < 10ms | 50ms |
| 一覧取得（100件） | < 50ms | 200ms |
| ドキュメント作成 | < 20ms | 100ms |
| ドキュメント更新 | < 20ms | 100ms |
| ドキュメント削除 | < 10ms | 50ms |

## 10. セキュリティ

### 10.1 アクセス制御
- 本番環境では認証必須
- 最小権限の原則に従う
- 接続文字列に認証情報を含める

### 10.2 推奨設定
```javascript
// 本番環境の接続文字列例
mongodb://username:password@host:port/database?authSource=admin
```

### 10.3 セキュリティベストプラクティス
- 環境変数での接続情報管理
- ネットワーク層でのアクセス制限
- 定期的なセキュリティアップデート
- 監査ログの有効化

## 11. 監視とログ

### 11.1 監視項目
| 項目 | 閾値 | アラート条件 |
|------|------|-------------|
| 接続数 | 最大10 | 8以上で警告 |
| レスポンスタイム | 200ms | 500ms超過で警告 |
| ディスク使用率 | 80% | 80%超過で警告 |
| メモリ使用率 | 75% | 75%超過で警告 |

### 11.2 ログ設定
```javascript
mongoose.set('debug', process.env.NODE_ENV === 'development');
```

### 11.3 エラーログ
- 接続エラー
- バリデーションエラー
- タイムアウトエラー
- 重複キーエラー

## 12. データ移行

### 12.1 スキーマ変更時の考慮事項
- 後方互換性の維持
- 段階的な移行戦略
- ロールバック計画

### 12.2 移行スクリプト例
```javascript
// 例：content フィールドの文字数制限を変更
async function migration() {
  const posts = await Post.find({});
  for (const post of posts) {
    if (post.content.length > 140) {
      post.content = post.content.substring(0, 140);
      await post.save();
    }
  }
}
```

## 13. 災害復旧計画

### 13.1 RPO/RTO目標
| 指標 | 目標値 | 説明 |
|------|--------|------|
| RPO | 1時間 | 許容可能なデータ損失時間 |
| RTO | 4時間 | 許容可能なサービス停止時間 |

### 13.2 復旧手順
1. バックアップからのリストア
2. 接続設定の確認
3. データ整合性チェック
4. サービス再開

## 14. 注意事項

### 14.1 既知の制限
- モックデータベースとMongoDBでIDの型が異なる
- 大量データ（10,000件以上）でのページネーション未実装
- 全文検索は日本語対応が不完全

### 14.2 推奨事項
- 定期的なデータベースの統計情報更新
- インデックスの定期的な再構築
- 不要なドキュメントの定期削除

### 14.3 将来の改善点
- レプリケーションの実装
- シャーディングの検討
- キャッシュ層の追加（Redis等）