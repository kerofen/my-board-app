# E2Eテストデータ管理ガイド

## 概要
E2Eテストにおけるデータの準備、管理、クリーンアップの仕組みを提供します。

## ディレクトリ構造
```
my-board-app/
├── scripts/              # データベース操作スクリプト
│   ├── seed.js          # シードデータ作成
│   └── cleanup.js       # データクリーンアップ
├── e2e/
│   ├── helpers/         # テストヘルパー
│   │   └── database.ts  # データベース操作関数
│   ├── global-setup.ts  # テスト前のグローバルセットアップ
│   ├── global-teardown.ts # テスト後のグローバルクリーンアップ
│   └── crud-with-data.spec.ts # データ準備付きCRUDテスト
```

## 主要機能

### 1. シードデータ作成（scripts/seed.js）
テスト用の初期データを作成します。

**実行方法**:
```bash
npm run db:seed
```

**作成されるデータ**:
- 編集テスト用データ
- 削除テスト用データ
- 表示テスト用データ
- 長文データ（140文字）
- 特殊文字を含むデータ
- 古い日付のデータ
- 最新のデータ

### 2. データクリーンアップ（scripts/cleanup.js）
データベースから不要なデータを削除します。

**実行方法**:
```bash
# すべてのデータを削除
npm run db:cleanup

# 最新5件を残して削除
node scripts/cleanup.js --keep 5

# パターンにマッチするデータのみ削除
node scripts/cleanup.js --pattern "テスト"
```

### 3. データベースリセット
クリーンアップ後、シードデータを再作成します。

**実行方法**:
```bash
npm run db:reset
```

## E2Eテストヘルパー関数

### database.ts の主要関数

#### データ作成
```typescript
// 単一の投稿を作成
const postId = await createTestPost(page, {
  title: 'テストタイトル',
  author: 'テストユーザー',
  content: 'テスト内容'
})

// テストデータセットをセットアップ
const postIds = await setupTestData(page)
```

#### データ削除
```typescript
// 特定の投稿を削除
await deleteTestPost(page, postId)

// パターンにマッチする投稿を削除
const deletedCount = await deleteTestPosts(page, 'テスト')

// UIから投稿を削除
await deletePostViaUI(page, 'タイトル')

// すべての投稿を削除
await cleanupDatabase(page)
```

#### データ確認
```typescript
// すべての投稿を取得
const posts = await getAllPosts(page)

// 投稿の存在確認
const exists = await postExists(page, 'タイトル')

// 投稿数を取得
const count = await getPostCount(page)
```

## グローバルセットアップ/ティアダウン

### global-setup.ts
テスト実行前に自動的に実行され、以下を行います：
- アプリケーションの起動確認
- 既存テストデータのクリーンアップ
- 環境の初期化

### global-teardown.ts
すべてのテスト完了後に自動的に実行され、以下を行います：
- テストデータの削除
- 最終的なデータ数の確認
- リソースのクリーンアップ

## テスト実行コマンド

### 基本的なE2Eテスト
```bash
# すべてのE2Eテストを実行
npm run test:e2e

# データ準備付きCRUDテストのみ実行
npm run test:e2e:data

# スモークテストのみ実行
npm run test:e2e:smoke
```

### デバッグモード
```bash
# UIモードでテスト実行（ブラウザで確認）
npm run test:e2e:ui

# デバッグモードで実行
npm run test:e2e:debug
```

## テストデータの命名規則

テストデータには以下のプレフィックスを使用して、通常のデータと区別します：

- `E2Eテスト:` - E2Eテストで作成されたデータ
- `テストデータ` - シードスクリプトで作成されたデータ
- `スモークテスト` - スモークテストで作成されたデータ
- `テストユーザー` - テスト用のユーザー名

## ベストプラクティス

### 1. データの独立性
各テストは独立して実行できるようにデータを準備します。

```typescript
test.beforeEach(async ({ page }) => {
  // テスト固有のデータを作成
  const testData = await createTestPost(page, {
    title: `テスト_${Date.now()}`,
    author: 'テストユーザー',
    content: 'テスト内容'
  })
})

test.afterEach(async ({ page }) => {
  // 作成したデータをクリーンアップ
  await deleteTestPosts(page, `テスト_`)
})
```

### 2. 並列実行への対応
ユニークな識別子を使用してデータの衝突を避けます。

```typescript
const uniqueId = Date.now()
const testPost = {
  title: `並列テスト_${uniqueId}`,
  author: `ユーザー_${uniqueId}`,
  content: '並列実行対応'
}
```

### 3. エラーハンドリング
データ操作の失敗を適切に処理します。

```typescript
try {
  const postId = await createTestPost(page, testData)
  // テスト実行
} catch (error) {
  console.error('データ作成失敗:', error)
  // フォールバック処理
} finally {
  // クリーンアップは必ず実行
  await deleteTestPosts(page, pattern)
}
```

## トラブルシューティング

### 問題: テストデータが残っている
**解決方法**:
```bash
# 手動でクリーンアップ
npm run db:cleanup
# または特定パターンのみ削除
node scripts/cleanup.js --pattern "E2Eテスト"
```

### 問題: MongoDBに接続できない
**解決方法**:
1. MongoDBが起動していることを確認
2. `.env.local`ファイルの`MONGODB_URI`を確認
3. ファイアウォール設定を確認

### 問題: テストがタイムアウトする
**解決方法**:
```typescript
// タイムアウトを延長
test('長時間のテスト', async ({ page }) => {
  test.setTimeout(60000) // 60秒に延長
  // テスト実行
})
```

### 問題: 並列実行でデータが競合する
**解決方法**:
```typescript
// playwright.config.tsで並列実行を無効化
export default defineConfig({
  fullyParallel: false,
  workers: 1,
})
```

## CI/CD環境での使用

### GitHub Actions設定例
```yaml
- name: Setup test data
  run: npm run db:seed
  env:
    MONGODB_URI: ${{ secrets.TEST_MONGODB_URI }}

- name: Run E2E tests
  run: npm run test:e2e
  
- name: Cleanup test data
  if: always()
  run: npm run db:cleanup
```

## セキュリティ考慮事項

1. **本番環境での実行を防ぐ**
   - 環境変数で本番DBを識別
   - テストプレフィックスのチェック

2. **認証情報の保護**
   - `.env.local`はGitに含めない
   - CI/CDではシークレットを使用

3. **データの分離**
   - テスト用データベースを別途用意
   - 本番データのコピーは使用しない

## まとめ

このデータ管理システムにより：
- ✅ テストデータの一貫した準備と管理
- ✅ 自動的なクリーンアップ
- ✅ 並列実行への対応
- ✅ CI/CD環境での利用
- ✅ デバッグの容易さ

が実現されます。

---

作成日: 2025年8月10日
バージョン: 1.0.0