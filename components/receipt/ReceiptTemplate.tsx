
import React from 'react';
import { Order, CompanyDetails, User, OrderItem } from '../../types';
import { buildArticleDisplayName, resolveArticleClassification } from '../../constants';

interface ReceiptTemplateProps {
  order: Order;
  companyDetails: CompanyDetails;
  currentUser: User | null;
}

const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({ order, companyDetails, currentUser }) => {
  const now = new Date();

  const getDisplayArticleName = (item: OrderItem): string => {
    const classification = resolveArticleClassification({ name: item.articleName, category: item.articleName });
    return buildArticleDisplayName(classification.category, classification.subcategory);
  };

  const styles = `
    /* STYLES FOR MODAL PREVIEW (width: 72mm here defines the preview box size) */
    .receipt-content-formodal {
      font-family: 'Arial', Helvetica, sans-serif; /* Changed for better preview readability */
      font-size: 10pt; /* Standard for receipts */
      color: #000;
      margin: 0 auto; /* Center in modal if modal is wider */
      padding: 5mm; /* Padding for preview */
      width: 72mm; /* Effective width of the receipt paper for preview */
      box-sizing: border-box;
      background-color: #fff; /* Ensure background for preview */
      line-height: 1.3;
    }
    .receipt-content-formodal .receipt-header, .receipt-content-formodal .receipt-footer {
      text-align: center;
      margin-bottom: 3mm;
    }
    .receipt-content-formodal .receipt-header h1 {
      font-size: 12pt; /* Kept for modal preview */
      margin: 0 0 1.5mm 0;
      font-weight: bold;
    }
    .receipt-content-formodal .receipt-header p {
      margin: 0.5mm 0;
      font-size: 8.5pt; /* Adjusted for modal preview */
    }
    .receipt-content-formodal .section-title {
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
      padding: 1mm 0;
      margin: 2mm 0;
      text-align: center;
      font-weight: bold;
      font-size: 9pt; 
    }
    .receipt-content-formodal .info-grid {
      display: grid;
      grid-template-columns: auto 1fr; /* Label and value */
      gap: 0.5mm 2mm;
      font-size: 9pt; /* Kept for modal preview */
      margin-bottom: 2mm;
    }
    .receipt-content-formodal .info-grid dt {
      font-weight: normal;
    }
    .receipt-content-formodal .info-grid dd {
      font-weight: bold;
    }
    .receipt-content-formodal .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 2mm;
    }
    .receipt-content-formodal .items-table th, .receipt-content-formodal .items-table td {
      text-align: left;
      padding: 0.5mm 0;
      font-size: 9pt; /* Kept for modal preview */
      vertical-align: top;
    }
    .receipt-content-formodal .items-table th:nth-child(2), .receipt-content-formodal .items-table td:nth-child(2),
    .receipt-content-formodal .items-table th:nth-child(3), .receipt-content-formodal .items-table td:nth-child(3) {
      text-align: right;
    }
    .receipt-content-formodal .items-table .total-line td {
      border-top: 1px solid #000;
      font-weight: bold;
      padding-top: 1mm;
    }
    .receipt-content-formodal .text-right { text-align: right; }
    .receipt-content-formodal .text-center { text-align: center; }
    .receipt-content-formodal .small-text { font-size: 8.5pt; } /* Adjusted for modal preview */
    .receipt-content-formodal hr.dashed {
      border: none;
      border-top: 1px dashed #000;
      margin: 2mm 0;
    }

    /* STYLES FOR PRINTING */
    @media print {
      body, html {
        margin: 0 !important;
        padding: 0 !important;
        width: 72mm !important; 
        min-height: initial !important; 
        height: auto !important; 
        background-color: #fff !important;
        overflow: hidden !important; 
        -webkit-print-color-adjust: exact !important; 
        print-color-adjust: exact !important;
        font-family: 'Arial', Helvetica, sans-serif !important; /* Changed for print readability */
      }
      .receipt-content-formodal {
        width: 100% !important; 
        margin: 0 !important;
        padding: 3mm 1mm 1mm 1mm !important; 
        box-shadow: none !important;
        border: none !important;
        background-color: #fff !important; 
        font-size: 10pt !important; /* Increased base font size for print */
        line-height: 1.3 !important; /* Increased line-height for print */
      }
      .receipt-content-formodal .receipt-header h1 {
        font-size: 12pt !important; /* Increased for print */
      }
      .receipt-content-formodal .receipt-header p,
      .receipt-content-formodal .small-text {
        font-size: 8.5pt !important; /* Increased for print */
      }
      .receipt-content-formodal .info-grid,
      .receipt-content-formodal .section-title,
      .receipt-content-formodal .items-table th, 
      .receipt-content-formodal .items-table td {
        font-size: 9.5pt !important; /* Increased for print */
      }
      
      body > .receipt-content-formodal:only-child {
        page-break-after: always;
      }

      body > *:not(.receipt-content-formodal) {
        display: none !important;
      }

      @page {
        size: 72mm auto; 
        margin: 0mm; 
      }
    }
  `;

  return (
    <div className="receipt-content-formodal">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      <div className="receipt-header">
        <h1>{companyDetails.name}</h1>
        <p>{companyDetails.addressLine1}</p>
        {companyDetails.addressLine2 && <p>{companyDetails.addressLine2}</p>}
        <p>Tél: {companyDetails.phone}</p>
        {companyDetails.email && <p>Email: {companyDetails.email}</p>}
      </div>

      <dl className="info-grid">
        <dt>N° Ticket:</dt> <dd>{order.order_number}</dd>
        <dt>Date:</dt> <dd>{now.toLocaleDateString('fr-FR')} {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</dd>
        <dt>Client:</dt> <dd>{order.client_name}</dd>
        {currentUser && <><dt>Opérateur:</dt> <dd>{currentUser.name || currentUser.email}</dd></>}
      </dl>

      <div className="section-title">DÉTAILS</div>

      <table className="items-table">
        <thead>
          <tr>
            <th>Article</th>
            <th className="text-right">Qté x PU</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item: OrderItem, index: number) => (
            <tr key={index}>
              <td>{getDisplayArticleName(item)}</td>
              <td className="text-right">{item.quantity} x {item.unitPrice.toFixed(2)}</td>
              <td className="text-right">{(item.quantity * item.unitPrice).toFixed(2)}</td>
            </tr>
          ))}
          <tr className="total-line">
            <td colSpan={2}>TOTAL PAYÉ (TND)</td>
            <td className="text-right">{order.total_amount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      
      {order.status !== "Payé" && !order.is_paid && (
          <p className="text-center small-text" style={{color: 'red', fontWeight: 'bold'}}>
              NOTE: Ce ticket est généré AVANT paiement complet.
          </p>
      )}

      {companyDetails.receiptFooterMessage && (
        <div className="receipt-footer">
          <hr className="dashed" />
          <p className="small-text">{companyDetails.receiptFooterMessage}</p>
        </div>
      )}
    </div>
  );
};

export default ReceiptTemplate;
