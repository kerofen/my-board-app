# エラー修正ログ
日付: 2025-08-08

## 発生したエラーと修正内容

### 1. Favicon 404エラー
**エラーメッセージ:**
```
:3001/favicon.ico:1 Failed to load resource: the server responded with a status of 404 (Not Found)
```

**原因:**
- publicディレクトリにfavicon.icoが存在しなかった

**修正内容:**
- `public/favicon.ico`ファイルを作成
- 状態: ✅ 修正完了

---

### 2. MongoDB接続エラー (400 Bad Request)
**エラーメッセージ:**
```
:3001/api/posts:1 Failed to load resource: the server responded with a status of 400 (Bad Request)
```

**考えられる原因:**
1. MongoDBサーバーが起動していない
2. 接続文字列が正しくない
3. ネットワークの問題

**修正手順:**

#### ローカルMongoDBを使用する場合:

1. **MongoDBの起動確認**
   ```bash
   # Windowsの場合
   net start MongoDB
   
   # またはMongoDBのbinディレクトリで
   mongod
   ```

2. **接続テスト**
   ```bash
   mongosh
   ```

3. **環境変数の確認**
   `.env.local`ファイル:
   ```
   MONGODB_URI=mongodb://localhost:27017/simple-board
   ```

#### MongoDB Atlasを使用する場合:

1. **MongoDB Atlasアカウント作成**
   - https://www.mongodb.com/cloud/atlas にアクセス
   - 無料アカウントを作成

2. **クラスター作成**
   - 無料のM0クラスターを選択
   - リージョンを選択（最寄りを推奨）

3. **データベースユーザー作成**
   - Database Access → Add New Database User
   - ユーザー名とパスワードを設定

4. **ネットワークアクセス設定**
   - Network Access → Add IP Address
   - "Allow Access from Anywhere"を選択（開発時のみ）
   - 本番環境では特定のIPのみ許可

5. **接続文字列の取得**
   - Clusters → Connect → Connect your application
   - 接続文字列をコピー

6. **環境変数の更新**
   `.env.local`ファイル:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/simple-board?retryWrites=true&w=majority
   ```
   ※ `<username>`と`<password>`を実際の値に置き換える

**追加の修正内容:**

エラーハンドリングを改善するため、以下のファイルを更新:

### 修正ファイル: `lib/mongodb.ts`
```typescript
// より詳細なエラーメッセージを追加
async function dbConnect() {
  try {
    // 接続処理
  } catch (error) {
    console.error('MongoDB接続エラー:', error);
    throw error;
  }
}
```

### 修正ファイル: `app/api/posts/route.ts`
```typescript
// より詳細なエラーレスポンス
catch (error) {
  console.error('API Error:', error);
  return NextResponse.json(
    { 
      success: false, 
      error: 'データベース接続エラー。MongoDBが起動しているか確認してください。',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    },
    { status: 500 }
  );
}
```

## トラブルシューティングチェックリスト

### MongoDBが起動しない場合:
- [ ] MongoDBがインストールされているか確認
- [ ] MongoDBサービスが実行中か確認
- [ ] ポート27017が他のプロセスに使用されていないか確認
- [ ] ファイアウォールの設定を確認

### 接続できない場合:
- [ ] 接続文字列が正しいか確認
- [ ] ユーザー名とパスワードが正しいか確認
- [ ] IPアドレスがホワイトリストに追加されているか確認（Atlas使用時）
- [ ] ネットワーク接続を確認

### デバッグ方法:
1. コンソールログを確認
2. Network タブでAPIレスポンスを確認
3. MongoDBのログを確認
4. 接続文字列を直接テスト:
   ```bash
   mongosh "mongodb://localhost:27017/simple-board"
   ```

## 動作確認手順

1. MongoDBを起動
2. 開発サーバーを再起動:
   ```bash
   npm run dev
   ```
3. ブラウザで http://localhost:3000 にアクセス
4. 開発者ツールのConsoleとNetworkタブでエラーを確認
5. 投稿の作成・表示・編集・削除が正常に動作することを確認

## 修正完了状態
- ✅ Favicon.ico 404エラー: 修正完了
- ⚠️ MongoDB接続エラー: 上記手順に従って設定が必要