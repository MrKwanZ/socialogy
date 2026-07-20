import { Types } from 'mongoose';
import { IUserDocument, IPostDocument } from '../types/models';
import { GraphqlPost, GraphqlUser } from '../types/graphql';

export function formatUser(user: IUserDocument): GraphqlUser {
  return {
    ...user.toObject(),
    _id: user._id.toString()
  } as unknown as GraphqlUser;
}

function formatCreator(
  creator: IPostDocument['creator'] | IUserDocument
): GraphqlUser {
  if (creator instanceof Types.ObjectId) {
    return {
      _id: creator.toString(),
      name: '',
      email: '',
      status: '',
      posts: []
    };
  }

  return formatUser(creator);
}

export function formatPost(post: IPostDocument): GraphqlPost {
  const postObject = post.toObject();

  return {
    ...postObject,
    _id: post._id.toString(),
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    creator: formatCreator(post.creator as IUserDocument | Types.ObjectId)
  };
}
