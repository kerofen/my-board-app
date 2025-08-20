# テストガイド

## 概要
このプロジェクトでは、単体テスト（Jest）とE2Eテスト（Playwright）を使用して、アプリケーションの品質を保証しています。

## テストコマンド

### 基本的なテストコマンド

| コマンド | 説明 | 使用場面 |
|---------|------|---------|
| `npm test` | 単体テストを実行 | 開発中の素早いテスト実行 |
| `npm run test:watch` | 監視モードで単体テストを実行 | 開発中の継続的なテスト |
| `npm run test:coverage` | カバレッジ付きで単体テストを実行 | カバレッジ確認時 |
| `npm run test:e2e` | E2Eテストを実行 | 統合テストの実行 |
| `npm run test:all` | すべてのテストを実行 | リリース前の総合テスト |

### その他のテストコマンド

| コマンド | 説明 |
|---------|------|
| `npm run test:e2e:ui` | PlaywrightのUIモードでE2Eテストを実行 |
| `npm run test:e2e:debug` | デバッグモードでE2Eテストを実行 |
| `npm run test:e2e:smoke` | スモークテストのみ実行 |
| `npm run test:ci` | CI環境用の設定でテストを実行 |

## テストの実行方法

### 1. 単体テスト（npm test）

最も基本的なテストコマンドです。すべての単体テストを実行します。

```bash
npm test
```

**特徴:**
- 高速実行
- APIとコンポーネントのテスト
- モックデータを使用

### 2. 監視モード（npm run test:watch）

ファイルの変更を監視し、自動的にテストを再実行します。

```bash
npm run test:watch
```

**使用場面:**
- TDD（テスト駆動開発）
- コード修正時の即座のフィードバック
- 開発中の継続的なテスト

**操作方法:**
- `a` - すべてのテストを実行
- `f` - 失敗したテストのみ実行
- `p` - ファイル名でフィルタ
- `t` - テスト名でフィルタ
- `q` - 終了

### 3. カバレッジ（npm run test:coverage）

コードカバレッジレポートを生成します。

```bash
npm run test:coverage
```

**出力:**
- コンソールにカバレッジサマリー表示
- `coverage/lcov-report/index.html` にHTMLレポート生成

**カバレッジの見方:**
- **Lines**: 実行された行の割合
- **Statements**: 実行された文の割合
- **Functions**: 呼び出された関数の割合
- **Branches**: テストされた分岐の割合

### 4. E2Eテスト（npm run test:e2e）

ブラウザを使用した統合テストを実行します。

```bash
npm run test:e2e
```

**事前準備:**
```bash
# 初回のみ: Playwrightのブラウザをインストール
npx playwright install
```

**特徴:**
- 実際のブラウザで動作確認
- ユーザー操作のシミュレーション
- スクリーンショット付きレポート

### 5. 全テスト実行（npm run test:all）

単体テストとE2Eテストを順番に実行します。

```bash
npm run test:all
```

**使用場面:**
- プルリクエスト前の最終確認
- リリース前の総合テスト
- CI/CDパイプライン

## テストファイルの構成

```
my-board-app/
├── __tests__/              # 単体テスト
│   ├── api/               # APIテスト
│   │   ├── posts/
│   │   │   ├── route.test.ts
│   │   │   └── [id]/
│   │   │       └── route.test.ts
│   │   └── crud.test.ts
│   ├── components/        # コンポーネントテスト
│   │   ├── PostForm.test.tsx
│   │   ├── PostItem.test.tsx
│   │   └── EditForm.test.tsx
│   └── lib/              # ライブラリテスト
│       └── mongodb-mock.test.ts
├── e2e/                   # E2Eテスト
│   ├── crud.spec.ts      # CRUD操作テスト
│   ├── post-creation.spec.ts
│   ├── offline-mode.spec.ts
│   └── responsive.spec.ts
├── test-helpers/          # テストユーティリティ
│   ├── test-data.ts
│   └── test-setup.ts
└── scripts/              # テストスクリプト
    ├── run-tests.js
    └── test-runner.js
```

## カバレッジ目標

| カテゴリ | 目標 | 現在 |
|---------|------|------|
| 全体 | 70% | 37% |
| コンポーネント | 80% | 84.52% ✅ |
| API | 70% | 0% |
| ライブラリ | 60% | 44.18% |

### 高カバレッジコンポーネント
- PostForm: 93.33% ✨
- EditForm: 87.5% ✨
- PostItem: 84.61% ✨
- mongodb-mock: 96.29% ✨

## トラブルシューティング

### テストが失敗する場合

1. **依存関係の確認**
```bash
npm install
```

2. **キャッシュのクリア**
```bash
npm run clean
npm test
```

3. **Node.jsバージョン確認**
```bash
node --version  # v18.0.0以上が必要
```

### E2Eテストが動作しない場合

1. **Playwrightのインストール**
```bash
npx playwright install
```

2. **開発サーバーの起動**
```bash
# 別ターミナルで
npm run dev

# その後
npm run test:e2e
```

3. **ヘッドレスモードの無効化（デバッグ用）**
```bash
npm run test:e2e:debug
```

## CI/CD環境での実行

GitHub Actionsで自動実行されます。

```yaml
# .github/workflows/test.yml
- name: Run unit tests
  run: npm test

- name: Run E2E tests
  run: npm run test:e2e:ci
```

## ベストプラクティス

### テストの書き方

1. **AAA パターン**
```javascript
it('should create a post', async () => {
  // Arrange（準備）
  const postData = { title: 'Test', author: 'User', content: 'Content' };
  
  // Act（実行）
  const result = await createPost(postData);
  
  // Assert（検証）
  expect(result.title).toBe('Test');
});
```

2. **テストの独立性**
- 各テストは独立して実行可能
- 他のテストに依存しない
- テスト後のクリーンアップ

3. **わかりやすいテスト名**
```javascript
describe('PostForm', () => {
  it('should display error message when submitting empty form', () => {
    // テスト内容
  });
});
```

## デバッグ

### Jestデバッグ
```bash
# 特定のファイルのみテスト
npm test -- PostForm.test.tsx

# 特定のテストスイートのみ
npm test -- --testNamePattern="PostForm"
```

### Playwrightデバッグ
```bash
# UIモードで実行
npm run test:e2e:ui

# デバッグモードで実行
npm run test:e2e:debug

# トレースビューア
npx playwright show-trace trace.zip
```

## 参考リンク

- [Jest公式ドキュメント](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright公式ドキュメント](https://playwright.dev/docs/intro)

---

最終更新: 2024年12月