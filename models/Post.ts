import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  title: string;
  author: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'タイトルは必須です'],
      maxlength: [100, 'タイトルは100文字以内で入力してください'],
    },
    author: {
      type: String,
      required: [true, '投稿者名は必須です'],
      maxlength: [50, '投稿者名は50文字以内で入力してください'],
    },
    content: {
      type: String,
      required: [true, '内容は必須です'],
      maxlength: [140, '内容は140文字以内で入力してください'],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);