import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { mockDb } from '@/lib/mongodb-mock';

export async function GET() {
  let useMock = false;
  
  try {
    // MongoDBへの接続を試みる
    try {
      await dbConnect();
      const posts = await Post.find({}).sort({ createdAt: -1 });
      return NextResponse.json({ success: true, data: posts, mock: false });
    } catch (dbError) {
      console.warn('MongoDB接続失敗、モックデータを使用:', dbError);
      useMock = true;
    }
    
    // モックデータを使用
    if (useMock) {
      const posts = await mockDb.find();
      return NextResponse.json({ 
        success: true, 
        data: posts, 
        mock: true,
        warning: 'MongoDBに接続できないため、一時的なメモリ内データを使用しています' 
      });
    }
  } catch (error) {
    console.error('GET /api/posts エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'データベース接続エラー。MongoDBが起動しているか確認してください。',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let useMock = false;
  
  try {
    const body = await request.json();
    
    // 入力検証
    if (!body.title || !body.author || !body.content) {
      return NextResponse.json(
        { success: false, error: 'タイトル、投稿者名、内容は必須です' },
        { status: 400 }
      );
    }
    
    // MongoDBへの接続を試みる
    try {
      await dbConnect();
      const post = await Post.create(body);
      return NextResponse.json(
        { success: true, data: post, mock: false },
        { status: 201 }
      );
    } catch (dbError) {
      console.warn('MongoDB接続失敗、モックデータを使用:', dbError);
      useMock = true;
    }
    
    // モックデータを使用
    if (useMock) {
      const post = await mockDb.create(body);
      return NextResponse.json(
        { 
          success: true, 
          data: post, 
          mock: true,
          warning: 'MongoDBに接続できないため、データは一時的にメモリに保存されます'
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('POST /api/posts エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '投稿の作成に失敗しました',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}