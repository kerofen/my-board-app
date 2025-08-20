const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// 環境変数をロード
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Postモデルをロード
const PostSchema = new mongoose.Schema(
  {
    title: String,
    author: String,
    content: String,
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

// データベースクリーンアップ
async function cleanup(options = {}) {
  const { keepCount = 0, pattern = null } = options;
  
  try {
    // MongoDB接続
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test-board';
    console.log('🧹 データベースクリーンアップ開始...');
    console.log('接続先:', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'));
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB接続成功');
    
    // 削除対象の条件
    let query = {};
    if (pattern) {
      // パターンにマッチするデータのみ削除
      query = {
        $or: [
          { title: { $regex: pattern, $options: 'i' } },
          { author: { $regex: pattern, $options: 'i' } },
          { content: { $regex: pattern, $options: 'i' } },
        ],
      };
    }
    
    // 現在のデータ数を確認
    const currentCount = await Post.countDocuments();
    console.log(`📊 現在のデータ数: ${currentCount}件`);
    
    if (keepCount > 0 && !pattern) {
      // 指定された数だけ最新のデータを残す
      const postsToKeep = await Post.find()
        .sort({ createdAt: -1 })
        .limit(keepCount)
        .select('_id');
      
      const idsToKeep = postsToKeep.map(p => p._id);
      query = { _id: { $nin: idsToKeep } };
      
      const deleteResult = await Post.deleteMany(query);
      console.log(`🗑️  ${deleteResult.deletedCount}件のデータを削除しました`);
      console.log(`💾 ${keepCount}件の最新データを保持しました`);
    } else {
      // すべてまたはパターンにマッチするデータを削除
      const deleteResult = await Post.deleteMany(query);
      console.log(`🗑️  ${deleteResult.deletedCount}件のデータを削除しました`);
    }
    
    // 削除後のデータ数を確認
    const remainingCount = await Post.countDocuments();
    console.log(`📊 削除後のデータ数: ${remainingCount}件`);
    
    console.log('\n✨ クリーンアップ完了！');
    
    return {
      deleted: currentCount - remainingCount,
      remaining: remainingCount,
    };
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB接続を閉じました');
  }
}

// CLIから実行された場合
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // コマンドライン引数を解析
  args.forEach((arg, index) => {
    if (arg === '--keep' && args[index + 1]) {
      options.keepCount = parseInt(args[index + 1], 10);
    }
    if (arg === '--pattern' && args[index + 1]) {
      options.pattern = args[index + 1];
    }
  });
  
  cleanup(options)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { cleanup };