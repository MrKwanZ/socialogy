import Image from './Image';
import './Avatar.css';

interface AvatarProps {
  image: string;
  size: number;
}

const Avatar = ({ image, size }: AvatarProps) => (
  <div
    className="avatar"
    style={{ width: `${size}rem`, height: `${size}rem` }}
  >
    <Image imageUrl={image} />
  </div>
);

export default Avatar;
