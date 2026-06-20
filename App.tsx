
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactDOMServer from 'react-dom/server';
import { HashRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { User, Article, Client, Order, OrderStatus, OrderItem, OperationLog, LogActionType, AppContextType, OperationLogInsertInput, UserRole, UserInsert, UserUpdate, CompanyDetails, Database } from './types';
import { db } from './dbClient';
import Sidebar from './components/layout/Sidebar';
import DashboardView from './features/dashboard/DashboardView';
import OrdersView from './features/orders/OrdersView';
import ArticlesView from './features/articles/ArticlesView';
import ClientsView from './features/clients/ClientsView';
import StatisticsView from './features/statistics/StatisticsView';
import HistoryView from './features/history/HistoryView';
import AuthView from './features/auth/AuthView';
import AdminUserListView from './features/admin/users/AdminUserListView';
import AdminSettingsView from './features/admin/settings/AdminSettingsView';
import { PlusCircleIcon, ExclamationTriangleIcon, ArrowRightOnRectangleIcon, Bars3Icon } from './components/icons/HeroIcons'; // Added Bars3Icon
import ArticleFormModal from './features/articles/components/ArticleFormModal';
import ClientFormModal from './features/clients/components/ClientFormModal';
import OrderFormModal from './features/orders/components/OrderFormModal';
import ReceiptTemplate from './components/receipt/ReceiptTemplate';
import ReceiptPreviewModal from './components/receipt/ReceiptPreviewModal'; // Ajouté
import { COMPANY_DETAILS as COMPANY_DETAILS_DEFAULTS, buildArticleTariffKey, resolveArticleClassification } from './constants'; 
import Button from './components/common/Button';


type NewOrderItem = Pick<OrderItem, 'articleId' | 'quantity'>;
type ArticleInsert = Omit<Article, 'id' | 'created_at'>;
type ClientInsert = Omit<Client, 'id' | 'created_at'>;
type OrderInsertPayload = Omit<Order, 'id' | 'order_number' | 'status_history' | 'order_date' | 'total_amount' | 'is_paid' | 'status' | 'client_name' | 'items' | 'created_at' | 'created_by_user_id' | 'created_by_user_name'> & { items: NewOrderItem[] };


export const AppContext = React.createContext<AppContextType | null>(null);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [operationLogs, setOperationLogs] = useState<OperationLog[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanyDetails | null>(null);
  
  const [isLoading, setIsLoading] = useState(true); 
  const [appError, setAppErrorState] = useState<string | null>(null); 
  const [authChecked, setAuthChecked] = useState(false); 

  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  
  const [editingArticle, setEditingArticle] = useState<Article | undefined>(undefined);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const [_editingOrder, setEditingOrder] = useState<Order | undefined>(undefined);

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // State for Receipt Preview Modal
  const [isReceiptPreviewModalOpen, setIsReceiptPreviewModalOpen] = useState(false);
  const [orderForReceiptPreview, setOrderForReceiptPreview] = useState<Order | null>(null);


  const setAppError = useCallback((error: string | null) => {
    setAppErrorState(error);
  }, []);

  useEffect(() => {
    setAuthChecked(true);
    if (!currentUser) {
      setIsLoading(false);
      setCompanySettings(COMPANY_DETAILS_DEFAULTS); 
    }
  }, [currentUser]); 

  const openReceiptPreviewModal = useCallback((order: Order) => {
    setOrderForReceiptPreview(order);
    setIsReceiptPreviewModalOpen(true);
  }, []);

  const performPrintReceipt = useCallback((orderToPrint: Order) => {
    console.log("[PRINT WINDOW] Initiating print for order:", orderToPrint.order_number);
    if (!currentUser || !companySettings) {
      console.error("[PRINT WINDOW] Missing currentUser or companySettings.");
      setAppError("Données utilisateur ou paramètres de l'entreprise manquants pour l'impression.");
      return;
    }

    const receiptHTML = ReactDOMServer.renderToStaticMarkup(
      <ReceiptTemplate order={orderToPrint} companyDetails={companySettings} currentUser={currentUser} />
    );
    console.log("[PRINT WINDOW] Receipt HTML generated.");

    const printWindow = window.open('', '_blank', 'width=400,height=600,left=200,top=200,scrollbars=yes,resizable=yes');

    if (printWindow) {
      console.log("[PRINT WINDOW] New window opened successfully or was already open.");
      printWindow.document.open();
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Impression Ticket: ${orderToPrint.order_number}</title>
          <style>
            body { margin: 0; } /* Basic reset for print window */
            /* Styles from ReceiptTemplate will be included directly in receiptHTML */
          </style>
        </head>
        <body>
          ${receiptHTML}
          <script type="text/javascript">
            function attemptPrint() {
              console.log("[PRINT WINDOW SCRIPT] Executing attemptPrint. Current readyState: " + document.readyState);
              if (document.readyState === 'complete' || document.readyState === 'interactive') {
                console.log("[PRINT WINDOW SCRIPT] Document ready. Focusing and printing.");
                window.focus();
                window.print();
                // Consider uncommenting if auto-close is desired and reliable:
                // setTimeout(function() { window.close(); }, 1000); 
              } else {
                console.log("[PRINT WINDOW SCRIPT] Document not fully ready, setting up onload.");
                window.onload = function() {
                  console.log("[PRINT WINDOW SCRIPT] Window.onload triggered. Focusing and printing.");
                  window.focus(); 
                  window.print();
                  // setTimeout(function() { window.close(); }, 1000);
                };
              }
            }
            attemptPrint();
          <\/script>
        </body>
        </html>
      `);
      printWindow.document.close();
      console.log("[PRINT WINDOW] Content written to new window and document closed.");
      printWindow.focus();
    } else {
      console.error("[PRINT WINDOW] Failed to open new window. It might have been blocked by a popup blocker.");
      setAppError("Impossible d'ouvrir la fenêtre d'impression. Veuillez vérifier si votre navigateur bloque les popups et autorisez-les pour ce site.");
    }
  }, [currentUser, companySettings, setAppError]);


  const addOperationLog = useCallback(async (logData: OperationLogInsertInput) => {
    if (!currentUser) return; 
    try {
      const logToInsert = {
        ...logData,
        timestamp: new Date().toISOString(),
        actor: currentUser.name || currentUser.email, 
      };
      const { data: newLog, error } = await db.from('operation_logs').insert(logToInsert).select().single();
      
      if (error) {
          console.error("Error adding operation log (raw Supabase error):", error);
          let message = "Erreur Supabase lors de l'ajout du log d'opération.";
          if (typeof error.message === 'string' && error.message.trim() && error.message !== "[object Object]") {
              message = error.message;
          } else if (typeof error.details === 'string' && error.details.trim() && error.details !== "[object Object]") {
              message = error.details;
          } else if (typeof error.hint === 'string' && error.hint.trim() && error.hint !== "[object Object]") {
              message = error.hint;
          }
          throw new Error(message);
      }
      if (newLog) setOperationLogs(prev => [newLog as OperationLog, ...prev.slice(0, 499)]);
    } catch (error: any) {
        console.error("Error adding operation log (processed):", error.message || error);
    }
  }, [currentUser]); 

  const fetchInitialData = useCallback(async () => {
    if (!currentUser) { 
        setIsLoading(false);
        setCompanySettings(COMPANY_DETAILS_DEFAULTS);
        return;
    }
    setIsLoading(true);
    setAppError(null);
    try {
      const [
        articlesRes, 
        clientsRes, 
        ordersRes, 
        logsRes,
        settingsRes
      ] = await Promise.all([
        db.from('articles').select('*').order('created_at', { ascending: false }),
        db.from('clients').select('*').order('created_at', { ascending: false }),
        db.from('orders').select('*').order('order_date', { ascending: false }),
        db.from('operation_logs').select('*').order('timestamp', { ascending: false }).limit(500),
        db.from('company_application_settings').select('*').eq('id', 'singleton_settings_id').single() 
      ]);

      if (articlesRes.error) throw articlesRes.error;
      if (clientsRes.error) throw clientsRes.error;
      if (ordersRes.error) throw ordersRes.error;
      if (logsRes.error) throw logsRes.error;
      
      setArticles(articlesRes.data || []);
      setClients(clientsRes.data || []);
      setOrders(ordersRes.data || []);
      setOperationLogs(logsRes.data || []);

      if (settingsRes.error && settingsRes.error.code !== 'PGRST116') { 
        console.warn("Erreur lors du chargement des paramètres de l'entreprise:", settingsRes.error.message);
        setCompanySettings(COMPANY_DETAILS_DEFAULTS);
      } else if (settingsRes.data) {
        const dbSettings = settingsRes.data;
        setCompanySettings({
            name: dbSettings.name || COMPANY_DETAILS_DEFAULTS.name,
            addressLine1: dbSettings.address_line_1 || COMPANY_DETAILS_DEFAULTS.addressLine1,
            addressLine2: dbSettings.address_line_2 || COMPANY_DETAILS_DEFAULTS.addressLine2,
            phone: dbSettings.phone || COMPANY_DETAILS_DEFAULTS.phone,
            email: dbSettings.email || COMPANY_DETAILS_DEFAULTS.email,
            receiptFooterMessage: dbSettings.receipt_footer_message || COMPANY_DETAILS_DEFAULTS.receiptFooterMessage,
        });
      } else {
        console.warn("Aucun paramètre d'entreprise trouvé dans la base de données. Utilisation et tentative d'insertion des valeurs par défaut.");
        setCompanySettings(COMPANY_DETAILS_DEFAULTS);
        try {
          const defaultSettingsPayloadForSupabase = {
            id: 'singleton_settings_id',
            name: COMPANY_DETAILS_DEFAULTS.name,
            address_line_1: COMPANY_DETAILS_DEFAULTS.addressLine1,
            address_line_2: COMPANY_DETAILS_DEFAULTS.addressLine2 || null,
            phone: COMPANY_DETAILS_DEFAULTS.phone,
            email: COMPANY_DETAILS_DEFAULTS.email || null,
            receipt_footer_message: COMPANY_DETAILS_DEFAULTS.receiptFooterMessage || null,
          };
          const { error: upsertError } = await db
            .from('company_settings')
            .upsert(defaultSettingsPayloadForSupabase);
          if (upsertError) throw upsertError;
          console.log("Paramètres par défaut insérés/mis à jour dans la base de données.");
        } catch (upsertError: any) {
          console.error("Erreur lors de l'insertion des paramètres par défaut:", upsertError);
        }
      }

    } catch (error: any) {
      console.error('Error fetching initial data (raw error object):', error);
      let messageToDisplay = "Une erreur de communication avec le serveur s'est produite.";
      if (typeof error.message === 'string' && error.message.trim() && error.message !== "[object Object]") {
        messageToDisplay = error.message;
      } else if (typeof error.details === 'string' && error.details.trim() && error.details !== "[object Object]") {
        messageToDisplay = error.details;
      }
      setAppError(`Erreur de chargement des données initiales: ${messageToDisplay}`);
      setCompanySettings(COMPANY_DETAILS_DEFAULTS);
    } finally {
      setIsLoading(false); 
    }
  }, [currentUser?.id, setAppError]); 

  useEffect(() => {
    if (currentUser) {
        fetchInitialData();
    } else {
        setArticles([]);
        setClients([]);
        setOrders([]);
        setOperationLogs([]);
        setCompanySettings(COMPANY_DETAILS_DEFAULTS); 
        setIsLoading(false); 
    }
  }, [currentUser, fetchInitialData]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setAppError(null);
    try {
      const { data: userData, error: userError } = await db
        .from('users')
        .select('id, name, email, role, password, created_at')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        throw new Error("Email ou mot de passe incorrect.");
      }
      
      if (userData.password !== password) { 
        throw new Error("Email ou mot de passe incorrect.");
      }
      
      const { password: _dbPassword, ...userToStore } = userData as User & {password?: string};
      setCurrentUser(userToStore);
      return true;
    } catch (error: any) {
      console.error("Login failed:", error);
      setAppError(error.message || "Échec de la connexion.");
      setCurrentUser(null);
    } finally {
      setAuthChecked(true); 
    }
    return false;
  }, [setAppError]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setAuthChecked(true); 
    setIsLoading(false); 
  }, []);

  const updateCompanySettings = useCallback(async (newSettings: CompanyDetails) => {
    if (currentUser?.role !== UserRole.ADMIN) {
        const msg = "Accès refusé. Seuls les administrateurs peuvent modifier les paramètres.";
        setAppError(msg);
        throw new Error(msg);
    }
    setAppError(null); 

    if (!newSettings.name.trim() || !newSettings.addressLine1.trim() || !newSettings.phone.trim()) {
      const message = "Le nom de l'entreprise, l'adresse (ligne 1) et le téléphone sont obligatoires.";
      setAppError(message);
      throw new Error(message);
    }

    try {
        const payloadForSupabase = {
            id: 'singleton_settings_id',
            name: newSettings.name,
            address_line_1: newSettings.addressLine1,
            address_line_2: newSettings.addressLine2?.trim() || null,
            phone: newSettings.phone,
            email: newSettings.email?.trim() || null,
            receipt_footer_message: newSettings.receiptFooterMessage?.trim() || null,
        };

        const { error } = await db
            .from('company_settings')
            .upsert(payloadForSupabase);
        
        if (error) throw error; 
        
        setCompanySettings(newSettings); 
        await addOperationLog({
            action_type: LogActionType.SETTINGS_UPDATED,
            entity_type: 'UserManagement', 
            description: "Les paramètres de l'entreprise ont été mis à jour."
        });
    } catch (error: any) {
        console.error("Error updating company settings (raw Supabase error):", error);
        let detailedMessage = "Erreur lors de la mise à jour des paramètres de l'entreprise.";
        if (error && typeof error.message === 'string' && error.message.trim() && error.message !== "[object Object]") {
            detailedMessage = error.message;
        } else if (error && typeof error.details === 'string' && error.details.trim() && error.details !== "[object Object]") {
            detailedMessage = error.details;
        } else if (error && typeof error.hint === 'string' && error.hint.trim() && error.hint !== "[object Object]") {
            detailedMessage = error.hint;
        } else {
            try {
                const errorObjToLog = { 
                    message: error?.message, 
                    details: error?.details, 
                    hint: error?.hint, 
                    code: error?.code 
                };
                const errorStr = JSON.stringify(errorObjToLog);
                if (errorStr !== '{}' && errorStr !== "[object Object]") {
                    detailedMessage = `Erreur Supabase: ${errorStr}`;
                } else if (error && typeof error.toString === 'function' && error.toString() !== "[object Object]") {
                    detailedMessage = error.toString();
                }
            } catch (e) { /* ignore stringify error */ }
        }
        setAppError(detailedMessage);
        throw new Error(detailedMessage);
    }
  }, [currentUser?.role, addOperationLog, setAppError]);


  const adminFetchUsersList = useCallback(async (): Promise<User[]> => {
    if (currentUser?.role !== UserRole.ADMIN) { 
      const msg = "Accès refusé à la liste des utilisateurs.";
      setAppError(msg);
      throw new Error(msg);
    }
    try {
      const { data, error } = await db.from('users').select('id, name, email, role, created_at').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error: any) {
        console.error("Error fetching users list (raw Supabase error):", error);
        let detailedMessage = "Erreur lors de la récupération de la liste des utilisateurs.";
         if (error && typeof error.message === 'string' && error.message.trim() && error.message !== "[object Object]") { detailedMessage = error.message;}
         else if (error && typeof error.details === 'string' && error.details.trim() && error.details !== "[object Object]") { detailedMessage = error.details; }
        setAppError(detailedMessage);
        throw new Error(detailedMessage);
    }
  }, [currentUser?.role, setAppError]);

  const adminCreateNewUser = useCallback(async (userData: UserInsert): Promise<User> => {
    if (currentUser?.role !== UserRole.ADMIN) {
      const msg = "Accès refusé pour créer un utilisateur.";
      setAppError(msg);
      throw new Error(msg);
    }
    const payload = { ...userData };
    if (!payload.password) { const msg = "Le mot de passe est requis."; setAppError(msg); throw new Error(msg); }

    try {
      const { data, error } = await db.from('users').insert(payload as any).select('id, name, email, role, created_at').single();
      if (error) { if (error.code === '23505') { const msg = `L'email "${userData.email}" est déjà utilisé.`; setAppError(msg); throw new Error(msg); } throw error; }
      if (!data) { const msg = "La création de l'utilisateur a échoué."; setAppError(msg); throw new Error(msg); }
      await addOperationLog({ action_type: LogActionType.USER_CREATED, entity_type: 'UserManagement', entity_id: data.id, description: `Utilisateur "${data.name}" créé.` });
      return data as User;
    } catch (error: any) {
        console.error("Error creating user (raw Supabase error):", error);
        let detailedMessage = "Erreur lors de la création de l'utilisateur.";
         if (error && typeof error.message === 'string' && error.message.trim() && error.message !== "[object Object]") { detailedMessage = error.message;}
         else if (error && typeof error.details === 'string' && error.details.trim() && error.details !== "[object Object]") { detailedMessage = error.details; }
        setAppError(detailedMessage);
        throw new Error(detailedMessage);
    }
  }, [currentUser?.role, addOperationLog, setAppError]);

  const adminUpdateExistingUser = useCallback(async (userId: string, userData: UserUpdate): Promise<User> => {
    if (currentUser?.role !== UserRole.ADMIN) {
      const msg = "Accès refusé pour mettre à jour un utilisateur.";
      setAppError(msg);
      throw new Error(msg);
    }
    const { id, ...updatePayload } = userData; 
    if (updatePayload.password === '') {
        delete updatePayload.password;
    }
    try {
      const { data, error } = await db.from('users').update(updatePayload).eq('id', userId).select('id, name, email, role, created_at').single();
      if (error) { if (error.code === '23505' && updatePayload.email) { const msg = `L'email "${updatePayload.email}" est déjà utilisé.`; setAppError(msg); throw new Error(msg); } throw error; }
      if (!data) { const msg = "La mise à jour de l'utilisateur a échoué."; setAppError(msg); throw new Error(msg); }
      await addOperationLog({ action_type: LogActionType.USER_UPDATED, entity_type: 'UserManagement', entity_id: data.id, description: `Utilisateur "${data.name}" mis à jour.` });
      return data as User;
    } catch (error: any) {
        console.error("Error updating user (raw Supabase error):", error);
        let detailedMessage = "Erreur lors de la mise à jour de l'utilisateur.";
        if (error && typeof error.message === 'string' && error.message.trim() && error.message !== "[object Object]") { detailedMessage = error.message;}
        else if (error && typeof error.details === 'string' && error.details.trim() && error.details !== "[object Object]") { detailedMessage = error.details; }
        setAppError(detailedMessage);
        throw new Error(detailedMessage);
    }
  }, [currentUser?.role, addOperationLog, setAppError]);

  const adminDeleteExistingUser = useCallback(async (userId: string): Promise<void> => {
    if (currentUser?.role !== UserRole.ADMIN) {
      const msg = "Accès refusé pour supprimer un utilisateur.";
      setAppError(msg);
      throw new Error(msg);
    }
    if (currentUser?.id === userId) {
      const msg = "Impossible de supprimer son propre compte.";
      setAppError(msg);
      throw new Error(msg);
    }
    try {
      const { error } = await db.from('users').delete().eq('id', userId);
      if (error) throw error;
      await addOperationLog({ action_type: LogActionType.USER_DELETED, entity_type: 'UserManagement', entity_id: userId, description: `Utilisateur ID "${userId}" supprimé.` });
    } catch (error: any) {
      console.error("Supabase delete user error:", error);
      let detailedMessage = `Erreur lors de la suppression de l'utilisateur ID ${userId}.`;
      if ((error as any).code === '23503') { detailedMessage = `Impossible de supprimer l'utilisateur: il est peut-être lié à des enregistrements (ex: commandes). Modifiez ces liaisons avant de réessayer.`; }
      else if (error && typeof error.message === 'string' && error.message.trim() && error.message !== "[object Object]") { detailedMessage = error.message;}
      else if (error && typeof error.details === 'string' && error.details.trim() && error.details !== "[object Object]") { detailedMessage = error.details; }
      setAppError(detailedMessage);
      throw new Error(detailedMessage);
    }
  }, [currentUser?.id, currentUser?.role, addOperationLog, setAppError]);

  const generateOrderNumber = useCallback(async (): Promise<string> => {
    const { data, error } = await db.from('orders').select('order_number').order('created_at', { ascending: false }).limit(1);
    if (error) { console.error("Error gen order number:", error); return `CMD-ERR-${Date.now()}`; }
    let lastNumber = 0; if (data && data.length > 0 && data[0].order_number) { const match = data[0].order_number.match(/CMD-(\d+)/); if (match && match[1]) lastNumber = parseInt(match[1], 10); }
    return `CMD-${String(lastNumber + 1).padStart(5, '0')}`;
  }, []);

  const addArticle = useCallback(async (articleData: ArticleInsert): Promise<Article | null> => {
    setAppError(null);
    try {
        const newArticleClassification = resolveArticleClassification(articleData);
        const newArticleTariffKey = buildArticleTariffKey(newArticleClassification.category, newArticleClassification.subcategory);
        const duplicateArticle = articles.find(existingArticle => {
          const existingClassification = resolveArticleClassification(existingArticle);
          return buildArticleTariffKey(existingClassification.category, existingClassification.subcategory) === newArticleTariffKey;
        });
        if (duplicateArticle) throw new Error(`Le tarif "${duplicateArticle.name}" existe deja. Impossible de creer deux fois la meme combinaison categorie/sous-categorie.`);
        const { data, error } = await db.from('articles').insert(articleData).select().single(); if (error) throw error; if (data) { setArticles(prev => [data as Article, ...prev]); await addOperationLog({action_type: LogActionType.ARTICLE_CREATED, entity_type: 'Article', entity_id: data.id, description: `Article "${data.name}" créé.`}); return data as Article;}
        return null;
    } catch(error: any) {
        console.error("Supabase add article error:", error);
        setAppError(error.message || "Erreur d'ajout d'article.");
        throw error;
    }
  }, [articles, addOperationLog, setAppError]);

  const updateArticle = useCallback(async (updatedArticleData: Article) => {
    setAppError(null);
    try {
        const updatedClassification = resolveArticleClassification(updatedArticleData);
        const updatedTariffKey = buildArticleTariffKey(updatedClassification.category, updatedClassification.subcategory);
        const duplicateArticle = articles.find(existingArticle => {
          if (existingArticle.id === updatedArticleData.id) return false;
          const existingClassification = resolveArticleClassification(existingArticle);
          return buildArticleTariffKey(existingClassification.category, existingClassification.subcategory) === updatedTariffKey;
        });
        if (duplicateArticle) throw new Error(`Le tarif "${duplicateArticle.name}" existe deja. Impossible d'avoir deux fois la meme combinaison categorie/sous-categorie.`);
        const { id, ...payload } = updatedArticleData; const { data, error } = await db.from('articles').update(payload).eq('id', id).select().single(); if(error) throw error; if (data) { setArticles(prev => prev.map(a => a.id === data.id ? data as Article : a)); await addOperationLog({action_type: LogActionType.ARTICLE_UPDATED, entity_type: 'Article', entity_id: data.id, description: `Article "${data.name}" mis à jour.`});}
    } catch (error: any) {
        console.error("Supabase update article error:", error);
        setAppError(error.message || "Erreur de mise à jour d'article.");
        throw error;
    }
  }, [articles, addOperationLog, setAppError]);

  const deleteArticle = useCallback(async (id: string) => {
    if (currentUser?.role !== UserRole.ADMIN) {
      const msg = "Accès refusé. Seuls les administrateurs peuvent supprimer des articles.";
      setAppError(msg);
      throw new Error(msg);
    }
    setAppError(null);
    try {
      const { error } = await db.from('articles').delete().eq('id', id);
      if (error) {
        if ((error as any).code === '23503') { throw new Error(`Impossible de supprimer l'article: il est utilisé dans des commandes.`); }
        throw error;
      }
      setArticles(prev => prev.filter(a => a.id !== id)); 
      await addOperationLog({action_type: LogActionType.ARTICLE_DELETED, entity_type: 'Article', entity_id: id, description: `Article ID "${id}" supprimé.`});
    } catch (error: any) {
      console.error("Supabase delete article error:", error);
      let detailedMessage = `Erreur lors de la suppression de l'article ID ${id}.`;
      if ((error as any).code === '23503') { detailedMessage = `Impossible de supprimer l'article : il est utilisé dans des commandes existantes.`; }
      else if (error && typeof error.message === 'string' && error.message.trim() && error.message !== "[object Object]") { detailedMessage = error.message;}
      setAppError(detailedMessage);
      throw new Error(detailedMessage); 
    }
  }, [currentUser?.role, addOperationLog, setAppError]);
  
  const addClient = useCallback(async (clientData: ClientInsert) => {
    setAppError(null);
    try {
        const { data, error } = await db.from('clients').insert(clientData).select().single(); if (error) throw error; if (data) {setClients(prev => [data as Client, ...prev]); await addOperationLog({action_type:LogActionType.CLIENT_CREATED, entity_type:'Client', entity_id: data.id, description: `Client "${data.name}" créé.`});}
    } catch (error: any) {
        console.error("Supabase add client error:", error);
        setAppError(error.message || "Erreur d'ajout de client.");
        throw error;
    }
  }, [addOperationLog, setAppError]);

  const updateClient = useCallback(async (updatedClientData: Client) => {
    setAppError(null);
    try {
        const { id, ...payload } = updatedClientData; const { data, error } = await db.from('clients').update(payload).eq('id', id).select().single(); if (error) throw error; if (data) {setClients(prev => prev.map(c => c.id === data.id ? data as Client : c)); await addOperationLog({action_type: LogActionType.CLIENT_UPDATED, entity_type: 'Client', entity_id: data.id, description: `Client "${data.name}" mis à jour.`});}
    } catch (error: any) {
        console.error("Supabase update client error:", error);
        setAppError(error.message || "Erreur de mise à jour de client.");
        throw error;
    }
  }, [addOperationLog, setAppError]);

  const deleteClient = useCallback(async (id: string) => {
    if (currentUser?.role !== UserRole.ADMIN) {
      const msg = "Accès refusé. Seuls les administrateurs peuvent supprimer des clients.";
      setAppError(msg);
      throw new Error(msg);
    }
    setAppError(null);
    try {
      const { error } = await db.from('clients').delete().eq('id', id); 
      if (error) {
        if ((error as any).code === '23503') { throw new Error(`Impossible de supprimer le client : il a des commandes existantes.`);}
        throw error; 
      }
      setClients(prev => prev.filter(c => c.id !== id)); 
      await addOperationLog({action_type: LogActionType.CLIENT_DELETED, entity_type: 'Client', entity_id: id, description: `Client ID "${id}" supprimé.`});
    } catch (error: any) {
      console.error("Supabase delete client error:", error);
      let detailedMessage = `Erreur lors de la suppression du client ID ${id}.`;
      if ((error as any).code === '23503') { detailedMessage = `Impossible de supprimer le client : il a des commandes existantes.`; }
      else if (error && typeof error.message === 'string' && error.message.trim() && error.message !== "[object Object]") { detailedMessage = error.message;}
      setAppError(detailedMessage);
      throw new Error(detailedMessage);
    }
  }, [currentUser?.role, addOperationLog, setAppError]);

  const addOrder = useCallback(async (orderData: OrderInsertPayload): Promise<Order | null> => {
    setAppError(null);
    if (!currentUser) { setAppError("Utilisateur non connecté."); return null; }
    const client = clients.find(c => c.id === orderData.client_id); if (!client) { setAppError("Client non trouvé."); return null; }
    
    try {
      const orderItemsWithDetails: OrderItem[] = orderData.items.map(item => { const article = articles.find(a => a.id === item.articleId); if (!article) throw new Error(`Article ${item.articleId} non trouvé`); return { articleId: item.articleId, quantity: item.quantity, articleName: article.name, unitPrice: article.price }; });
      const totalAmount = orderItemsWithDetails.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const now = new Date().toISOString(); const newOrderNumber = await generateOrderNumber();
      const orderToInsert: Omit<Order, 'id' | 'created_at'> = { order_number: newOrderNumber, client_id: orderData.client_id, client_name: client.name, items: orderItemsWithDetails, total_amount: totalAmount, status: OrderStatus.RECEIVED, status_history: [{ status: OrderStatus.RECEIVED, timestamp: now, notes: "Commande créée." }], order_date: now, is_paid: false, due_date: orderData.due_date ? new Date(orderData.due_date).toISOString() : undefined, created_by_user_id: currentUser.id, created_by_user_name: currentUser.name || currentUser.email, };
      const { data, error } = await db.from('orders').insert(orderToInsert).select().single(); 
      if (error) throw error; 
      if (data) { 
        const newOrder = data as Order;
        setOrders(prev => [newOrder, ...prev]); 
        await addOperationLog({ action_type: LogActionType.ORDER_CREATED, entity_type: 'Order', entity_id: newOrder.id, description: `Commande ${newOrder.order_number} créée.` }); 
        openReceiptPreviewModal(newOrder); 
        return newOrder; 
      } 
      return null;
    } catch (error: any) {
      console.error("Supabase add order error:", error);
      setAppError(error.message || "Erreur d'ajout de commande.");
      throw error; 
    }
  }, [currentUser, clients, articles, generateOrderNumber, addOperationLog, setAppError, openReceiptPreviewModal]);


  const updateOrder = useCallback(async (updatedOrderData: Order, logInfo?: { action_type: LogActionType, description: string }, triggerReceiptPrint: boolean = false) => {
    setAppError(null);
    try {
      const { id, ...payload } = updatedOrderData; 
      const { data, error } = await db.from('orders').update(payload).eq('id', id).select().single(); 
      if (error) throw error; 
      if (data) { 
        const finalUpdatedOrder = data as Order; 
        setOrders(prev => prev.map(o => o.id === finalUpdatedOrder.id ? finalUpdatedOrder : o)); 
        if (logInfo) {
            await addOperationLog({action_type: logInfo.action_type, entity_type:'Order', entity_id: finalUpdatedOrder.id, description: logInfo.description});
        }
        if (triggerReceiptPrint && (finalUpdatedOrder.is_paid || finalUpdatedOrder.status === OrderStatus.PAID)) {
            openReceiptPreviewModal(finalUpdatedOrder);
        }
      }
    } catch (error: any) {
      console.error("Supabase update order error:", error);
      setAppError(error.message || "Erreur de mise à jour de commande.");
      throw error;
    }
  }, [addOperationLog, openReceiptPreviewModal, setAppError]);
  
  const deleteOrder = useCallback(async (id: string) => {
    if (currentUser?.role !== UserRole.ADMIN) {
      const msg = "Accès refusé. Seuls les administrateurs peuvent supprimer des commandes.";
      setAppError(msg);
      throw new Error(msg);
    }
    setAppError(null);
    try {
      const { error } = await db.from('orders').delete().eq('id', id); if (error) throw error; setOrders(prev => prev.filter(o => o.id !== id)); await addOperationLog({action_type: LogActionType.ORDER_DELETED, entity_type:'Order', entity_id: id, description: `Commande ID "${id}" supprimée.`});
    } catch (error: any) {
      console.error("Supabase delete order error:", error);
      setAppError(error.message || "Erreur de suppression de commande.");
      throw new Error(error.message || "Erreur de suppression de commande."); 
    }
  }, [currentUser?.role, addOperationLog, setAppError]);

  const getArticleById = useCallback((id: string) => articles.find(a => a.id === id), [articles]);
  const getClientById = useCallback((id: string) => clients.find(c => c.id === id), [clients]);
  
  const appContextValue: AppContextType = useMemo(() => ({
    currentUser, login, logout,
    articles, clients, orders, operationLogs,
    addArticle, updateArticle, deleteArticle,
    addClient, updateClient, deleteClient,
    addOrder, updateOrder, deleteOrder,
    getArticleById, getClientById,
    addOperationLog,
    isLoading, appError: appError, setAppError, 
    fetchInitialData,
    adminFetchUsersList, adminCreateNewUser, adminUpdateExistingUser, adminDeleteExistingUser,
    companySettings, updateCompanySettings, 
    openReceiptPreviewModal,
  }), [
    currentUser, login, logout, articles, clients, orders, operationLogs, 
    addArticle, updateArticle, deleteArticle, addClient, updateClient, deleteClient, 
    addOrder, updateOrder, deleteOrder, getArticleById, getClientById, addOperationLog, 
    isLoading, appError, setAppError, 
    fetchInitialData,
    adminFetchUsersList, adminCreateNewUser, adminUpdateExistingUser, adminDeleteExistingUser,
    companySettings, updateCompanySettings, 
    openReceiptPreviewModal,
  ]);

  const openNewArticleModal = () => { setEditingArticle(undefined); setIsArticleModalOpen(true); };
  const openNewClientModal = () => { setEditingClient(undefined); setIsClientModalOpen(true); };
  const openNewOrderModal = () => { setEditingOrder(undefined); setIsOrderModalOpen(true); };

  const handleEditArticle = (article: Article) => { setEditingArticle(article); setIsArticleModalOpen(true); };
  const handleEditClient = (client: Client) => { setEditingClient(client); setIsClientModalOpen(true); };

  if (!authChecked) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-light-bg">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-primary"></div>
        <p className="mt-4 text-slate-600 text-lg">Chargement de l'application...</p>
      </div>
    );
  }

  if (appError && !currentUser && !isLoading) { 
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-700 p-8">
        <ExclamationTriangleIcon className="h-16 w-16 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Une erreur est survenue</h2>
        <p className="text-center mb-4 max-w-md">{appError}</p>
        <button onClick={() => { setAppError(null); }} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">OK</button>
      </div>
    );
  }

  const AppLayout: React.FC<{children: React.ReactNode}> = ({children}) => {
    if (appError && currentUser && !isLoading) { 
        return (
          <div className="flex flex-col items-center justify-center h-full bg-red-50 text-red-700 p-4 mx-auto my-4 border border-red-200 rounded-lg max-w-lg">
            <ExclamationTriangleIcon className="h-12 w-12 mb-3" />
            <h2 className="text-xl font-semibold mb-1">Erreur</h2>
            <p className="text-center text-sm mb-3">{appError}</p>
            <button onClick={() => { setAppError(null); fetchInitialData(); }} className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700">Réessayer</button>
          </div>
        );
    }
    if (isLoading && currentUser) { 
        return ( <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div><p className="ml-3 text-slate-600">Chargement des données...</p></div> );
    }
    return <>{children}</>;
  };

  const ProtectedContent = () => (
    <div className="flex h-screen bg-light-bg">
      <Sidebar isMobileOpen={isMobileSidebarOpen} closeMobileSidebar={() => setIsMobileSidebarOpen(false)} />
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}
      <main className="flex-1 flex flex-col overflow-x-hidden"> {/* main is now flex-col for sticky header */}
        {/* Sticky Header within main */}
        <div className="bg-light-bg shadow-sm p-4 sticky top-0 z-20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center">
              <button className="md:hidden mr-3 flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-brand-primary" onClick={() => setIsMobileSidebarOpen(true)} aria-label="Open sidebar">
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-dark-text whitespace-nowrap">PressingApp Pro</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {currentUser && (
                <div className="text-xs sm:text-sm text-slate-600 order-1 sm:order-none">
                  Connecté: <span className="font-medium">{currentUser.name || currentUser.email}</span>
                  {currentUser.role === UserRole.ADMIN && <span className="ml-1 px-1.5 py-0.5 sm:px-2 bg-yellow-200 text-yellow-800 text-xs font-semibold rounded-full">Admin</span>}
                </div>
              )}
              <div className="flex flex-wrap gap-2 order-3 sm:order-none w-full sm:w-auto justify-center sm:justify-start">
                <Button onClick={openNewOrderModal} size="md" className="flex-grow sm:flex-grow-0">
                  <PlusCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Nouv. </span>Commande
                </Button>
                <Button onClick={openNewArticleModal} variant="secondary" size="md" className="flex-grow sm:flex-grow-0">
                   <PlusCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Nouv. </span>Article
                </Button>
                <Button onClick={openNewClientModal} variant="secondary" size="md" className="flex-grow sm:flex-grow-0">
                   <PlusCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Nouv. </span>Client
                </Button>
              </div>
              {currentUser && (
                 <Button
                    onClick={logout}
                    title="Déconnexion"
                    variant="ghost"
                    size="md"
                    className="order-2 sm:order-none ml-auto sm:ml-0 px-3"
                  >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <AppLayout>
              <Routes>
                  <Route path="/" element={<DashboardView />} />
                  <Route path="/orders" element={<OrdersView />} />
                  <Route path="/articles" element={<ArticlesView onEdit={handleEditArticle} />} />
                  <Route path="/clients" element={<ClientsView onEdit={handleEditClient} />} />
                  <Route path="/statistics" element={<StatisticsView />} />
                  <Route path="/history" element={<HistoryView />} />
                  {currentUser?.role === UserRole.ADMIN && <Route path="/admin/users" element={<AdminUserListView />} />} 
                  {currentUser?.role === UserRole.ADMIN && <Route path="/admin/settings" element={<AdminSettingsView />} />}
                  <Route path="/login" element={<Navigate to="/" replace />} /> 
                  <Route path="*" element={<Navigate to="/" replace />} /> 
              </Routes>
              <Outlet /> 
          </AppLayout>
        </div>
      </main>
    </div>
  );

  const UnprotectedContent = () => (
    <div className="w-screen min-h-screen">
        <Routes>
            <Route path="/login" element={<AuthView />} />
            <Route path="*" element={<Navigate to="/login" replace />} /> 
        </Routes>
    </div>
  );

  return (
    <AppContext.Provider value={appContextValue}>
      <HashRouter>
        {currentUser ? <ProtectedContent /> : <UnprotectedContent />}
      </HashRouter>
      
      {currentUser && isArticleModalOpen && ( <ArticleFormModal isOpen={isArticleModalOpen} onClose={() => setIsArticleModalOpen(false)} article={editingArticle} /> )}
      {currentUser && isClientModalOpen && ( <ClientFormModal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} client={editingClient} /> )}
      {currentUser && isOrderModalOpen && ( <OrderFormModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} articles={articles} clients={clients} /> )}
      {currentUser && isReceiptPreviewModalOpen && orderForReceiptPreview && companySettings && (
        <ReceiptPreviewModal
            isOpen={isReceiptPreviewModalOpen}
            onClose={() => setIsReceiptPreviewModalOpen(false)}
            order={orderForReceiptPreview}
            companyDetails={companySettings}
            currentUser={currentUser}
            onPrint={() => performPrintReceipt(orderForReceiptPreview)}
        />
      )}
    </AppContext.Provider>
  );
};

export default App;
// End of App.tsx
