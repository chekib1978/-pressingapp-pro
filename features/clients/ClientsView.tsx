import React, { useContext, useState } from 'react';
import { AppContext } from '../../App';
import { Client, AppContextType, UserRole } from '../../types';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { PencilSquareIcon, TrashIcon } from '../../components/icons/HeroIcons';
import ConfirmationModal from '../../components/common/ConfirmationModal';

interface ClientsViewProps {
  onEdit: (client: Client) => void;
}

const ClientsView: React.FC<ClientsViewProps> = ({ onEdit }) => {
  const context = useContext(AppContext) as AppContextType | null;
  const [searchTerm, setSearchTerm] = useState('');
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  if (!context) return <p>Chargement du contexte...</p>;
  const { clients, isLoading, appError, setAppError, currentUser } = context;

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDeleteRequest = (client: Client) => {
    setClientToDelete(client);
    setIsConfirmDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (clientToDelete && context) {
      try {
        await context.deleteClient(clientToDelete.id);
        setAppError(null);
      } catch (error: any) {
        console.error('Erreur lors de la suppression du client:', error);
      } finally {
        setIsConfirmDeleteModalOpen(false);
        setClientToDelete(null);
      }
    }
  };

  const renderClientActions = (item: Client) => (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="px-4">
        <PencilSquareIcon className="h-5 w-5 text-white" />
      </Button>
      {currentUser?.role === UserRole.ADMIN && (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteRequest(item); }} className="px-4">
          <TrashIcon className="h-5 w-5 text-red-500" />
        </Button>
      )}
    </div>
  );

  const columns = [
    { header: 'Nom', accessor: 'name' as keyof Client, className: 'font-medium' },
    { header: 'Telephone', accessor: 'phone' as keyof Client },
    { header: 'Email', accessor: 'email' as keyof Client, className: 'text-slate-600' },
    {
      header: 'Actions',
      accessor: (item: Client) => <div className="flex justify-end">{renderClientActions(item)}</div>,
      className: 'text-right'
    },
  ];

  if (isLoading && clients.length === 0 && !appError) {
    return <p>Chargement des clients...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <h2 className="text-xl font-semibold text-slate-700">Gestion des Clients ({filteredClients.length})</h2>
        <input
          type="text"
          placeholder="Rechercher par nom, telephone, email..."
          className="w-full md:w-[22rem] min-h-[48px] px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm text-base focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4 xl:hidden">
        {isLoading && filteredClients.length > 0 && <p className="text-slate-500">Chargement...</p>}
        {!isLoading && filteredClients.length === 0 && (
          <div className="rounded-xl bg-white p-6 text-center text-slate-500 shadow">
            Aucun client trouve. Ajoutez-en un pour commencer !
          </div>
        )}
        {filteredClients.map((client) => (
          <div key={client.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-lg font-semibold text-slate-800">{client.name}</p>
                <div className="space-y-1 text-sm text-slate-600">
                  <p>Telephone: <span className="font-medium text-slate-800">{client.phone}</span></p>
                  <p>Email: <span className="font-medium text-slate-800">{client.email || 'Non renseigne'}</span></p>
                </div>
              </div>
              {renderClientActions(client)}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden xl:block">
        <Table<Client>
          columns={columns}
          data={filteredClients}
          isLoading={isLoading && clients.length > 0 && !appError}
          emptyStateMessage="Aucun client trouve. Ajoutez-en un pour commencer !"
        />
      </div>

      {clientToDelete && (
        <ConfirmationModal
          isOpen={isConfirmDeleteModalOpen}
          onClose={() => setIsConfirmDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Confirmer la suppression"
          message={<p>Etes-vous sur de vouloir supprimer le client <strong className="font-semibold">{clientToDelete.name}</strong> ? Verifiez ses commandes actives. Cette action est irreversible.</p>}
          confirmButtonText="Supprimer"
          confirmButtonVariant="danger"
        />
      )}
    </div>
  );
};

export default ClientsView;
