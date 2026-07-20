import mongoose, { Schema } from 'mongoose';
import { IPost } from '../types/models';

const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

const Post = mongoose.model<IPost>('Post', postSchema);

export = Post;
