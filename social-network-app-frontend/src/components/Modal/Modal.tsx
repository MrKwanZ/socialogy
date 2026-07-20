import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import Button from '../Button/Button';
import './Modal.css';

interface ModalProps {
  title: string;
  children: ReactNode;
  onCancelModal: () => void;
  onAcceptModal: () => void;
  acceptEnabled: boolean;
  isLoading?: boolean;
}

const Modal = ({
  title,
  children,
  onCancelModal,
  onAcceptModal,
  acceptEnabled,
  isLoading
}: ModalProps) =>
  createPortal(
    <div className="modal">
      <header className="modal__header">
        <h1>{title}</h1>
      </header>
      <div className="modal__content">{children}</div>
      <div className="modal__actions">
        <Button design="danger" mode="flat" onClick={onCancelModal}>
          Cancel
        </Button>
        <Button
          mode="raised"
          onClick={onAcceptModal}
          disabled={!acceptEnabled}
          loading={isLoading}
        >
          OK
        </Button>
      </div>
    </div>,
    document.getElementById('modal-root') as HTMLElement
  );

export default Modal;
