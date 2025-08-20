# GitHub Actions E2Eテスト セットアップガイド

## 概要
このドキュメントでは、GitHub ActionsでE2Eテストを実行するための設定方法を説明します。

## ワークフロー構成

### 1. メインE2Eテストワークフロー (`e2e-test.yml`)
**実行タイミング:**
- mainブランチへのプッシュ
- developブランチへのプッシュ
- mainブランチへのプルリクエスト
- 毎日午前2時（UTC 17:00 / JST 02:00）
- 手動実行

**特徴:**
- 3つのブラウザ（Chromium, Firefox, WebKit）で並列実行
- MongoDB 7.0を使用
- テスト結果のアーティファクト保存
- 失敗時の自動Issue作成

### 2. PR用軽量テスト (`e2e-pr.yml`)
**実行タイミング:**
- プルリクエストの作成・更新時

**特徴:**
- Chromiumのみで高速実行
- インメモリMongoDBを使用
- スモークテストとクリティカルパスのみ実行
- PR自動コメント機能

## 必要なGitHubシークレット設定

### 必須シークレット
リポジトリの Settings > Secrets and variables > Actions で以下を設定：

```yaml
# 本番用MongoDB接続文字列（オプション）
MONGODB_URI_PROD: mongodb+srv://username:password@cluster.mongodb.net/production

# テスト用MongoDB接続文字列（オプション）
MONGODB_URI_TEST: mongodb://localhost:27017/test

# Slack通知用（オプション）
SLACK_WEBHOOK_URL: https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# その他の環境変数
NEXT_PUBLIC_API_URL: https://api.your-domain.com
```

### 環境変数設定方法

1. **リポジトリ設定を開く**
   ```
   https://github.com/[username]/[repository]/settings/secrets/actions
   ```

2. **New repository secret をクリック**

3. **Name と Secret を入力**
   - Name: `MONGODB_URI_PROD`
   - Secret: 実際の接続文字列

4. **Add secret をクリック**

## ローカル環境での事前テスト

### 1. Playwright設定の確認
```bash
# Playwrightのインストール確認
npx playwright --version

# ブラウザのインストール
npx playwright install

# 設定ファイルの検証
npx playwright test --list
```

### 2. GitHub Actions ローカル実行（act使用）
```bash
# actのインストール
brew install act  # macOS
# または
choco install act  # Windows

# ワークフローのテスト実行
act -j quick-e2e --env-file .env.local
```

## テストマトリックス設定

### ブラウザマトリックス
```yaml
strategy:
  matrix:
    browser: [chromium, firefox, webkit]
    os: [ubuntu-latest, windows-latest, macos-latest]  # オプション
```

### Node.jsバージョンマトリックス
```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]
```

## アーティファクトの管理

### 保存されるアーティファクト
1. **テストレポート** (`playwright-report/`)
   - HTML形式のテストレポート
   - 保存期間: 7日間

2. **スクリーンショット** (`test-results/**/*.png`)
   - 失敗時のスクリーンショット
   - 保存期間: 3日間

3. **ビデオ録画** (`test-results/**/video.webm`)
   - テスト実行のビデオ記録
   - 保存期間: 3日間

4. **トレースファイル** (`test-results/**/trace.zip`)
   - デバッグ用の詳細トレース
   - 保存期間: 3日間

### アーティファクトのダウンロード方法
1. Actions タブを開く
2. 該当のワークフロー実行を選択
3. Artifacts セクションからダウンロード

## トラブルシューティング

### 問題: MongoDBに接続できない
**解決策:**
```yaml
- name: Start MongoDB
  uses: supercharge/mongodb-github-action@1.10.0
  with:
    mongodb-version: '7.0'
    mongodb-port: 27017  # ポート指定
```

### 問題: Playwrightのインストールが失敗
**解決策:**
```yaml
- name: Install Playwright
  run: |
    npx playwright install --with-deps
    # または特定のブラウザのみ
    npx playwright install chromium --with-deps
```

### 問題: タイムアウトエラー
**解決策:**
```yaml
jobs:
  e2e-test:
    timeout-minutes: 30  # タイムアウトを延長
    
    steps:
      - name: Run tests
        timeout-minutes: 20  # ステップごとのタイムアウト
```

### 問題: キャッシュが効かない
**解決策:**
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
    cache-dependency-path: package-lock.json  # 明示的に指定
```

## パフォーマンス最適化

### 1. 並列実行の設定
```yaml
strategy:
  max-parallel: 3  # 同時実行数を制限
  fail-fast: false  # 1つ失敗しても他は継続
```

### 2. キャッシュの活用
```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v3
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ hashFiles('package-lock.json') }}
```

### 3. 依存関係の最適化
```yaml
- name: Install dependencies
  run: |
    npm ci --prefer-offline --no-audit --no-fund
```

## セキュリティベストプラクティス

### 1. シークレットの保護
- 環境変数経由でのみシークレットを渡す
- ログ出力にシークレットが含まれないよう注意
- `::add-mask::` を使用して値をマスク

```yaml
- name: Mask sensitive data
  run: |
    echo "::add-mask::${{ secrets.API_KEY }}"
```

### 2. 権限の最小化
```yaml
permissions:
  contents: read
  pull-requests: write  # PRコメント用
  issues: write  # Issue作成用
```

### 3. 依存関係の監査
```yaml
- name: Security audit
  run: |
    npm audit --audit-level=high
    npx snyk test  # Snyk使用時
```

## CI/CDパイプラインの統合

### 1. ステージング環境へのデプロイ
```yaml
deploy-staging:
  needs: e2e-test
  if: success() && github.ref == 'refs/heads/develop'
  runs-on: ubuntu-latest
  steps:
    - name: Deploy to staging
      run: |
        # デプロイコマンド
```

### 2. 本番環境へのデプロイ
```yaml
deploy-production:
  needs: [e2e-test, performance-test]
  if: success() && github.ref == 'refs/heads/main'
  environment: production
  runs-on: ubuntu-latest
  steps:
    - name: Deploy to production
      run: |
        # デプロイコマンド
```

## モニタリングと通知

### 1. Slack通知の設定
```yaml
- name: Notify Slack
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'E2E tests failed on ${{ github.ref }}'
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 2. メール通知
GitHubの Settings > Notifications で設定

### 3. ステータスバッジの追加
README.mdに追加：
```markdown
![E2E Tests](https://github.com/[username]/[repo]/workflows/E2E%20Tests/badge.svg)
```

## 推奨される実行順序

1. **開発時**
   - ローカルでE2Eテスト実行
   - PRを作成

2. **PR時**
   - 軽量E2Eテスト自動実行
   - レビュー・修正

3. **マージ後**
   - フルE2Eテスト実行
   - パフォーマンステスト実行

4. **本番デプロイ**
   - すべてのテスト合格確認
   - デプロイ実行
   - スモークテスト実行

## メンテナンス

### 定期的な更新作業
- [ ] Playwright最新版への更新（月1回）
- [ ] Node.js LTS版への更新（3ヶ月ごと）
- [ ] MongoDB最新安定版への更新（6ヶ月ごと）
- [ ] GitHub Actions依存関係の更新（Dependabot使用）

### ログとアーティファクトの管理
- アーティファクト保存期間の調整
- 古いワークフロー実行の削除
- ストレージ使用量の監視

---

作成日: 2025年8月16日
バージョン: 1.0.0