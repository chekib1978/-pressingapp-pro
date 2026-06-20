import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AppContext } from '../../../App';
import { User, UserRole, AppContextType } from '../../../types';
import Table from '../../../components/common/Table';
import Button from '../../../components/common/Button';
import { PencilSquareIcon, TrashIcon, UserPlusIcon, ExclamationTriangleIcon } from '../../../components/icons/HeroIcons';
import AdminUserFormModal from './components/AdminUserFormModal';
import ConfirmationModal from '../../../components/common/ConfirmationModal'; // Ajout de l'import

const AdminUserListView: React.FC = () => {
  const context = useContext(AppContext) as AppContextType | null; 
  
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoadingView, setIsLoadingView] = useState(true);
  const [viewError, setViewError] = useState<string | null>(null);

  const [isUserFormModalOpen, setIsUserFormModalOpen] = useState(false); // Renommé pour clarté
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const fetchUsersForView = useCallback(async () => {
    if (!context || context.currentUser?.role !== UserRole.ADMIN) {
      setIsLoadingView(false);
      setViewError("Accès non autorisé ou contexte non disponible.");
      return;
    }
    setIsLoadingView(true);
    setViewError(null);
    try {
      const users = await context.adminFetchUsersList();
      setUsersList(users);
    } catch (error: any) {
      console.error("AdminUserListView: Error fetching users:", error);
      setViewError(error.message || "Impossible de charger la liste des utilisateurs.");
      setUsersList([]); 
    } finally {
      setIsLoadingView(false);
    }
  }, [context]);

  useEffect(() => {
    if (context?.currentUser?.role === UserRole.ADMIN) { // Fetch only if admin
        fetchUsersForView();
    }
  }, [fetchUsersForView, context?.currentUser?.role]); // Re-fetch if role changes (e.g. on initial load)

  if (!context) {
    return <p className="p-4 text-center">Chargement du contexte de l'application...</p>;
  }
  const { currentUser, setAppError } = context; // Ajout de setAppError

  if (currentUser?.role !== UserRole.ADMIN) {
    return <p className="p-4 text-red-600 text-center">Accès refusé. Cette section est réservée aux administrateurs.</p>;
  }
  
  const handleOpenUserFormModal = (user?: User) => {
    setEditingUser(user);
    setIsUserFormModalOpen(true);
  };

  const handleCloseUserFormModalAndRefresh = () => {
    setEditingUser(undefined);
    setIsUserFormModalOpen(false);
    fetchUsersForView(); 
  };

  const handleDeleteUserRequest = (user: User) => {
    if (currentUser?.id === user.id) {
        setAppError("Vous ne pouvez pas supprimer votre propre compte administrateur via cette interface.");
        // Alternative: utiliser un toast/notification locale au lieu de appError si on ne veut pas que ça soit global
        // setViewError("Vous ne pouvez pas supprimer votre propre compte administrateur via cette interface.");
        return;
    }
    setUserToDelete(user);
    setIsConfirmDeleteModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (userToDelete && context) {
      if (currentUser?.id === userToDelete.id) {
          // Double check here, though handleDeleteUserRequest should prevent it
          setIsConfirmDeleteModalOpen(false);
          setUserToDelete(null);
          setAppError("Opération non autorisée : ne peut pas se supprimer soi-même.");
          return;
      }
      setIsLoadingView(true);
      try {
        await context.adminDeleteExistingUser(userToDelete.id);
        setAppError(null); 
        fetchUsersForView(); 
      } catch (error: any) {
        console.error("AdminUserListView: Error deleting user:", error);
        setViewError(error.message || "Erreur lors de la suppression de l'utilisateur.");
        // L'erreur globale est déjà potentiellement définie dans adminDeleteExistingUser
      } finally {
        setIsConfirmDeleteModalOpen(false);
        setUserToDelete(null);
        // setIsLoadingView(false); // fetchUsersForView le fera
      }
    }
  };

  const columns = [
    { header: 'Nom', accessor: 'name' as keyof User, className: 'font-medium' },
    { header: 'Email / Identifiant', accessor: 'email' as keyof User },
    { 
      header: 'Rôle', 
      accessor: (item: User) => (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${item.role === UserRole.ADMIN ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-200 text-blue-800'}`}>
          {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
        </span>
      )
    },
    { header: 'Créé le', accessor: (item: User) => item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : 'N/A', className: 'text-sm' },
    {
      header: 'Actions',
      accessor: (item: User) => (
        <div className="flex space-x-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => handleOpenUserFormModal(item)} title="Modifier">
            <PencilSquareIcon className="h-5 w-5 text-blue-500" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleDeleteUserRequest(item)} 
            title="Supprimer"
            disabled={currentUser?.id === item.id || isLoadingView} 
          >
            <TrashIcon className="h-5 w-5 text-red-500" />
          </Button>
        </div>
      ),
      className: 'text-right'
    },
  ];

  if (isLoadingView && usersList.length === 0 && !viewError) { 
    return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            <p className="ml-3 text-slate-600">Chargement des utilisateurs...</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-700">Gestion des Utilisateurs (Admin)</h2>
        <Button onClick={() => handleOpenUserFormModal()} leftIcon={<UserPlusIcon className="h-5 w-5"/>} disabled={isLoadingView}>
          Ajouter Utilisateur
        </Button>
      </div>

      {viewError && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-300 flex items-center" role="alert">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
          <span className="font-medium">Erreur:</span> {viewError}
           <Button variant="ghost" size="sm" onClick={fetchUsersForView} className="ml-auto text-red-700 hover:text-red-900">Réessayer</Button>
        </div>
      )}
      
      <Table<User>
        columns={columns}
        data={usersList}
        isLoading={isLoadingView && usersList.length > 0 && !viewError} 
        emptyStateMessage="Aucun utilisateur trouvé."
      />

      {isUserFormModalOpen && (
        <AdminUserFormModal
          isOpen={isUserFormModalOpen}
          onClose={handleCloseUserFormModalAndRefresh}
          userToEdit={editingUser}
        />
      )}
      {userToDelete && (
        <ConfirmationModal
          isOpen={isConfirmDeleteModalOpen}
          onClose={() => setIsConfirmDeleteModalOpen(false)}
          onConfirm={confirmDeleteUser}
          title="Confirmer la Suppression"
          message={
            <p>Êtes-vous sûr de vouloir supprimer l'utilisateur <strong className="font-semibold">{userToDelete.name} ({userToDelete.email})</strong> ? Cette action est irréversible.</p>
          }
          confirmButtonText="Supprimer Utilisateur"
          confirmButtonVariant="danger"
        />
      )}
    </div>
  );
};

export default AdminUserListView;