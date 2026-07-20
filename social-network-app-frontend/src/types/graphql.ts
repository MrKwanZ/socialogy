export interface GraphqlError {
  message: string;
  status?: number;
  data?: Array<{ message: string }>;
}

export interface GraphqlResponse<TData = Record<string, unknown>> {
  data?: TData;
  errors?: GraphqlError[];
}

export interface GraphqlUser {
  _id?: string;
  name: string;
  email?: string;
  status?: string;
}

export interface GraphqlPost {
  _id: string;
  title: string;
  content: string;
  imageUrl: string;
  creator: GraphqlUser;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthData {
  token: string;
  userId: string;
}

export interface PostData {
  posts: GraphqlPost[];
  totalPosts: number;
}

export interface FeedPost extends GraphqlPost {
  imagePath: string;
}

export interface PostFormData {
  title: string;
  image: File | string;
  content: string;
}
