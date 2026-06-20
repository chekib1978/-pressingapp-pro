
import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { ExclamationTriangleIcon } from '../icons/HeroIcons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode; // Permet du contenu plus riche, comme des noms en gras
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonVariant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = "Confirmer",
  cancelButtonText = "Annuler",
  confirmButtonVariant = "danger",
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-5">
        <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className={`h-8 w-8 sm:h-12 sm:w-12 ${confirmButtonVariant === 'danger' ? 'text-red-500' : 'text-yellow-500'} flex-shrink-0`} />
            <div className="text-base text-slate-700">
                {typeof message === 'string' ? <p>{message}</p> : message}
            </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="ghost" onClick={onClose}>
            {cancelButtonText}
          </Button>
          <Button variant={confirmButtonVariant} onClick={onConfirm}>
            {confirmButtonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
