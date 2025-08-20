/**
 * テストデータの準備と後片付け用ユーティリティ
 */

import { mockDb } from '@/lib/mongodb-mock';

// テスト前のセットアップ
export const setupTestData = async () => {
  // モックDBをリセット
  if (mockDb && typeof mockDb === 'object' && 'posts' in mockDb) {
    (mockDb as any).posts = [];
  }
  
  // 必要に応じて初期データを追加
  const initialData = {
    _id: 'initial_post',
    title: '初期投稿',
    author: 'システム',
    content: 'テスト環境の初期投稿です',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  if (mockDb && typeof mockDb.create === 'function') {
    await mockDb.create(initialData);
  }
  
  return initialData;
};

// テスト後のクリーンアップ
export const cleanupTestData = async (idsToClean: string[] = []) => {
  // 特定のIDの投稿を削除
  if (idsToClean.length > 0 && mockDb && typeof mockDb.findByIdAndDelete === 'function') {
    for (const id of idsToClean) {
      await mockDb.findByIdAndDelete(id);
    }
  }
  
  // モックDBを完全にリセット
  if (mockDb && typeof mockDb === 'object' && 'posts' in mockDb) {
    (mockDb as any).posts = [];
  }
};

// テストデータのスナップショット保存
export const saveTestDataSnapshot = () => {
  if (mockDb && typeof mockDb === 'object' && 'posts' in mockDb) {
    return [...(mockDb as any).posts];
  }
  return [];
};

// テストデータのスナップショット復元
export const restoreTestDataSnapshot = (snapshot: any[]) => {
  if (mockDb && typeof mockDb === 'object' && 'posts' in mockDb) {
    (mockDb as any).posts = [...snapshot];
  }
};

// 特定条件のテストデータを作成
export const createTestScenario = async (scenario: 'empty' | 'single' | 'multiple' | 'large') => {
  await cleanupTestData();
  
  switch (scenario) {
    case 'empty':
      // 空のデータベース
      break;
      
    case 'single':
      // 単一の投稿
      if (mockDb && typeof mockDb.create === 'function') {
        await mockDb.create({
          title: '単一テスト投稿',
          author: 'テスター',
          content: 'これは単一の投稿です',
        });
      }
      break;
      
    case 'multiple':
      // 複数の投稿（10件）
      if (mockDb && typeof mockDb.create === 'function') {
        for (let i = 1; i <= 10; i++) {
          await mockDb.create({
            title: `テスト投稿 ${i}`,
            author: `ユーザー ${i}`,
            content: `内容 ${i}`,
          });
        }
      }
      break;
      
    case 'large':
      // 大量の投稿（100件）
      if (mockDb && typeof mockDb.create === 'function') {
        for (let i = 1; i <= 100; i++) {
          await mockDb.create({
            title: `大量テスト投稿 ${i}`,
            author: `ユーザー ${(i % 10) + 1}`,
            content: `これは${i}番目の投稿です`,
          });
        }
      }
      break;
  }
};

// テストデータの検証
export const validateTestData = (data: any) => {
  const errors: string[] = [];
  
  if (!data._id) errors.push('IDが存在しません');
  if (!data.title || data.title.trim() === '') errors.push('タイトルが無効です');
  if (!data.author || data.author.trim() === '') errors.push('作成者が無効です');
  if (!data.content || data.content.trim() === '') errors.push('内容が無効です');
  if (!data.createdAt) errors.push('作成日時が存在しません');
  if (!data.updatedAt) errors.push('更新日時が存在しません');
  
  // 文字数制限チェック
  if (data.title && data.title.length > 100) errors.push('タイトルが長すぎます');
  if (data.author && data.author.length > 50) errors.push('作成者名が長すぎます');
  if (data.content && data.content.length > 2000) errors.push('内容が長すぎます');
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

// モックレスポンスの生成
export const createMockResponse = (status: number, data: any) => {
  return {
    status,
    json: async () => data,
    headers: new Map(),
  };
};

// 非同期処理のヘルパー
export const waitForCondition = async (
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<boolean> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  return false;
};

// テスト用のフェイク遅延
export const fakeDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// エラーシミュレーション
export const simulateError = (type: 'network' | 'validation' | 'server' | 'timeout') => {
  switch (type) {
    case 'network':
      throw new Error('Network error: Failed to fetch');
    case 'validation':
      throw new Error('Validation error: Invalid input data');
    case 'server':
      throw new Error('Server error: Internal server error');
    case 'timeout':
      throw new Error('Request timeout');
    default:
      throw new Error('Unknown error');
  }
};

// テストデータの統計情報
export const getTestDataStats = () => {
  if (mockDb && typeof mockDb === 'object' && 'posts' in mockDb) {
    const posts = (mockDb as any).posts;
    return {
      total: posts.length,
      authors: [...new Set(posts.map((p: any) => p.author))].length,
      avgContentLength: posts.reduce((acc: number, p: any) => acc + p.content.length, 0) / posts.length || 0,
      oldestPost: posts.reduce((oldest: any, p: any) => 
        !oldest || new Date(p.createdAt) < new Date(oldest.createdAt) ? p : oldest, null
      ),
      newestPost: posts.reduce((newest: any, p: any) => 
        !newest || new Date(p.createdAt) > new Date(newest.createdAt) ? p : newest, null
      ),
    };
  }
  return null;
};

// 並行処理テスト用のヘルパー
export const runConcurrent = async <T>(
  tasks: (() => Promise<T>)[],
  maxConcurrency: number = 5
): Promise<T[]> => {
  const results: T[] = [];
  const executing: Promise<void>[] = [];
  
  for (const task of tasks) {
    const promise = task().then(result => {
      results.push(result);
    });
    
    executing.push(promise);
    
    if (executing.length >= maxConcurrency) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p === promise), 1);
    }
  }
  
  await Promise.all(executing);
  return results;
};