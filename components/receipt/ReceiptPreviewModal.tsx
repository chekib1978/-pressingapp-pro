import React from 'react';
import { Order, CompanyDetails, User } from '../../types';
import Modal from '../common/Modal';
import Button from '../common/Button';
import ReceiptTemplate from './ReceiptTemplate';
import { PrinterIcon } from '../icons/HeroIcons'; 

interface ReceiptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  companyDetails: CompanyDetails;
  currentUser: User | null;
  onPrint: () => void;
}

const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  isOpen,
  onClose,
  order,
  companyDetails,
  currentUser,
  onPrint,
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Aperçu Ticket: ${order.order_number}`} size="md">
      <div className="space-y-4">
        <div 
            className="bg-white p-1 border border-slate-300 shadow-inner overflow-y-auto max-h-[60vh] mx-auto"
            // The width is controlled by the content of ReceiptTemplate, 
            // but we can set a max-width for the container if needed.
            // The ReceiptTemplate itself has width: 72mm in its styles.
            style={{ width: '80mm' }} 
        >
          {/* Directly render ReceiptTemplate for the preview */}
          {/* The ReceiptTemplate includes its own <style> tag for print layout */}
          <ReceiptTemplate order={order} companyDetails={companyDetails} currentUser={currentUser} />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
          <Button variant="primary" onClick={onPrint} leftIcon={<PrinterIcon className="h-5 w-5" />}>
            Imprimer
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReceiptPreviewModal;