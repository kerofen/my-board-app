import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Post from '@/models/Post';
import { mockDb } from '@/lib/mongodb-mock';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let post = null;
    let useMock = false;
    
    try {
      await dbConnect();
      post = await Post.findById(id);
    } catch (dbError) {
      console.warn('MongoDB接続失敗、モックデータを使用', dbError);
      post = await mockDb.findById(id);
      useMock = true;
    }
    
    if (!post) {
      return NextResponse.json(
        { success: false, error: '投稿が見つかりません' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: post, mock: useMock });
  } catch (error) {
    console.error('エラー:', error);
    return NextResponse.json(
      { success: false, error: '投稿の取得に失敗しました' },
      { status: 400 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // ユーザーIDの確認
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    let post = null;
    let useMock = false;
    
    // 既存の投稿を取得して所有者を確認
    try {
      await dbConnect();
      post = await Post.findById(id);
      if (!post) {
        return NextResponse.json(
          { success: false, error: '投稿が見つかりません' },
          { status: 404 }
        );
      }
      if (post.userId !== userId) {
        return NextResponse.json(
          { success: false, error: 'この投稿を編集する権限がありません' },
          { status: 403 }
        );
      }
      post = await Post.findByIdAndUpdate(id, body, {
        new: true,
        runValidators: true,
      });
    } catch (dbError) {
      console.warn('MongoDB接続失敗、モックデータを使用', dbError);
      post = await mockDb.findById(id);
      if (!post) {
        return NextResponse.json(
          { success: false, error: '投稿が見つかりません' },
          { status: 404 }
        );
      }
      if (post.userId !== userId) {
        return NextResponse.json(
          { success: false, error: 'この投稿を編集する権限がありません' },
          { status: 403 }
        );
      }
      post = await mockDb.findByIdAndUpdate(id, body);
      useMock = true;
    }
    
    return NextResponse.json({ success: true, data: post, mock: useMock });
  } catch (error) {
    console.error('エラー:', error);
    return NextResponse.json(
      { success: false, error: '投稿の更新に失敗しました' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // ユーザーIDの確認
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    let useMock = false;
    
    // 既存の投稿を取得して所有者を確認
    try {
      await dbConnect();
      const post = await Post.findById(id);
      if (!post) {
        return NextResponse.json(
          { success: false, error: '投稿が見つかりません' },
          { status: 404 }
        );
      }
      if (post.userId !== userId) {
        return NextResponse.json(
          { success: false, error: 'この投稿を削除する権限がありません' },
          { status: 403 }
        );
      }
      await Post.findByIdAndDelete(id);
    } catch (dbError) {
      console.warn('MongoDB接続失敗、モックデータを使用', dbError);
      const post = await mockDb.findById(id);
      if (!post) {
        return NextResponse.json(
          { success: false, error: '投稿が見つかりません' },
          { status: 404 }
        );
      }
      if (post.userId !== userId) {
        return NextResponse.json(
          { success: false, error: 'この投稿を削除する権限がありません' },
          { status: 403 }
        );
      }
      await mockDb.findByIdAndDelete(id);
      useMock = true;
    }
    
    return NextResponse.json({ success: true, data: {}, mock: useMock });
  } catch (error) {
    console.error('エラー:', error);
    return NextResponse.json(
      { success: false, error: '投稿の削除に失敗しました' },
      { status: 400 }
    );
  }
}