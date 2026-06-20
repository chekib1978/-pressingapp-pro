
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../../App';
import { OperationLog, LogActionType } from '../../types';
import Table from '../../components/common/Table';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { ClockIcon, UserCircleIcon, HashtagIcon, DocumentTextIcon } from '../../components/icons/HeroIcons'; 

const getActionTypeColor = (actionType: LogActionType): string => {
  if (actionType.includes('CREATED') || actionType.includes('créé') || actionType.includes('créée')) return 'text-green-600'; // Adjusted for enum values
  if (actionType.includes('UPDATED') || actionType.includes('MODIFIED') || actionType.includes('mis à jour') || actionType.includes('modifiée')) return 'text-blue-600';
  if (actionType.includes('DELETED') || actionType.includes('supprimé')) return 'text-red-600';
  return 'text-slate-600';
};

const HistoryView: React.FC = () => {
  const context = useContext(AppContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState<LogActionType | ''>('');

  if (!context) {
    return <div className="p-6 text-center text-slate-500">Chargement du contexte de l'historique...</div>;
  }
  const { operationLogs, isLoading, appError } = context;

  if (isLoading && !appError) {
    return <p>Chargement de l'historique des opérations...</p>;
  }
  if (appError && operationLogs.length === 0) { // Show error only if logs couldn't be loaded at all
      return <p className="text-red-500">Erreur de chargement de l'historique: {appError}</p>
  }


  const filteredLogs = useMemo(() => {
    return operationLogs // Already sorted newest first by AppContext Supabase query
      .filter(log => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const matchesSearch = 
          log.description.toLowerCase().includes(lowerSearchTerm) ||
          log.actor.toLowerCase().includes(lowerSearchTerm) ||
          (log.entity_id && log.entity_id.toLowerCase().includes(lowerSearchTerm)) ||
          log.entity_type.toLowerCase().includes(lowerSearchTerm);
        
        const matchesActionType = actionTypeFilter === '' || log.action_type === actionTypeFilter;
        
        return matchesSearch && matchesActionType;
      });
  }, [operationLogs, searchTerm, actionTypeFilter]);

  const columns = [
    { 
      header: 'Date & Heure', 
      accessor: (item: OperationLog) => (
        <div className="flex items-center">
          <ClockIcon className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />
          <span className="text-xs">
            {new Date(item.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            <br />
            {new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ),
      className: 'text-sm whitespace-nowrap' 
    },
    { 
      header: 'Acteur', 
      accessor: (item: OperationLog) => (
        <div className="flex items-center">
          <UserCircleIcon className="h-4 w-4 mr-2 text-slate-400 flex-shrink-0" />
          {item.actor}
        </div>
      ),
      className: 'text-sm'
    },
    { 
      header: 'Action', 
      accessor: (item: OperationLog) => (
        <span className={`font-medium ${getActionTypeColor(item.action_type)}`}>
          {item.action_type}
        </span>
      ),
      className: 'text-sm'
    },
    { 
      header: 'Entité', 
      accessor: (item: OperationLog) => (
        <div className="flex items-center text-xs">
          <HashtagIcon className="h-4 w-4 mr-1 text-slate-400 flex-shrink-0" />
          {item.entity_type} {item.entity_id && `(${item.entity_id.substring(0,8)}...)`}
        </div>
      ),
      className: 'text-sm text-slate-500' 
    },
    { 
      header: 'Description', 
      accessor: (item: OperationLog) => (
        <div className="flex items-start">
          <DocumentTextIcon className="h-4 w-4 mr-2 mt-0.5 text-slate-400 flex-shrink-0" />
          <span className="text-xs break-words max-w-md" title={item.description}>{item.description}</span>
        </div>
      ),
      className: 'text-sm' 
    },
  ];

  const actionTypeOptions = [{ value: '', label: 'Toutes les actions' }, ...Object.values(LogActionType).map(at => ({ value: at, label: at }))];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-800">Historique des Opérations</h2>
      
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0 md:space-x-4">
        <Input
          containerClassName="mb-0 w-full md:w-1/2 lg:w-1/3"
          placeholder="Rechercher dans l'historique..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          label="Recherche"
        />
        <Select
          label="Filtrer par type d'action"
          containerClassName="mb-0 w-full md:w-1/2 lg:w-1/3"
          options={actionTypeOptions}
          value={actionTypeFilter}
          onChange={(e) => setActionTypeFilter(e.target.value as LogActionType | '')}
        />
      </div>

      <Table<OperationLog>
        columns={columns}
        data={filteredLogs}
        isLoading={isLoading && operationLogs.length > 0} // Show table loading only if refreshing
        emptyStateMessage="Aucun historique d'opération trouvé."
      />
       <p className="text-xs text-slate-500 text-center mt-2">
        Affiche {filteredLogs.length} opérations correspondantes (sur un maximum de {operationLogs.length > 500 ? '500+' : operationLogs.length} enregistrées localement après chargement).
      </p>
    </div>
  );
};

export default HistoryView;