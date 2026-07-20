import { Request } from 'express';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import jwt from 'jsonwebtoken';

import User from '../models/user';
import Post from '../models/post';
import { clearImage } from '../util/file';
import { formatPost, formatUser } from '../util/mappers';
import { AppError, ValidationError } from '../types/errors';
import {
  AuthData,
  GraphqlPost,
  GraphqlUser,
  PostData,
  PostInputData,
  UserInputData
} from '../types/graphql';
import { IUserDocument, IPostDocument } from '../types/models';

type ResolverContext = Request;

const resolvers = {
  createUser: async (
    { userInput }: { userInput: UserInputData },
    _req: ResolverContext
  ): Promise<GraphqlUser> => {
    const errors: ValidationError[] = [];

    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: 'E-Mail is invalid.' });
    }

    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: 'Password too short!' });
    }

    if (errors.length > 0) {
      throw new AppError('Invalid input.', 422, errors);
    }

    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      throw new AppError('User exists already!');
    }

    const hashedPw = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPw
    });
    const createdUser = await user.save();

    return formatUser(createdUser);
  },

  login: async ({
    email,
    password
  }: {
    email: string;
    password: string;
  }): Promise<AuthData> => {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('User not found.', 401);
    }

    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      throw new AppError('Password is incorrect.', 401);
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    return { token, userId: user._id.toString() };
  },

  createPost: async (
    { postInput }: { postInput: PostInputData },
    req: ResolverContext
  ): Promise<GraphqlPost> => {
    if (!req.isAuth) {
      throw new AppError('Not authenticated!', 401);
    }

    const errors: ValidationError[] = [];

    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({ message: 'Title is invalid.' });
    }

    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      errors.push({ message: 'Content is invalid.' });
    }

    if (errors.length > 0) {
      throw new AppError('Invalid input.', 422, errors);
    }

    const user = await User.findById(req.userId);
    if (!user) {
      throw new AppError('Invalid user.', 401);
    }

    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user
    });
    const createdPost = await post.save();
    user.posts.push(createdPost._id);
    await user.save();

    return formatPost(createdPost);
  },

  posts: async (
    { page }: { page?: number },
    req: ResolverContext
  ): Promise<PostData> => {
    if (!req.isAuth) {
      throw new AppError('Not authenticated!', 401);
    }

    const currentPage = page ?? 1;
    const perPage = 2;
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage)
      .populate<{ creator: IUserDocument }>('creator');

    return {
      posts: posts.map((post) => formatPost(post as unknown as IPostDocument)),
      totalPosts
    };
  },

  post: async (
    { id }: { id: string },
    req: ResolverContext
  ): Promise<GraphqlPost> => {
    if (!req.isAuth) {
      throw new AppError('Not authenticated!', 401);
    }

    const post = await Post.findById(id).populate<{ creator: IUserDocument }>(
      'creator'
    );
    if (!post) {
      throw new AppError('No post found!', 404);
    }

    return formatPost(post as unknown as IPostDocument);
  },

  updatePost: async (
    { id, postInput }: { id: string; postInput: PostInputData },
    req: ResolverContext
  ): Promise<GraphqlPost> => {
    if (!req.isAuth) {
      throw new AppError('Not authenticated!', 401);
    }

    const post = await Post.findById(id).populate<{ creator: IUserDocument }>(
      'creator'
    );
    if (!post) {
      throw new AppError('No post found!', 404);
    }

    if (post.creator._id.toString() !== req.userId?.toString()) {
      throw new AppError('Not authorized!', 403);
    }

    const errors: ValidationError[] = [];

    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, { min: 5 })
    ) {
      errors.push({ message: 'Title is invalid.' });
    }

    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, { min: 5 })
    ) {
      errors.push({ message: 'Content is invalid.' });
    }

    if (errors.length > 0) {
      throw new AppError('Invalid input.', 422, errors);
    }

    post.title = postInput.title;
    post.content = postInput.content;
    if (postInput.imageUrl !== 'undefined') {
      post.imageUrl = postInput.imageUrl;
    }

    const updatedPost = await post.save();
    return formatPost(updatedPost as unknown as IPostDocument);
  },

  deletePost: async (
    { id }: { id: string },
    req: ResolverContext
  ): Promise<boolean> => {
    if (!req.isAuth) {
      throw new AppError('Not authenticated!', 401);
    }

    const post = await Post.findById(id);
    if (!post) {
      throw new AppError('No post found!', 404);
    }

    if (post.creator.toString() !== req.userId?.toString()) {
      throw new AppError('Not authorized!', 403);
    }

    clearImage(post.imageUrl);
    await Post.findByIdAndDelete(id);
    await User.findByIdAndUpdate(req.userId, { $pull: { posts: id } });

    return true;
  },

  user: async (_args: Record<string, never>, req: ResolverContext): Promise<GraphqlUser> => {
    if (!req.isAuth) {
      throw new AppError('Not authenticated!', 401);
    }

    const user = await User.findById(req.userId);
    if (!user) {
      throw new AppError('No user found!', 404);
    }

    return formatUser(user);
  },

  updateStatus: async (
    { status }: { status: string },
    req: ResolverContext
  ): Promise<GraphqlUser> => {
    if (!req.isAuth) {
      throw new AppError('Not authenticated!', 401);
    }

    const user = await User.findById(req.userId);
    if (!user) {
      throw new AppError('No user found!', 404);
    }

    user.status = status;
    await user.save();

    return formatUser(user);
  }
};

export = resolvers;
