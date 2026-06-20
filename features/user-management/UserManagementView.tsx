// This module has been replaced by features/admin/users/AdminUserListView.tsx
import React from 'react';

const DeprecatedUserManagementView: React.FC = () => {
  return (
    <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-md">
      <p className="text-yellow-700 font-semibold">
        Ce module de gestion des utilisateurs est obsolète et a été remplacé.
      </p>
      <p className="text-yellow-600 text-sm">
        Veuillez vous référer à la nouvelle section Admin pour la gestion des utilisateurs.
      </p>
    </div>
  );
};
export default DeprecatedUserManagementView;