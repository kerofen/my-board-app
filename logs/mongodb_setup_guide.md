# MongoDB セットアップガイド

## オプション1: ローカルMongoDBのインストール（Windows）

### 1. MongoDBのダウンロード
1. https://www.mongodb.com/try/download/community にアクセス
2. Windows版をダウンロード
3. MSIインストーラーを実行

### 2. インストール設定
- "Complete"インストールを選択
- "Install MongoDB as a Service"にチェック
- Service Name: MongoDB
- Data Directory: C:\Program Files\MongoDB\Server\7.0\data
- Log Directory: C:\Program Files\MongoDB\Server\7.0\log

### 3. 起動確認
```powershell
# PowerShellで実行
net start MongoDB
```

### 4. 接続テスト
```powershell
mongosh
```

## オプション2: MongoDB Atlas（クラウド版）の使用 【推奨】

### メリット
- インストール不要
- 無料枠あり（512MB）
- 自動バックアップ
- どこからでもアクセス可能

### セットアップ手順

#### 1. アカウント作成
1. https://www.mongodb.com/cloud/atlas/register にアクセス
2. メールアドレスで登録（Googleアカウントでも可）

#### 2. クラスター作成
1. "Build a Database"をクリック
2. "FREE"プランを選択（M0 Sandbox）
3. プロバイダー: AWS
4. リージョン: ap-northeast-1（東京）を選択
5. クラスター名: Cluster0（デフォルトでOK）
6. "Create"をクリック

#### 3. セキュリティ設定

**データベースユーザー作成:**
1. Security → Database Access
2. "Add New Database User"
3. 認証方法: Password
4. ユーザー名: `boarduser`
5. パスワード: 強力なパスワードを生成
6. Database User Privileges: "Read and write to any database"
7. "Add User"をクリック

**ネットワークアクセス設定:**
1. Security → Network Access
2. "Add IP Address"
3. "Allow Access from Anywhere"をクリック（開発時のみ）
   - IPアドレス: 0.0.0.0/0
4. "Confirm"をクリック

#### 4. 接続文字列の取得
1. Database → Clusters
2. "Connect"ボタンをクリック
3. "Drivers"を選択
4. Driver: Node.js, Version: 5.5 or later
5. 接続文字列をコピー:
```
mongodb+srv://boarduser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

#### 5. .env.localファイルの更新
```env
MONGODB_URI=mongodb+srv://boarduser:YourPassword123@cluster0.xxxxx.mongodb.net/simple-board?retryWrites=true&w=majority
```
※ 以下を置き換える:
- `YourPassword123`: 実際のパスワード
- `xxxxx`: 実際のクラスターID
- `/simple-board`: データベース名を追加

## 接続確認方法

### 1. 環境変数の確認
```bash
# .env.localファイルが正しく設定されているか確認
cat .env.local
```

### 2. 開発サーバーの再起動
```bash
# Ctrl+Cで停止後
npm run dev
```

### 3. ブラウザで確認
1. http://localhost:3000 にアクセス
2. 開発者ツール（F12）を開く
3. ConsoleタブとNetworkタブでエラーを確認

### 4. テスト投稿
1. タイトル: テスト投稿
2. 投稿者名: テストユーザー
3. 内容: これはテスト投稿です
4. "投稿する"ボタンをクリック

## よくある問題と解決方法

### 問題1: MongoServerError: bad auth
**原因:** ユーザー名またはパスワードが間違っている
**解決:** MongoDB Atlasで正しい認証情報を確認

### 問題2: MongoNetworkError
**原因:** IPアドレスがホワイトリストにない
**解決:** Network Accessで現在のIPを追加

### 問題3: ECONNREFUSED
**原因:** ローカルMongoDBが起動していない
**解決:** `net start MongoDB`で起動

### 問題4: Invalid connection string
**原因:** 接続文字列の形式が間違っている
**解決:** 特殊文字をURLエンコード（例: @ → %40）

## デバッグTips

### ログの確認
```javascript
// lib/mongodb.tsに追加
console.log('Connecting to:', MONGODB_URI.replace(/\/\/.*@/, '//<hidden>@'));
```

### 接続状態の確認
```javascript
// app/api/posts/route.tsに追加
import mongoose from 'mongoose';

export async function GET() {
  console.log('MongoDB接続状態:', mongoose.connection.readyState);
  // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
  // ...
}
```

## 成功した場合の動作
1. ✅ 投稿フォームから新規投稿が作成できる
2. ✅ 投稿一覧に投稿が表示される
3. ✅ 投稿の編集ができる
4. ✅ 投稿の削除ができる
5. ✅ ページリロード後もデータが保持される