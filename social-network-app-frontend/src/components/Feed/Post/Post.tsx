import Button from '../../Button/Button';
import './Post.css';

interface PostProps {
  id: string;
  author: string;
  date: string;
  title: string;
  image: string;
  content: string;
  canModify: boolean;
  onStartEdit: () => void;
  onDelete: () => void;
}

const Post = ({
  id,
  author,
  date,
  title,
  canModify,
  onStartEdit,
  onDelete
}: PostProps) => (
  <article className="post">
    <header className="post__header">
      <h3 className="post__meta">
        Posted by {author} on {date}
      </h3>
      <h1 className="post__title">{title}</h1>
    </header>
    <div className="post__actions">
      <Button mode="flat" link={id}>
        View
      </Button>
      {canModify && (
        <>
          <Button mode="flat" onClick={onStartEdit}>
            Edit
          </Button>
          <Button mode="flat" design="danger" onClick={onDelete}>
            Delete
          </Button>
        </>
      )}
    </div>
  </article>
);

export default Post;
