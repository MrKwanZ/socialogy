import { createPortal } from 'react-dom';

import './Backdrop.css';

interface BackdropProps {
  open: boolean;
  onClick: () => void;
}

const Backdrop = ({ open, onClick }: BackdropProps) =>
  createPortal(
    <div
      className={['backdrop', open ? 'open' : ''].join(' ')}
      onClick={onClick}
    />,
    document.getElementById('backdrop-root') as HTMLElement
  );

export default Backdrop;
