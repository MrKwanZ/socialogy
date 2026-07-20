import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import Image from '../../../components/Image/Image';
import { API_URL, graphqlFetch } from '../../../util/graphql';
import type { GraphqlPost } from '../../../types/graphql';
import './SinglePost.css';

interface SinglePostProps {
  token: string | null;
}

const SinglePost = ({ token }: SinglePostProps) => {
  const { postId } = useParams<{ postId: string }>();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [date, setDate] = useState('');
  const [image, setImage] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!postId) {
      return;
    }

    const fetchPost = async () => {
      try {
        const resData = await graphqlFetch<{ post: GraphqlPost }>(
          `query FetchSinglePost($postId: ID!) {
            post(id: $postId) {
              title
              content
              imageUrl
              creator {
                name
              }
              createdAt
            }
          }`,
          { postId },
          token
        );

        if (resData.errors) {
          throw new Error('Fetching post failed!');
        }

        const post = resData.data!.post;
        setTitle(post.title);
        setAuthor(post.creator.name);
        setImage(`${API_URL}/${post.imageUrl}`);
        setDate(new Date(post.createdAt).toLocaleDateString('en-US'));
        setContent(post.content);
      } catch (err) {
        console.log(err);
      }
    };

    fetchPost();
  }, [postId, token]);

  return (
    <section className="single-post">
      <h1>{title}</h1>
      <h2>
        Created by {author} on {date}
      </h2>
      <div className="single-post__image">
        <Image contain imageUrl={image} />
      </div>
      <p>{content}</p>
    </section>
  );
};

export default SinglePost;
