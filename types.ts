
export enum UserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
}

export interface User {
  id: string; // UUID de Supabase
  name: string;
  email: string;
  role: UserRole;
  // Le mot de passe ne doit pas être stocké ici côté client après l'authentification.
  created_at?: string;
}
// Pour l'insertion/mise à jour, on peut avoir besoin de passer le mot de passe
export type UserInsert = Omit<User, 'id' | 'created_at'> & { password: string }; // Mot de passe requis pour la création
export type UserUpdate = Partial<Omit<User, 'id' | 'created_at' | 'email'>> & { id: string; email?: string; password?: string }; // Email peut être mis à jour, password optionnel


export interface Article {
  id: string; // UUID de Supabase
  name: string;
  price: number;
  category: string;
  created_at?: string; // Ajouté par Supabase
}

export interface Client {
  id: string; // UUID de Supabase
  name: string;
  phone: string;
  email?: string;
  created_at?: string; // Ajouté par Supabase
}

export interface OrderItem {
  articleId: string;
  articleName: string; // Dénormalisé pour affichage
  quantity: number;
  unitPrice: number; // Au moment de la commande
}

export enum OrderStatus {
  RECEIVED = 'Reçu',
  PROCESSING = 'En traitement',
  READY_FOR_PICKUP = 'Prêt pour récupération',
  DELIVERED = 'Livré',
  PAID = 'Payé',
  CANCELLED = 'Annulé',
}

export interface OrderStatusUpdate {
  status: OrderStatus;
  timestamp: string;
  notes?: string;
}

export interface Order {
  id: string; // UUID de Supabase
  order_number: string; // Numéro de commande convivial
  client_id: string;
  client_name: string; // Dénormalisé pour affichage
  items: OrderItem[]; // Stocké en JSONB dans Supabase
  total_amount: number;
  status: OrderStatus;
  status_history: OrderStatusUpdate[]; // Stocké en JSONB dans Supabase
  order_date: string; // ISO string (timestamptz)
  due_date?: string; // ISO string (timestamptz)
  is_paid: boolean;
  created_at?: string; // Ajouté par Supabase
  created_by_user_id?: string; // ID de l'utilisateur qui a créé la commande
  created_by_user_name?: string; // Nom de l'utilisateur (dénormalisé)
}

export type NavItemKey = 'dashboard' | 'orders' | 'articles' | 'clients' | 'statistics' | 'history' | 'adminUsers' | 'adminSettings';

export interface NavItem {
  key: NavItemKey;
  label: string;
  path: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
  adminOnly?: boolean; // Pour filtrer dans la Sidebar
}

export enum LogActionType {
  ORDER_CREATED = "Commande créée",
  ORDER_STATUS_UPDATED = "Statut commande mis à jour",
  ORDER_PAID_STATUS_CHANGED = "Statut paiement commande mis à jour",
  ORDER_MODIFIED = "Commande modifiée",
  ORDER_DELETED = "Commande supprimée",
  ARTICLE_CREATED = "Article créé",
  ARTICLE_UPDATED = "Article mis à jour",
  ARTICLE_DELETED = "Article supprimé",
  CLIENT_CREATED = "Client créé",
  CLIENT_UPDATED = "Client mis à jour",
  CLIENT_DELETED = "Client supprimé",
  USER_LOGIN = "Utilisateur connecté",
  USER_LOGOUT = "Utilisateur déconnecté",
  USER_CREATED = "Utilisateur créé par Admin",
  USER_UPDATED = "Utilisateur mis à jour par Admin",
  USER_DELETED = "Utilisateur supprimé par Admin",
  SETTINGS_UPDATED = "Paramètres de l'application mis à jour",
}

export interface OperationLog {
  id: string; // UUID de Supabase
  timestamp: string; // ISO string (timestamptz)
  actor: string; // Nom ou email de l'utilisateur
  action_type: LogActionType;
  entity_type: 'Order' | 'Article' | 'Client' | 'UserAuthentication' | 'UserManagement' | 'ApplicationSettings';
  entity_id?: string;
  description: string;
  created_at?: string; // Ajouté par Supabase
}

