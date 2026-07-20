import { HydratedDocument, Types } from 'mongoose';

export interface IUser {
  email: string;
  password: string;
  name: string;
  status: string;
  posts: Types.ObjectId[];
}

export interface IPost {
  title: string;
  imageUrl: string;
  content: string;
  creator: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type IUserDocument = HydratedDocument<IUser>;
export type IPostDocument = HydratedDocument<IPost>;
