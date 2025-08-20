const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// 環境変数をロード
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Postモデルをロード
const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    author: {
      type: String,
      required: true,
      maxlength: 50,
    },
    content: {
      type: String,
      required: true,
      maxlength: 140,
    },
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

// シードデータ
const seedPosts = [
  {
    title: 'テストデータ1: 編集テスト用',
    author: 'テストユーザー1',
    content: 'これは編集テスト用の投稿です。E2Eテストで編集操作を確認するために使用されます。',
  },
  {
    title: 'テストデータ2: 削除テスト用',
    author: 'テストユーザー2',
    content: 'これは削除テスト用の投稿です。E2Eテストで削除操作を確認するために使用されます。',
  },
  {
    title: 'テストデータ3: 表示テスト用',
    author: 'テストユーザー3',
    content: 'これは表示テスト用の投稿です。一覧表示や個別表示のテストに使用されます。',
  },
  {
    title: 'テストデータ4: 長い内容のテスト',
    author: 'テストユーザー4',
    content: 'あ'.repeat(140), // 最大文字数
  },
  {
    title: 'テストデータ5: 特殊文字テスト',
    author: 'テスト<script>alert("XSS")</script>',
    content: '改行を\n含む\nテキスト\nとタブ\tを含む内容',
  },
  {
    title: '古い投稿',
    author: '過去のユーザー',
    content: 'この投稿は古い日付で作成されます。',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    title: '最新の投稿',
    author: '現在のユーザー',
    content: 'この投稿は最新の日付で作成されます。',
  },
];

// データベース接続とシード実行
async function seed() {
  try {
    // MongoDB接続
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test-board';
    console.log('📝 シードデータ作成開始...');
    console.log('接続先:', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'));
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB接続成功');
    
    // 既存データをクリア
    const deleteResult = await Post.deleteMany({});
    console.log(`🗑️  ${deleteResult.deletedCount}件の既存データを削除しました`);
    
    // シードデータを挿入
    const insertedPosts = await Post.insertMany(seedPosts);
    console.log(`📌 ${insertedPosts.length}件のシードデータを作成しました`);
    
    // 作成されたデータを表示
    console.log('\n📋 作成されたデータ:');
    insertedPosts.forEach((post, index) => {
      console.log(`  ${index + 1}. ${post.title} (ID: ${post._id})`);
    });
    
    console.log('\n✨ シードデータ作成完了！');
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB接続を閉じました');
  }
}

// CLIから実行された場合
if (require.main === module) {
  seed().then(() => process.exit(0));
}

module.exports = { seed, seedPosts };