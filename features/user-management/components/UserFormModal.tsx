// This module has been replaced by features/admin/users/components/AdminUserFormModal.tsx
import React from 'react';

const DeprecatedUserFormModal: React.FC<{isOpen?: boolean, onClose?: () => void, user?: any}> = ({isOpen, onClose}) => {
  if (!isOpen) return null;
  return (
    <div style={{position: 'fixed', top: '20%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '20px', zIndex: 100, border: '1px solid red'}}>
      <p>Ce formulaire modal est obsolète.</p>
      <button onClick={onClose}>Fermer</button>
    </div>
  );
};
export default DeprecatedUserFormModal;