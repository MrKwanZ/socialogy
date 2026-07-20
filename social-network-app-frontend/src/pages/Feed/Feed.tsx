import { useState, useEffect, useCallback, type FormEvent } from 'react';

import Post from '../../components/Feed/Post/Post';
import Button from '../../components/Button/Button';
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit';
import Input from '../../components/Form/Input/Input';
import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import { API_URL, graphqlFetch } from '../../util/graphql';
import { getGraphqlErrorMessage } from '../../util/graphqlErrors';
import type { FeedPost, GraphqlPost, PostData, PostFormData } from '../../types/graphql';
import './Feed.css';

interface FeedProps {
  userId: string | null;
  token: string | null;
}

type PaginationDirection = 'next' | 'previous';

const Feed = ({ userId, token }: FeedProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [editPost, setEditPost] = useState<FeedPost | null>(null);
  const [status, setStatus] = useState('');
  const [postPage, setPostPage] = useState(1);
  const [postsLoading, setPostsLoading] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const catchError = useCallback((fetchError: Error) => {
    setError(fetchError);
  }, []);

  const loadPosts = useCallback(
    (direction?: PaginationDirection) => {
      if (direction) {
        setPostsLoading(true);
        setPosts([]);
      }

      setPostPage((prevPage) => {
        let page = prevPage;
        if (direction === 'next') {
          page++;
        }
        if (direction === 'previous') {
          page--;
        }

        graphqlFetch<{ posts: PostData }>(
          `query FetchPosts($page: Int) {
            posts(page: $page) {
              posts {
                _id
                title
                content
                imageUrl
                creator {
                  _id
                  name
                }
                createdAt
              }
              totalPosts
            }
          }`,
          { page },
          token
        )
          .then((resData) => {
            if (resData.errors) {
              throw new Error('Fetching posts failed!');
            }
            setPosts(
              resData.data!.posts.posts.map((post) => ({
                ...post,
                imagePath: post.imageUrl
              }))
            );
            setTotalPosts(resData.data!.posts.totalPosts);
            setPostsLoading(false);
          })
          .catch(catchError);

        return direction ? page : prevPage;
      });
    },
    [token, catchError]
  );

  useEffect(() => {
    graphqlFetch<{ user: { status: string } }>(
      `{ user { status } }`,
      {},
      token
    )
      .then((resData) => {
        if (resData.errors) {
          throw new Error('Fetching status failed!');
        }
        setStatus(resData.data!.user.status);
      })
      .catch(catchError);

    loadPosts();
  }, [token, catchError, loadPosts]);

  const statusUpdateHandler = (event: FormEvent) => {
    event.preventDefault();
    graphqlFetch(
      `mutation UpdateUserStatus($userStatus: String!) {
        updateStatus(status: $userStatus) {
          status
        }
      }`,
      { userStatus: status },
      token
    )
      .then((resData) => {
        if (resData.errors) {
          throw new Error('Fetching status failed!');
        }
        console.log(resData);
      })
      .catch(catchError);
  };

  const newPostHandler = () => {
    setEditPost(null);
    setIsEditing(true);
  };

  const startEditPostHandler = (postId: string) => {
    const loadedPost = { ...posts.find((p) => p._id === postId)! };
    setEditPost(loadedPost);
    setIsEditing(true);
  };

  const cancelEditHandler = () => {
    setIsEditing(false);
    setEditPost(null);
  };

  const finishEditHandler = (postData: PostFormData) => {
    setEditLoading(true);
    const formData = new FormData();
    formData.append('image', postData.image as Blob);
    if (editPost) {
      formData.append('oldPath', editPost.imagePath);
    }

    fetch(`${API_URL}/post-image`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer ' + token
      },
      body: formData
    })
      .then((res) => res.json())
      .then((fileResData: { filePath?: string }) => {
        let imageUrl = fileResData.filePath || 'undefined';
        if (imageUrl) {
          imageUrl = imageUrl.replace(/\\/g, '/');
        }

        const graphqlQuery = editPost
          ? {
              query: `
            mutation UpdateExistingPost($postId: ID!, $title: String!, $content: String!, $imageUrl: String!) {
              updatePost(id: $postId, postInput: {title: $title, content: $content, imageUrl: $imageUrl}) {
                _id
                title
                content
                imageUrl
                creator {
                  _id
                  name
                }
                createdAt
              }
            }
          `,
              variables: {
                postId: editPost._id,
                title: postData.title,
                content: postData.content,
                imageUrl
              }
            }
          : {
              query: `
            mutation CreateNewPost($title: String!, $content: String!, $imageUrl: String!) {
              createPost(postInput: {title: $title, content: $content, imageUrl: $imageUrl}) {
                _id
                title
                content
                imageUrl
                creator {
                  _id
                  name
                }
                createdAt
              }
            }
          `,
              variables: {
                title: postData.title,
                content: postData.content,
                imageUrl
              }
            };

        return fetch(`${API_URL}/graphql`, {
          method: 'POST',
          body: JSON.stringify(graphqlQuery),
          headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json'
          }
        });
      })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.errors) {
          throw new Error(getGraphqlErrorMessage(resData.errors, 'post'));
        }

        const resDataField = editPost ? 'updatePost' : 'createPost';
        const savedPost = resData.data[resDataField] as GraphqlPost;
        const post: FeedPost = {
          ...savedPost,
          imagePath: savedPost.imageUrl
        };

        setPosts((prevPosts) => {
          const updatedPosts = [...prevPosts];
          if (editPost) {
            const postIndex = prevPosts.findIndex((p) => p._id === editPost._id);
            updatedPosts[postIndex] = post;
          } else {
            if (prevPosts.length >= 2) {
              updatedPosts.pop();
            }
            updatedPosts.unshift(post);
          }
          return updatedPosts;
        });

        if (!editPost) {
          setTotalPosts((prev) => prev + 1);
        }
        setIsEditing(false);
        setEditPost(null);
        setEditLoading(false);
      })
      .catch((err: Error) => {
        console.log(err);
        setIsEditing(false);
        setEditPost(null);
        setEditLoading(false);
        setError(err);
      });
  };

  const statusInputChangeHandler = (_input: string, value: string) => {
    setStatus(value);
  };

  const deletePostHandler = (postId: string) => {
    setPostsLoading(true);
    graphqlFetch(
      `mutation DeletePost($postId: ID!) {
        deletePost(id: $postId)
      }`,
      { postId },
      token
    )
      .then((resData) => {
        if (resData.errors) {
          throw new Error('Deleting the post failed!');
        }
        console.log(resData);
        loadPosts();
      })
      .catch((err: Error) => {
        console.log(err);
        setPostsLoading(false);
      });
  };

  const errorHandler = () => {
    setError(null);
  };

  return (
    <>
      <ErrorHandler error={error} onHandle={errorHandler} />
      <FeedEdit
        editing={isEditing}
        selectedPost={editPost}
        loading={editLoading}
        onCancelEdit={cancelEditHandler}
        onFinishEdit={finishEditHandler}
      />
      <section className="feed__status">
        <form onSubmit={statusUpdateHandler}>
          <Input
            id="status"
            type="text"
            placeholder="Your status"
            control="input"
            onChange={statusInputChangeHandler}
            onBlur={() => {}}
            value={status}
            valid
            touched={false}
          />
          <Button mode="flat" type="submit">
            Update
          </Button>
        </form>
      </section>
      <section className="feed__control">
        <Button mode="raised" design="accent" onClick={newPostHandler}>
          New Post
        </Button>
      </section>
      <section className="feed">
        {postsLoading && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Loader />
          </div>
        )}
        {posts.length <= 0 && !postsLoading ? (
          <p style={{ textAlign: 'center' }}>No posts found.</p>
        ) : null}
        {!postsLoading && (
          <Paginator
            onPrevious={() => loadPosts('previous')}
            onNext={() => loadPosts('next')}
            lastPage={Math.ceil(totalPosts / 2)}
            currentPage={postPage}
          >
            {posts.map((post) => (
              <Post
                key={post._id}
                id={post._id}
                author={post.creator.name}
                date={new Date(post.createdAt).toLocaleDateString('en-US')}
                title={post.title}
                image={post.imageUrl}
                content={post.content}
                canModify={!!userId && post.creator._id === userId}
                onStartEdit={() => startEditPostHandler(post._id)}
                onDelete={() => deletePostHandler(post._id)}
              />
            ))}
          </Paginator>
        )}
      </section>
    </>
  );
};

export default Feed;
