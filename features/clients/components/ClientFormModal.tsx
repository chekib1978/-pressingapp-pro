
import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../../App';
import { Client } from '../../../types';
import Modal from '../../../components/common/Modal';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client;
}

const ClientFormModal: React.FC<ClientFormModalProps> = ({ isOpen, onClose, client }) => {
  const context = useContext(AppContext);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string, form?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (client) {
      setName(client.name);
      setPhone(client.phone);
      setEmail(client.email || '');
    } else {
      setName('');
      setPhone('');
      setEmail('');
    }
    setErrors({});
    setIsSubmitting(false);
  }, [isOpen, client]);

  if (!context) return null;
  const { addClient, updateClient } = context;

  const validate = (): boolean => {
    const newErrors: { name?: string; phone?: string; email?: string } = {};
    if (!name.trim()) newErrors.name = "Le nom est requis.";
    if (!phone.trim()) newErrors.phone = "Le téléphone est requis.";
    // Basic phone validation, can be improved for specific formats if needed
    else if (!/^\+?[0-9\s-()]{7,20}$/.test(phone)) newErrors.phone = "Numéro de téléphone invalide.";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Format d'email invalide.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    const clientData = { 
        name: name.trim(), 
        phone: phone.trim(), 
        email: email.trim() || undefined // Store as undefined if empty, Supabase will make it null
    };

    try {
        if (client) {
            // Pass the full client object for update, Supabase will use the 'id'
            await updateClient({ ...client, ...clientData });
        } else {
            await addClient(clientData);
        }
        onClose();
    } catch (error) {
        console.error("Failed to save client:", error);
        setErrors(prev => ({ ...prev, form: "Erreur lors de l'enregistrement du client."}));
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={client ? "Modifier le Client" : "Ajouter un Client"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nom complet"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
          disabled={isSubmitting}
        />
        <Input
          label="Numéro de téléphone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          error={errors.phone}
          required
          disabled={isSubmitting}
        />
        <Input
          label="Email (Optionnel)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          disabled={isSubmitting}
        />
        {errors.form && <p className="text-xs text-red-600">{errors.form}</p>}
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (client ? 'Mise à jour...' : 'Ajout...') : (client ? 'Mettre à jour' : 'Ajouter')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ClientFormModal;