export type OperationLogInsertInput = Omit<OperationLog, 'id' | 'created_at' | 'timestamp' | 'actor'>;


export interface CompanyDetails {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  phone: string;
  email?: string;
  // website?: string; // Supprimé
  receiptFooterMessage?: string;
}

// Typage pour le client Supabase (Database interface)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: { 
          id: string;
          name: string;
          email: string;
          role: UserRole; 
          password?: string; 
          created_at?: string;
        };
        Insert: { 
          name: string;
          email: string;
          role: UserRole;
          password?: string; 
          id?: string; 
          created_at?: string; 
        };
        Update: Partial<{
          name: string;
          email: string;
          role: UserRole;
          password?: string; 
        }>;
      };
      articles: {
        Row: Article;
        Insert: Omit<Article, 'id' | 'created_at'>;
        Update: Partial<Omit<Article, 'id' | 'created_at'>>;
      };
      clients: {
        Row: Client;
        Insert: Omit<Client, 'id' | 'created_at'>;
        Update: Partial<Omit<Client, 'id' | 'created_at'>>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'id' | 'created_at'>;
        Update: Partial<Omit<Order, 'id' | 'created_at'>>;
      };
      operation_logs: {
        Row: OperationLog;
        Insert: Omit<OperationLog, 'id' | 'created_at'>;
        Update: Partial<Omit<OperationLog, 'id' | 'created_at'>>;
      };
      company_application_settings: {
        Row: {
          id: string; 
          name: string;
          address_line1: string;
          address_line_2?: string | null;
          phone: string;
          email?: string | null;
          // website?: string | null; // Supprimé
          receipt_footer_message?: string | null;
          updated_at?: string | null;
        };
        Insert: { 
          id?: string;
          name: string;
          address_line1: string;
          address_line2?: string | null;
          phone: string;
          email?: string | null;
          // website?: string | null; // Supprimé
          receipt_footer_message?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<{ 
          name: string;
          address_line1: string;
          address_line2?: string | null;
          phone: string;
          email?: string | null;
          // website?: string | null; // Supprimé
          receipt_footer_message?: string | null;
          updated_at?: string | null;
        }>;
      };
    };
    Views: { /* Vos vues ici */ };
    Functions: { /* Vos fonctions ici */ };
  };
}


// Types pour AppContext
export interface AppContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  articles: Article[];
  clients: Client[];
  orders: Order[];
  operationLogs: OperationLog[];
  addArticle: (article: Omit<Article, 'id' | 'created_at'>) => Promise<Article | null>;
  updateArticle: (article: Article) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  addClient: (client: Omit<Client, 'id' | 'created_at'>) => Promise<void>;
  updateClient: (client: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addOrder: (orderData: Omit<Order, 'id' | 'order_number' | 'status_history' | 'order_date' | 'total_amount' | 'is_paid' | 'status' | 'client_name' | 'items' | 'created_at' | 'created_by_user_id' | 'created_by_user_name'> & { items: Pick<OrderItem, 'articleId' | 'quantity'>[] }) => Promise<Order | null>;
  updateOrder: (order: Order, logInfo?: { action_type: LogActionType, description: string }, triggerReceiptPrint?: boolean) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  getArticleById: (id: string) => Article | undefined;
  getClientById: (id: string) => Client | undefined;
  addOperationLog: (log: OperationLogInsertInput) => Promise<void>;
  isLoading: boolean;
  appError: string | null;
  setAppError: (error: string | null) => void; // Added this line
  fetchInitialData: () => Promise<void>;
  
  adminFetchUsersList: () => Promise<User[]>;
  adminCreateNewUser: (userData: UserInsert) => Promise<User>;
  adminUpdateExistingUser: (userId: string, userData: UserUpdate) => Promise<User>;
  adminDeleteExistingUser: (userId: string) => Promise<void>;

  companySettings: CompanyDetails | null; 
  updateCompanySettings: (newSettings: CompanyDetails) => Promise<void>;
  openReceiptPreviewModal: (order: Order) => void; // Ajouté pour le modal d'aperçu du ticket
}
