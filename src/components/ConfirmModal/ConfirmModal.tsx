import React, { useEffect } from 'react';
import './ConfirmModal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  useEffect(() => {
    console.log('ConfirmModal isOpen changed:', isOpen);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-header">
          <h2>{title}</h2>
          <button className="confirm-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="confirm-modal-body">
          <pre className="confirm-modal-message">{message}</pre>
        </div>
        <div className="confirm-modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            ❌ Anuluj
          </button>
          <button className="btn-primary confirm-btn" onClick={onConfirm}>
            ✅ Potwierdź
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
