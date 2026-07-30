import { User } from '../../users/user.entity';
import { Post } from '../../posts/post.entity';
import { UserType } from '../../users/graphql/user.type';
import { PostType } from '../../posts/graphql/post.type';

export function toUserType(user: User): UserType {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    status: user.status,
    posts: [],
  };
}

export function toPostType(post: Post): PostType {
  const creator = post.creator
    ? toUserType(post.creator)
    : ({
        id: post.creatorId,
        name: '',
        email: '',
        status: '',
        posts: [],
      } as UserType);

  return {
    id: post.id,
    title: post.title,
    content: post.content,
    imageUrl: post.imageUrl,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    creator,
  };
}

export function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  );
}
