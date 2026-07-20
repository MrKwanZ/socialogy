export interface UserInputData {
  email: string;
  name: string;
  password: string;
}

export interface PostInputData {
  title: string;
  content: string;
  imageUrl: string;
}

export interface GraphqlUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  status: string;
  posts?: GraphqlPost[];
}

export interface GraphqlPost {
  _id: string;
  title: string;
  content: string;
  imageUrl: string;
  creator: GraphqlUser;
  createdAt: string;
  updatedAt: string;
}

export interface AuthData {
  token: string;
  userId: string;
}

export interface PostData {
  posts: GraphqlPost[];
  totalPosts: number;
}
