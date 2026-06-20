
import { createClient } from '@supabase/supabase-js';
import { Database } from './types'; // Assurez-vous que ce chemin est correct

// L'utilisateur a confirmé que ce sont ses VRAIES URL et clé, même si elles ressemblent aux exemples.
const supabaseUrl = process.env.SUPABASE_URL || 'https://ozlomllrfwigrqmfgitr.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96bG9tbGxyZndpZ3JxbWZnaXRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwOTc4MjIsImV4cCI6MjA2NTY3MzgyMn0.bwKqFIQY2ZGTgzgrrSCm2R-j66hlMot6a-vQrdyqgu8';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// --- Instructions pour la Configuration et la Sécurité (RLS) ---
// 1. Créez votre projet sur supabase.com.
// 2. Récupérez votre URL de projet et votre clé `anon public` (Project Settings > API).
// 3. Assurez-vous que les variables supabaseUrl et supabaseAnonKey ci-dessus correspondent à VOS informations.
//
// 4. Créez les tables nécessaires avec les scripts SQL fournis précédemment pour:
//    users, articles, clients, orders, operation_logs, company_application_settings.
//
// 5. Configurez la Sécurité au Niveau des Lignes (RLS) dans l'éditeur SQL de Supabase.
//    AVEC UN SYSTÈME D'AUTHENTIFICATION PERSONNALISÉ (comme celui de cette application) :
//    - Votre application se connecte à Supabase en utilisant la clé `anon`.
//    - Les politiques RLS doivent donc accorder au rôle `anon` les permissions nécessaires
//      pour que l'application puisse lire/écrire les données après que votre logique React
//      ait vérifié les droits de l'utilisateur (par exemple, si c'est un admin).
//    - CELA EST MOINS SÉCURISÉ que d'utiliser Supabase Auth où RLS peut se baser sur `auth.uid()`.
//      Soyez très prudent et conscient des implications de sécurité.

//    Exemples de politiques RLS pour le rôle `anon` (à exécuter dans l'éditeur SQL de Supabase) :
//    IMPORTANT : Exécutez ces commandes pour chaque table que votre application utilise.

/*
-- Assurez-vous d'abord que RLS est activé pour chaque table :
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_application_settings ENABLE ROW LEVEL SECURITY;

-- Pour la table 'users' (utilisée par votre authentification personnalisée)
DROP POLICY IF EXISTS "Allow app (anon) to manage users" ON public.users;
CREATE POLICY "Allow app (anon) to manage users"
  ON public.users
  FOR ALL -- Permet SELECT, INSERT, UPDATE, DELETE par l'application
  TO anon  -- Car l'application utilise la clé anon
  USING (true) -- L'application filtre/restreint les actions basées sur la logique interne
  WITH CHECK (true); -- La logique applicative (React) doit valider les données et les droits

-- Pour la table 'articles'
DROP POLICY IF EXISTS "Allow app (anon) to manage articles" ON public.articles;
CREATE POLICY "Allow app (anon) to manage articles"
  ON public.articles
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Pour la table 'clients'
DROP POLICY IF EXISTS "Allow app (anon) to manage clients" ON public.clients;
CREATE POLICY "Allow app (anon) to manage clients"
  ON public.clients
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Pour la table 'orders'
DROP POLICY IF EXISTS "Allow app (anon) to manage orders" ON public.orders;
CREATE POLICY "Allow app (anon) to manage orders"
  ON public.orders
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Pour la table 'operation_logs'
DROP POLICY IF EXISTS "Allow app (anon) to manage operation_logs" ON public.operation_logs;
CREATE POLICY "Allow app (anon) to manage operation_logs"
  ON public.operation_logs
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Pour la table 'company_application_settings'
DROP POLICY IF EXISTS "Allow app (anon) to read company_settings" ON public.company_application_settings;
CREATE POLICY "Allow app (anon) to read company_settings"
  ON public.company_application_settings
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow app (anon) to update company_settings" ON public.company_application_settings;
CREATE POLICY "Allow app (anon) to update company_settings"
  ON public.company_application_settings
  FOR ALL -- Couvre INSERT (pour upsert) et UPDATE. DELETE n'est généralement pas nécessaire pour cette table.
  TO anon
  USING (true) -- La logique applicative (React) vérifie si l'utilisateur est admin
  WITH CHECK (true);

-- FIN DES EXEMPLES DE POLITIQUES RLS
*/

// Rappel: Si `anon` a un accès CRUD complet sur des tables sensibles,
// la sécurité de ces opérations repose ENTIÈREMENT sur la robustesse de la logique
// de votre application React pour vérifier les permissions de l'utilisateur.
// Une approche plus sécurisée pour les opérations d'écriture sensibles serait
// d'utiliser des Edge Functions Supabase qui peuvent valider une session utilisateur personnalisée
// de manière plus sécurisée côté serveur.