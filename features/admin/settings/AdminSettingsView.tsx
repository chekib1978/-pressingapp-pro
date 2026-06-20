
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../../App';
import { AppContextType, CompanyDetails, UserRole } from '../../../types';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import { ExclamationTriangleIcon, CheckCircleIcon } from '../../../components/icons/HeroIcons';

const AdminSettingsView: React.FC = () => {
  const context = useContext(AppContext) as AppContextType | null;
  
  const [localSettings, setLocalSettings] = useState<CompanyDetails | null>(null);
  const [isLoadingView, setIsLoadingView] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (context?.companySettings) {
      setLocalSettings(context.companySettings);
      setIsLoadingView(false);
    } else if (context && !context.isLoading) { 
      setLocalSettings(context.companySettings); 
      setIsLoadingView(false);
      if (!context.companySettings) {
          setError("Les paramètres de l'entreprise n'ont pas pu être chargés. Veuillez réessayer ou contacter le support.");
      }
    }
  }, [context?.companySettings, context?.isLoading]);


  if (!context || context.currentUser?.role !== UserRole.ADMIN) {
    return <p className="p-4 text-red-600 text-center">Accès refusé. Cette section est réservée aux administrateurs.</p>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (localSettings) {
      setLocalSettings({
        ...localSettings,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localSettings || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await context.updateCompanySettings(localSettings);
      setSuccessMessage("Paramètres de l'entreprise mis à jour avec succès !");
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la sauvegarde des paramètres.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoadingView && !context?.companySettings) {
    return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            <p className="ml-3 text-slate-600">Chargement des paramètres...</p>
        </div>
    );
  }

  if (!localSettings && !isLoadingView) { 
     return (
        <div className="p-6 bg-red-50 border border-red-300 rounded-lg text-red-700">
            <h3 className="font-semibold text-lg mb-2">Erreur Critique</h3>
            <p>Impossible de charger les paramètres de l'entreprise. L'application pourrait ne pas fonctionner correctement.</p>
            <p>Vérifiez les logs de la console pour plus de détails ou essayez de recharger.</p>
        </div>
     );
  }


  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-xl space-y-6">
      <h2 className="text-2xl font-semibold text-slate-800 border-b pb-4">Paramètres de l'Entreprise</h2>
      
      {error && (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-300 flex items-start" role="alert">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">Erreur:</span> {error}
          </div>
        </div>
      )}
      {successMessage && (
        <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg border border-green-300 flex items-start" role="alert">
          <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">Succès:</span> {successMessage}
          </div>
        </div>
      )}

      {localSettings && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nom de l'entreprise"
            name="name"
            value={localSettings.name}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
          <Input
            label="Adresse Ligne 1"
            name="addressLine1"
            value={localSettings.addressLine1}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
          <Input
            label="Adresse Ligne 2 (Optionnel)"
            name="addressLine2"
            value={localSettings.addressLine2 || ''}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          <Input
            label="Numéro de téléphone"
            name="phone"
            type="tel"
            value={localSettings.phone}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
          <Input
            label="Email (Optionnel)"
            name="email"
            type="email"
            value={localSettings.email || ''}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          {/* Input pour le site web supprimé
          <Input
            label="Site Web (Optionnel)"
            name="website"
            type="url"
            value={localSettings.website || ''}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          */}
          <div>
            <label htmlFor="receiptFooterMessage" className="block text-sm font-medium text-slate-700 mb-1">
              Message en Pied de Page du Ticket (Optionnel)
            </label>
            <textarea
              id="receiptFooterMessage"
              name="receiptFooterMessage"
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
              value={localSettings.receiptFooterMessage || ''}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="pt-4 border-t">
            <Button type="submit" variant="primary" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Sauvegarde en cours...' : 'Sauvegarder les Paramètres'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminSettingsView;