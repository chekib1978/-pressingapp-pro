import React from 'react';
import { Order, OrderItem, OrderStatus, OrderStatusUpdate } from '../../../types';
import Modal from '../../../components/common/Modal';
import Button from '../../../components/common/Button';
import Select from '../../../components/common/Select';
import { ORDER_STATUS_OPTIONS, buildArticleDisplayName, resolveArticleClassification } from '../../../constants';
import { CheckCircleIcon, CurrencyEuroIcon, ClockIcon, UserCircleIcon } from '../../../components/icons/HeroIcons';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  onPaymentToggle: (orderId: string) => void;
}

const getStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.RECEIVED: return 'text-blue-600';
    case OrderStatus.PROCESSING: return 'text-yellow-600';
    case OrderStatus.READY_FOR_PICKUP: return 'text-purple-600';
    case OrderStatus.DELIVERED: return 'text-green-600';
    case OrderStatus.PAID: return 'text-teal-600';
    case OrderStatus.CANCELLED: return 'text-red-600';
    default: return 'text-slate-600';
  }
};

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ isOpen, onClose, order, onUpdateStatus, onPaymentToggle }) => {
  if (!isOpen) return null;

  const getDisplayArticleName = (item: OrderItem): string => {
    const classification = resolveArticleClassification({ name: item.articleName, category: item.articleName });
    return buildArticleDisplayName(classification.category, classification.subcategory);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Détails commande: ${order.order_number}`} size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
          <div>
            <h4 className="text-sm font-medium text-slate-500">Client</h4>
            <p className="text-lg font-semibold text-slate-800">{order.client_name}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-500">Date de commande</h4>
            <p className="text-slate-700">{new Date(order.order_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-500">Date de retour prévue</h4>
            <p className="text-slate-700">{order.due_date ? new Date(order.due_date).toLocaleDateString('fr-FR') : 'Non spécifiée'}</p>
          </div>
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-medium text-slate-500">Statut actuel:</h4>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full bg-opacity-20 ${getStatusColor(order.status).replace('text-', 'bg-')}`}>
              {order.status}
            </span>
          </div>
          {order.created_by_user_name && (
            <div className="md:col-span-2">
              <h4 className="text-sm font-medium text-slate-500">Commande créée par</h4>
              <p className="text-slate-700 flex items-center">
                <UserCircleIcon className="h-4 w-4 mr-1 text-slate-400" />
                {order.created_by_user_name}
              </p>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-md font-semibold text-slate-700 mb-2">Articles</h4>
          <ul className="divide-y divide-slate-200 border border-slate-200 rounded-md">
            {order.items.map((item: OrderItem, index: number) => (
              <li key={index} className="flex justify-between items-center p-4 hover:bg-slate-50">
                <div>
                  <span className="font-medium text-slate-800">{getDisplayArticleName(item)}</span>
                  <span className="text-sm text-slate-500 ml-2">(x{item.quantity})</span>
                </div>
                <span className="text-slate-700">{(item.quantity * item.unitPrice).toFixed(2)} TND</span>
              </li>
            ))}
          </ul>
          <div className="text-right mt-3 pr-3">
            <span className="text-lg font-bold text-slate-800">Total: {order.total_amount.toFixed(2)} TND</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-50 rounded-md">
          <div>
            <h4 className="text-sm font-medium text-slate-500">Statut du paiement</h4>
            {order.is_paid ? (
              <span className="flex items-center text-green-600 font-semibold"><CheckCircleIcon className="h-5 w-5 mr-1" /> Payé</span>
            ) : (
              <span className="flex items-center text-red-600 font-semibold"><CurrencyEuroIcon className="h-5 w-5 mr-1" /> Non payé</span>
            )}
          </div>
          <Button
            variant={order.is_paid ? "danger" : "primary"}
            size="md"
            onClick={() => onPaymentToggle(order.id)}
          >
            {order.is_paid ? "Marquer non payé" : "Marquer payé"}
          </Button>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <h4 className="text-md font-semibold text-slate-700 mb-2">Changer le statut</h4>
          <Select
            value={order.status}
            onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
            options={ORDER_STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
            containerClassName="mb-0"
          />
        </div>

        <div>
          <h4 className="text-md font-semibold text-slate-700 mb-2">Historique des statuts</h4>
          <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-md p-3 bg-slate-50 space-y-2">
            {order.status_history.slice().reverse().map((update: OrderStatusUpdate, index: number) => (
              <div key={index} className="flex items-start text-sm">
                <ClockIcon className={`h-4 w-4 mr-2 mt-0.5 ${getStatusColor(update.status)}`} />
                <div>
                  <span className={`font-medium ${getStatusColor(update.status)}`}>{update.status}</span>
                  <span className="text-slate-500 ml-2">
                    - {new Date(update.timestamp).toLocaleString('fr-FR')}
                  </span>
                  {update.notes && <p className="text-xs text-slate-400 italic">{update.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default OrderDetailsModal;
