import type { MouseEventHandler, ReactNode } from 'react';
import { Link } from 'react-router-dom';

import './Button.css';

interface ButtonProps {
  design?: string;
  mode?: string;
  link?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  children: ReactNode;
}

const Button = ({
  design,
  mode,
  link,
  onClick,
  disabled,
  loading,
  type,
  children
}: ButtonProps) =>
  !link ? (
    <button
      className={['button', `button--${design}`, `button--${mode}`].join(' ')}
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
    >
      {loading ? 'Loading...' : children}
    </button>
  ) : (
    <Link
      className={['button', `button--${design}`, `button--${mode}`].join(' ')}
      to={link}
    >
      {children}
    </Link>
  );

export default Button;
