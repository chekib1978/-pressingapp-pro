import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../App';
import { Order, OrderStatus, LogActionType, AppContextType, UserRole } from '../../types';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import { EyeIcon, TrashIcon, CheckCircleIcon, CurrencyEuroIcon } from '../../components/icons/HeroIcons';
import OrderDetailsModal from './components/OrderDetailsModal';
import { ORDER_STATUS_OPTIONS } from '../../constants';
import Select from '../../components/common/Select';
import ConfirmationModal from '../../components/common/ConfirmationModal';

const getStatusBadgeClass = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.RECEIVED: return 'bg-blue-100 text-blue-700';
    case OrderStatus.PROCESSING: return 'bg-yellow-100 text-yellow-700';
    case OrderStatus.READY_FOR_PICKUP: return 'bg-purple-100 text-purple-700';
    case OrderStatus.DELIVERED: return 'bg-green-100 text-green-700';
    case OrderStatus.PAID: return 'bg-teal-100 text-teal-700';
    case OrderStatus.CANCELLED: return 'bg-red-100 text-red-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

const OrdersView: React.FC = () => {
  const context = useContext(AppContext) as AppContextType | null;
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  if (!context) return <p>Chargement du contexte...</p>;
  const { orders, isLoading, appError, setAppError, currentUser } = context;

  const filteredOrders = useMemo(() => {
    return orders.filter((order) =>
      (order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.created_by_user_name && order.created_by_user_name.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (statusFilter === '' || order.status === statusFilter)
    );
  }, [orders, searchTerm, statusFilter]);

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  const handleDeleteRequest = (order: Order) => {
    setOrderToDelete(order);
    setIsConfirmDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (orderToDelete && context) {
      try {
        await context.deleteOrder(orderToDelete.id);
        setAppError(null);
      } catch (error: any) {
        console.error('Erreur lors de la suppression de la commande:', error);
      } finally {
        setIsConfirmDeleteModalOpen(false);
        setOrderToDelete(null);
      }
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (order && context) {
      const statusUpdateNote = `Statut change de '${order.status}' a '${newStatus}'.`;
      const newStatusUpdate = { status: newStatus, timestamp: new Date().toISOString(), notes: statusUpdateNote };

      const isNowPaid = newStatus === OrderStatus.PAID;
      const updatedOrderData: Order = {
        ...order,
        status: newStatus,
        status_history: [...order.status_history, newStatusUpdate],
        is_paid: isNowPaid ? true : order.is_paid,
      };

      const logInfo = {
        action_type: LogActionType.ORDER_STATUS_UPDATED,
        description: `Commande ${order.order_number}: ${statusUpdateNote}`,
      };
      const shouldPrintReceipt = isNowPaid && !order.is_paid;
      await context.updateOrder(updatedOrderData, logInfo, shouldPrintReceipt);
    }
  };

  const handlePaymentToggle = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (order && context) {
      const newPaidStatus = !order.is_paid;
      const paymentNote = newPaidStatus ? 'Paiement marque comme recu.' : 'Paiement marque comme non recu.';

      const paymentStatusUpdate = {
        status: order.status,
        timestamp: new Date().toISOString(),
        notes: paymentNote,
      };

      let finalStatus = order.status;
      if (newPaidStatus && ![OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.PAID].includes(order.status)) {
        finalStatus = OrderStatus.PAID;
      }

      const updatedOrderData: Order = {
        ...order,
        is_paid: newPaidStatus,
        status: finalStatus,
        status_history: [...order.status_history, paymentStatusUpdate],
      };

      let logInfo = {
        action_type: LogActionType.ORDER_PAID_STATUS_CHANGED,
        description: `Commande ${order.order_number}: ${paymentNote}`,
      };
      const shouldPrintReceipt = newPaidStatus;

      if (finalStatus === OrderStatus.PAID && order.status !== OrderStatus.PAID) {
        const paidStatusNote = 'Statut change a Paye suite au paiement.';
        updatedOrderData.status_history.push({ status: OrderStatus.PAID, timestamp: new Date().toISOString(), notes: paidStatusNote });
        logInfo = {
          action_type: LogActionType.ORDER_STATUS_UPDATED,
          description: `Commande ${order.order_number}: ${paidStatusNote}`,
        };
      }
      await context.updateOrder(updatedOrderData, logInfo, shouldPrintReceipt);
    }
  };

  const renderOrderActions = (item: Order) => (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleViewDetails(item); }} title="Voir details" className="px-3">
        <EyeIcon className="h-5 w-5 text-sky-500" />
      </Button>
      <Select
        value={item.status}
        onChange={(e) => { e.stopPropagation(); handleStatusChange(item.id, e.target.value as OrderStatus); }}
        options={ORDER_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
        className="min-w-[148px] text-sm"
        containerClassName="mb-0 inline-block"
        onClick={(e: React.MouseEvent<HTMLSelectElement>) => e.stopPropagation()}
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => { e.stopPropagation(); handlePaymentToggle(item.id); }}
        title={item.is_paid ? 'Marquer comme non paye' : 'Marquer comme paye'}
        className={`${item.is_paid ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'} px-3`}
      >
        <CurrencyEuroIcon className="h-5 w-5" />
      </Button>
      {currentUser?.role === UserRole.ADMIN && (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteRequest(item); }} title="Supprimer" className="px-3">
          <TrashIcon className="h-5 w-5 text-red-500" />
        </Button>
      )}
    </div>
  );

  const columns = [
    { header: 'N° Commande', accessor: 'order_number' as keyof Order, className: 'font-mono' },
    { header: 'Client', accessor: 'client_name' as keyof Order },
    { header: 'Date Commande', accessor: (item: Order) => new Date(item.order_date).toLocaleDateString('fr-FR'), className: 'text-sm' },
    {
      header: 'Statut',
      accessor: (item: Order) => (
        <span className={`inline-flex min-h-[32px] items-center px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(item.status)}`}>
          {item.status}
        </span>
      )
    },
    { header: 'Cree par', accessor: 'created_by_user_name' as keyof Order, className: 'text-xs text-slate-500' },
    { header: 'Montant Total', accessor: (item: Order) => `${item.total_amount.toFixed(2)} TND`, className: 'text-right font-medium' },
    { header: 'Paye', accessor: (item: Order) => (item.is_paid ? <CheckCircleIcon className="h-5 w-5 text-green-500" /> : <CurrencyEuroIcon className="h-5 w-5 text-slate-400" />) },
    {
      header: 'Actions',
      accessor: (item: Order) => <div className="flex justify-end">{renderOrderActions(item)}</div>,
      className: 'text-right'
    },
  ];

  if (isLoading && orders.length === 0 && !appError) {
    return <p>Chargement des commandes...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0 md:space-x-4">
        <h2 className="text-xl font-semibold text-slate-700">Gestion des Commandes ({filteredOrders.length})</h2>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Rechercher par N°, Client, Cree par..."
            className="min-h-[48px] px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm text-base focus:outline-none focus:ring-brand-primary focus:border-brand-primary md:w-72"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
            options={[{ value: '', label: 'Tous les statuts' }, ...ORDER_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))]}
            className="md:w-56"
            containerClassName="mb-0"
          />
        </div>
      </div>

      <div className="space-y-4 xl:hidden">
        {isLoading && filteredOrders.length > 0 && <p className="text-slate-500">Chargement...</p>}
        {!isLoading && filteredOrders.length === 0 && (
          <div className="rounded-xl bg-white p-6 text-center text-slate-500 shadow">
            Aucune commande trouvee. Creez une nouvelle commande pour commencer !
          </div>
        )}
        {filteredOrders.map((order) => (
          <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-semibold text-slate-800">{order.order_number}</span>
                  <span className={`inline-flex min-h-[32px] items-center px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <p className="text-base font-medium text-slate-700">{order.client_name}</p>
                <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <p>Date: {new Date(order.order_date).toLocaleDateString('fr-FR')}</p>
                  <p>Total: <span className="font-semibold text-slate-800">{order.total_amount.toFixed(2)} TND</span></p>
                  <p>Paiement: <span className={order.is_paid ? 'font-semibold text-green-600' : 'font-semibold text-slate-600'}>{order.is_paid ? 'Paye' : 'Non paye'}</span></p>
                  <p>Cree par: {order.created_by_user_name || 'N/A'}</p>
                </div>
              </div>
              <Button variant="secondary" size="md" onClick={() => handleViewDetails(order)} className="sm:min-w-[170px]">
                Voir la commande
              </Button>
            </div>
            <div className="mt-4 border-t border-slate-200 pt-4">
              {renderOrderActions(order)}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden xl:block">
        <Table<Order>
          columns={columns}
          data={filteredOrders}
          onRowClick={handleViewDetails}
          isLoading={isLoading && orders.length > 0 && !appError}
          emptyStateMessage="Aucune commande trouvee. Creez une nouvelle commande pour commencer !"
        />
      </div>

      {selectedOrder && (
        <OrderDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          order={selectedOrder}
          onUpdateStatus={handleStatusChange}
          onPaymentToggle={handlePaymentToggle}
        />
      )}
      {orderToDelete && (
        <ConfirmationModal
          isOpen={isConfirmDeleteModalOpen}
          onClose={() => setIsConfirmDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Confirmer la suppression"
          message={<p>Etes-vous sur de vouloir supprimer la commande <strong className="font-semibold">{orderToDelete.order_number}</strong> ? Cette action est irreversible.</p>}
          confirmButtonText="Supprimer"
          confirmButtonVariant="danger"
        />
      )}
    </div>
  );
};

export default OrdersView;
