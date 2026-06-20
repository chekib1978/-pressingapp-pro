import React, { useState, useContext } from 'react';
import { AppContext } from '../../App';
import { AppContextType } from '../../types';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Cog6ToothIcon, ExclamationTriangleIcon } from '../../components/icons/HeroIcons';
import { APP_NAME } from '../../constants';
import pressingBackground from '../../pressing.jpg';

const AuthView: React.FC = () => {
  const context = useContext(AppContext) as AppContextType | null;
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!context) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-light-bg p-6">
        <p>Initialisation du module d'authentification...</p>
      </div>
    );
  }
  const { login, appError: globalAppError } = context;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier || !password) {
      setError("L'identifiant et le mot de passe sont requis.");
      return;
    }
    setIsLoading(true);
    const success = await login(identifier, password);
    setIsLoading(false);
    if (!success && !globalAppError) {
      setError(context.appError || "Échec de la connexion. Vérifiez vos identifiants.");
    }
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen w-screen p-6"
      style={{
        width: '100vw',
        backgroundImage: `url(${pressingBackground})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-[1px]" />
      <div className="relative w-full max-w-md p-8 space-y-6 bg-white/95 rounded-xl shadow-2xl border border-white/40">
        <div className="text-center">
          <Cog6ToothIcon className="mx-auto h-16 w-16 text-brand-primary mb-3" />
          <h1 className="text-3xl font-bold text-dark-text">{APP_NAME}</h1>
          <p className="mt-2 text-medium-text">Connectez-vous pour accéder à votre espace.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email ou nom d'utilisateur"
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="admin / votre@email.com"
            required
            disabled={isLoading}
            autoComplete="username"
          />
          <Input
            label="Mot de passe"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isLoading}
            autoComplete="current-password"
          />

          {(error || globalAppError) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error || globalAppError}</span>
            </div>
          )}

          <div>
            <Button type="submit" className="w-full text-base" variant="primary" size="lg" disabled={isLoading}>
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-r-2 border-white mr-2"></div>
              ) : null}
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </div>
        </form>
        <p className="text-xs text-slate-500 text-center mt-8">
          En cas de problème, contactez votre administrateur.
        </p>
      </div>
    </div>
  );
};

export default AuthView;
