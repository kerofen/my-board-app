// MongoDB接続テストスクリプト
const mongoose = require('mongoose');

// MongoDB Atlas接続文字列
const MONGODB_URI = 'mongodb+srv://boarduser:B8o0A3VIWm3mpJbE@cluster0.miog73x.mongodb.net/simple-board?retryWrites=true&w=majority&appName=Cluster0';

console.log('MongoDB接続テスト開始...');
console.log('接続先:', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'));

async function testConnection() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB接続成功！');
    
    // テストデータベース名を表示
    const dbName = mongoose.connection.db.databaseName;
    console.log('データベース名:', dbName);
    
    // 接続を閉じる
    await mongoose.connection.close();
    console.log('接続を正常に閉じました');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB接続エラー:');
    console.error('エラーメッセージ:', error.message);
    console.error('\n考えられる原因:');
    console.error('1. 接続文字列が間違っている');
    console.error('2. パスワードに特殊文字が含まれている（URLエンコードが必要）');
    console.error('3. MongoDB AtlasのIPホワイトリストに追加されていない');
    console.error('4. ユーザー名またはパスワードが間違っている');
    process.exit(1);
  }
}

testConnection();