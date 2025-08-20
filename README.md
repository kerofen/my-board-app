# シンプル掲示板アプリ

Next.js、TypeScript、MongoDB、Tailwind CSSを使用したモダンな掲示板アプリケーションです。

## 🚀 クイックスタート

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/my-board-app.git
cd my-board-app

# 依存関係のインストール
npm install

# 環境変数の設定
echo "MONGODB_URI=mongodb://localhost:27017/simple-board" > .env.local

# 開発サーバーの起動
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアプリケーションにアクセスできます。

## 📋 テストコマンド

### 主要なテストコマンド

| コマンド | 説明 | 使用場面 |
|---------|------|---------|
| **`npm test`** | 単体テストを実行 | 素早いテスト実行 |
| **`npm run test:watch`** | 監視モードで単体テストを実行 | 開発中の継続的テスト |
| **`npm run test:coverage`** | カバレッジ付きで単体テストを実行 | カバレッジ確認 |
| **`npm run test:e2e`** | E2Eテストを実行 | 統合テスト |
| **`npm run test:all`** | すべてのテストを実行 | リリース前の総合テスト |

### テスト実行例

```bash
# 開発中（ファイル変更を監視して自動テスト）
npm run test:watch

# カバレッジレポートの生成
npm run test:coverage
# → coverage/lcov-report/index.html でレポート確認

# E2Eテスト（初回はブラウザインストールが必要）
npx playwright install  # 初回のみ
npm run test:e2e

# リリース前の総合チェック
npm run test:all
```

### その他のテストコマンド

```bash
# PlaywrightのUIモード（視覚的にテスト確認）
npm run test:e2e:ui

# デバッグモード
npm run test:e2e:debug

# CI環境用
npm run test:ci
```

## 📊 現在のテストカバレッジ

| コンポーネント | カバレッジ | 状態 |
|---------------|-----------|------|
| **PostForm** | 93.33% | ✨ |
| **EditForm** | 87.5% | ✨ |
| **PostItem** | 84.61% | ✨ |
| **mongodb-mock** | 96.29% | ✨ |
| **全体** | 84.52% | ✅ |

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 15.4.5 (App Router)
- **言語**: TypeScript 5.x
- **データベース**: MongoDB (Mongoose 8.17.1)
- **スタイリング**: Tailwind CSS v4
- **テスト**: Jest + React Testing Library + Playwright
- **UI**: React 19.1.0

## 📁 プロジェクト構造

```
my-board-app/
├── app/                # Next.js App Router
├── components/         # Reactコンポーネント
├── lib/               # ユーティリティ
├── models/            # データモデル
├── __tests__/         # 単体テスト
├── e2e/               # E2Eテスト
└── docs/              # ドキュメント
```

## 🔧 その他のコマンド

```bash
# ビルド
npm run build

# プロダクション起動
npm run start

# Lintチェック
npm run lint

# データベース操作
npm run db:seed      # テストデータ投入
npm run db:cleanup   # クリーンアップ
npm run db:reset     # リセット
```

## 📖 詳細なドキュメント

- [テストガイド](./docs/TESTING.md) - テストの詳細な実行方法
- [プロジェクト仕様](./CLAUDE.md) - 技術仕様書

## 🤝 トラブルシューティング

### テストが失敗する場合
```bash
# キャッシュクリア
npm run clean
npm test
```

### E2Eテストが動作しない場合
```bash
# Playwrightブラウザの再インストール
npx playwright install
```

## 📄 ライセンス

MIT
