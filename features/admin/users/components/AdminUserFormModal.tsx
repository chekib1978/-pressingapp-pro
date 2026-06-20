
import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../../../App';
import { User, UserRole, UserInsert, UserUpdate, AppContextType } from '../../../../types';
import Modal from '../../../../components/common/Modal';
import Input from '../../../../components/common/Input';
import Select from '../../../../components/common/Select';
import Button from '../../../../components/common/Button';
import { USER_ROLE_OPTIONS } from '../../../../constants';
import { ExclamationTriangleIcon } from '../../../../components/icons/HeroIcons';

interface AdminUserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: User; 
}

const AdminUserFormModal: React.FC<AdminUserFormModalProps> = ({ isOpen, onClose, userToEdit }) => {
  const context = useContext(AppContext) as AppContextType | null;
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.OPERATOR);
  
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string; role?: string; api?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name);
      setEmail(userToEdit.email);
      setRole(userToEdit.role);
      setPassword(''); 
      setConfirmPassword('');
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRole(UserRole.OPERATOR);
    }
    setFormErrors({});
    setIsSubmitting(false);
  }, [isOpen, userToEdit]);

  if (!context) return null; // Ou un message d'erreur/chargement
  const { adminCreateNewUser, adminUpdateExistingUser } = context;

  const validate = (): boolean => {
    const newErrors: typeof formErrors = {};
    if (!name.trim()) newErrors.name = "Le nom est requis.";
    if (!email.trim()) newErrors.email = "L'email ou l'identifiant est requis.";
    // Pas de validation de format email pour permettre des identifiants simples.

    if (!userToEdit) { // Nouvel utilisateur
      if (!password) newErrors.password = "Le mot de passe est requis.";
      else if (password.length < 6) newErrors.password = "Le mot de passe doit faire au moins 6 caractères.";
      if (password !== confirmPassword) newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
    } else if (password) { // Modification avec changement de mot de passe
      if (password.length < 6) newErrors.password = "Le mot de passe doit faire au moins 6 caractères.";
      if (password !== confirmPassword) newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
    }
    
    if (!role) newErrors.role = "Le rôle est requis.";

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFormErrors(prev => ({ ...prev, api: undefined })); 

    const commonUserData = {
        name: name.trim(),
        email: email.trim(),
        role,
    };

    try {
        if (userToEdit) { // Modification
            const updatePayload: UserUpdate = { ...commonUserData, id: userToEdit.id };
            if (password) { 
                updatePayload.password = password;
            }
            await adminUpdateExistingUser(userToEdit.id, updatePayload);
        } else { // Création
            const insertPayload: UserInsert = { ...commonUserData, password: password };
            await adminCreateNewUser(insertPayload);
        }
        onClose(); // Ferme le modal et rafraîchit la liste dans la vue parente
    } catch (error: any) {
        console.error("AdminUserFormModal: Failed to save user:", error);
        setFormErrors(prev => ({ ...prev, api: error.message || "Erreur lors de l'enregistrement."}));
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={userToEdit ? "Modifier l'Utilisateur" : "Ajouter un Nouvel Utilisateur"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nom complet"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={formErrors.name}
          required
          disabled={isSubmitting}
          autoComplete="name"
        />
        <Input
          label="Email (ou identifiant de connexion)"
          type="text" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={formErrors.email}
          required
          disabled={isSubmitting}
          autoComplete="email"
        />
        <Input
          label={userToEdit ? "Nouveau Mot de Passe (laisser vide pour ne pas changer)" : "Mot de Passe"}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={formErrors.password}
          required={!userToEdit} 
          disabled={isSubmitting}
          autoComplete="new-password"
        />
        {(password || !userToEdit) && ( 
            <Input
            label="Confirmer le Mot de Passe"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={formErrors.confirmPassword}
            required={!userToEdit || !!password}
            disabled={isSubmitting}
            autoComplete="new-password"
            />
        )}
        
        <Select
          label="Rôle"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          options={USER_ROLE_OPTIONS}
          error={formErrors.role}
          required
          disabled={isSubmitting}
        />

        {formErrors.api && (
            <div className="p-3 my-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{formErrors.api}</span>
            </div>
        )}
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 mt-6">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (userToEdit ? 'Mise à jour...' : 'Ajout...') : (userToEdit ? 'Mettre à jour' : 'Ajouter Utilisateur')}
          </Button>
        </div>
      </form>
      <p className="text-xs text-slate-500 mt-6 text-center">
        Note: Les mots de passe sont gérés en clair dans cette configuration. 
        Pour la production, une solution de hachage sécurisé est indispensable.
      </p>
    </Modal>
  );
};

export default AdminUserFormModal;