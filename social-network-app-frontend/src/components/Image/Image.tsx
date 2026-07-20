import './Image.css';

interface ImageProps {
  imageUrl: string;
  contain?: boolean;
  left?: boolean;
}

const Image = ({ imageUrl, contain, left }: ImageProps) => (
  <div
    className="image"
    style={{
      backgroundImage: `url('${imageUrl}')`,
      backgroundSize: contain ? 'contain' : 'cover',
      backgroundPosition: left ? 'left' : 'center'
    }}
  />
);

export default Image;
