import React, { useState, useEffect, useContext, ChangeEvent, useMemo } from 'react';
import { AppContext } from '../../../App';
import { Article, Client, OrderItem as OrderItemType, Order, LogActionType, AppContextType } from '../../../types';
import Modal from '../../../components/common/Modal';
import Select from '../../../components/common/Select';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import { PlusCircleIcon, TrashIcon } from '../../../components/icons/HeroIcons';
import {
  ARTICLE_CATEGORIES,
  ARTICLE_CATEGORY_OPTIONS,
  buildArticleCategory,
  buildArticleDisplayName,
  formatArticleCategoryLabel,
  resolveArticleClassification,
} from '../../../constants';

interface DraftOrderItem {
  articleId: string;
  quantity: number;
}

interface FormOrderItem extends OrderItemType {
  category: string;
  subcategory: string;
  draftTariffPrice?: string;
}

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  clients: Client[];
  order?: Order;
}

interface PendingTariffLink {
  index: number;
  category: string;
  subcategory: string;
}

const OrderFormModal: React.FC<OrderFormModalProps> = ({ isOpen, onClose, articles, clients, order }) => {
  const context = useContext(AppContext) as AppContextType | null;
  const [clientId, setClientId] = useState('');
  const [items, setItems] = useState<FormOrderItem[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState<{ client?: string; items?: string; dueDate?: string; form?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialOrderState, setInitialOrderState] = useState<Order | undefined>(undefined);
  const [pendingTariffLink, setPendingTariffLink] = useState<PendingTariffLink | null>(null);

  const resolvedArticles = useMemo(() => {
    return articles.map((article) => {
      const classification = resolveArticleClassification(article);
      return {
        article,
        category: classification.category,
        subcategory: classification.subcategory,
        displayName: buildArticleDisplayName(classification.category, classification.subcategory),
      };
    });
  }, [articles]);

  const availableCategories = useMemo(() => {
    return ARTICLE_CATEGORIES;
  }, [resolvedArticles]);

  const getSubcategoriesForCategory = (category: string): string[] => {
    return ARTICLE_CATEGORY_OPTIONS[category] || [];
  };

  const findResolvedArticle = (category: string, subcategory: string) => {
    return resolvedArticles.find((item) => item.category === category && item.subcategory === subcategory);
  };

  const buildFormItemFromResolvedArticle = (resolvedArticle: ReturnType<typeof findResolvedArticle>, quantity: number = 1): FormOrderItem | null => {
    if (!resolvedArticle) return null;

    return {
      articleId: resolvedArticle.article.id,
      articleName: resolvedArticle.displayName,
      quantity,
      unitPrice: resolvedArticle.article.price,
      category: resolvedArticle.category,
      subcategory: resolvedArticle.subcategory,
      draftTariffPrice: '',
    };
  };

  const buildEmptyFormItem = (category: string, subcategory: string, quantity: number = 1): FormOrderItem => ({
    articleId: '',
    articleName: buildArticleDisplayName(category, subcategory),
    quantity,
    unitPrice: 0,
    category,
    subcategory,
    draftTariffPrice: '',
  });

  useEffect(() => {
    if (order) {
      const orderCopy = JSON.parse(JSON.stringify(order)) as Order;
      setClientId(orderCopy.client_id);
      setItems(orderCopy.items.map((item) => {
        const existingArticle = articles.find((article) => article.id === item.articleId);
        const classification = existingArticle
          ? resolveArticleClassification(existingArticle)
          : resolveArticleClassification({ name: item.articleName, category: item.articleName });

        return {
          ...item,
          articleName: buildArticleDisplayName(classification.category, classification.subcategory),
          category: classification.category,
          subcategory: classification.subcategory,
        };
      }));
      setDueDate(orderCopy.due_date ? new Date(orderCopy.due_date).toISOString().split('T')[0] : '');
      setInitialOrderState(orderCopy);
    } else {
      const firstResolvedArticle = resolvedArticles[0];
      const firstItem = buildFormItemFromResolvedArticle(firstResolvedArticle, 1);
      setClientId('');
      setItems(firstItem ? [firstItem] : []);
      setDueDate('');
      setInitialOrderState(undefined);
    }
    setErrors({});
    setIsSubmitting(false);
    setPendingTariffLink(null);
  }, [isOpen, order, articles, resolvedArticles]);

  if (!context) return null;
  const { addOrder, addArticle, updateOrder, getArticleById, fetchInitialData } = context;

  useEffect(() => {
    if (!pendingTariffLink) return;

    const resolvedArticle = findResolvedArticle(pendingTariffLink.category, pendingTariffLink.subcategory);
    if (!resolvedArticle) return;

    setItems((prev) => {
      if (!prev[pendingTariffLink.index]) return prev;
      const nextItems = [...prev];
      nextItems[pendingTariffLink.index] = {
        ...nextItems[pendingTariffLink.index],
        articleId: resolvedArticle.article.id,
        articleName: resolvedArticle.displayName,
        unitPrice: resolvedArticle.article.price,
        draftTariffPrice: '',
      };
      return nextItems;
    });
    setErrors((prev) => ({ ...prev, items: undefined, form: undefined }));
    setPendingTariffLink(null);
  }, [pendingTariffLink, resolvedArticles]);

  const handleAddItem = () => {
    const firstResolvedArticle = resolvedArticles[0];
    const nextItem = buildFormItemFromResolvedArticle(firstResolvedArticle, 1);
    if (nextItem) {
      setItems([...items, nextItem]);
    }
  };

  const handleCategoryChange = (index: number, nextCategory: string) => {
    const availableSubcategories = getSubcategoriesForCategory(nextCategory);
    const nextSubcategory = availableSubcategories[0] || '';
    const nextResolvedArticle = findResolvedArticle(nextCategory, nextSubcategory);

    const newItems = [...items];
    newItems[index] = nextResolvedArticle
      ? {
          ...newItems[index],
          articleId: nextResolvedArticle.article.id,
          articleName: nextResolvedArticle.displayName,
          unitPrice: nextResolvedArticle.article.price,
          category: nextResolvedArticle.category,
          subcategory: nextResolvedArticle.subcategory,
        }
      : buildEmptyFormItem(nextCategory, nextSubcategory, newItems[index].quantity);
    setItems(newItems);
  };

  const handleSubcategoryChange = (index: number, nextSubcategory: string) => {
    const currentItem = items[index];
    const nextResolvedArticle = findResolvedArticle(currentItem.category, nextSubcategory);

    const newItems = [...items];
    newItems[index] = nextResolvedArticle
      ? {
          ...newItems[index],
          articleId: nextResolvedArticle.article.id,
          articleName: nextResolvedArticle.displayName,
          unitPrice: nextResolvedArticle.article.price,
          subcategory: nextResolvedArticle.subcategory,
        }
      : buildEmptyFormItem(currentItem.category, nextSubcategory, currentItem.quantity);
    setItems(newItems);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], quantity };
    setItems(newItems);
  };

  const handleDraftTariffPriceChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], draftTariffPrice: value };
    setItems(newItems);
  };

  const handleCreateTariff = async (index: number) => {
    const currentItem = items[index];
    const draftPrice = parseFloat(currentItem.draftTariffPrice || '');

    if (Number.isNaN(draftPrice) || draftPrice <= 0) {
      setErrors((prev) => ({ ...prev, items: "Veuillez saisir un prix valide avant de créer le tarif." }));
      return;
    }

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, items: undefined, form: undefined }));

    try {
      const createdArticle = await addArticle({
        name: buildArticleDisplayName(currentItem.category, currentItem.subcategory),
        category: buildArticleCategory(currentItem.category, currentItem.subcategory),
        price: draftPrice,
      });

      if (createdArticle) {
        const newItems = [...items];
        newItems[index] = {
          ...newItems[index],
          articleId: createdArticle.id,
          articleName: createdArticle.name,
          unitPrice: createdArticle.price,
          draftTariffPrice: '',
        };
        setItems(newItems);
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Impossible de créer ce tarif.";
      if (errorMessage.includes('existe deja')) {
        setPendingTariffLink({
          index,
          category: currentItem.category,
          subcategory: currentItem.subcategory,
        });
        await fetchInitialData();
        setErrors((prev) => ({
          ...prev,
          items: "Ce tarif existait déjà. Les données ont été rechargées et la ligne va être rattachée automatiquement.",
        }));
      } else {
        setErrors((prev) => ({ ...prev, items: errorMessage }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const validate = (): boolean => {
    const newErrors: { client?: string; items?: string; dueDate?: string } = {};
    if (!clientId) newErrors.client = "Veuillez sélectionner un client.";
    if (items.length === 0) newErrors.items = "Veuillez ajouter au moins un article.";
    items.forEach((item) => {
      if (item.quantity <= 0) newErrors.items = "La quantité doit être positive pour tous les articles.";
      if (!item.articleId) newErrors.items = "Certaines combinaisons catégorie/sous-catégorie n'ont pas encore de tarif défini.";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;
    setIsSubmitting(true);

    const orderItemsForSubmission: DraftOrderItem[] = items.map(({ articleId, quantity }) => ({ articleId, quantity }));

    try {
      if (!order) {
        const newOrderData = {
          client_id: clientId,
          items: orderItemsForSubmission,
          due_date: dueDate || undefined,
        };
        await addOrder(newOrderData);
      } else {
        const currentClient = clients.find(c => c.id === clientId);
        if (currentClient && initialOrderState) {
          const fullItemsForUpdate: OrderItemType[] = items.map((item) => {
            const articleDetails = getArticleById(item.articleId);
            return {
              articleId: item.articleId,
              articleName: articleDetails?.name || item.articleName,
              quantity: item.quantity,
              unitPrice: articleDetails?.price || item.unitPrice,
            };
          });

          const updatedOrderPayload: Order = {
            ...initialOrderState,
            client_id: clientId,
            client_name: currentClient.name,
            items: fullItemsForUpdate,
            total_amount: calculateTotal(),
            due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
          };

          const changes: string[] = [];
          if (initialOrderState.client_id !== updatedOrderPayload.client_id) changes.push(`client: "${initialOrderState.client_name}" -> "${updatedOrderPayload.client_name}"`);
          if (initialOrderState.due_date !== updatedOrderPayload.due_date) changes.push(`date de retour: "${initialOrderState.due_date ? new Date(initialOrderState.due_date).toLocaleDateString() : 'N/A'}" -> "${updatedOrderPayload.due_date ? new Date(updatedOrderPayload.due_date).toLocaleDateString() : 'N/A'}"`);

          const oldItemsSummary = initialOrderState.items.map(i => `${i.articleName} (x${i.quantity})`).join('; ');
          const newItemsSummary = updatedOrderPayload.items.map(i => `${i.articleName} (x${i.quantity})`).join('; ');
          if (oldItemsSummary !== newItemsSummary) changes.push(`articles: "${oldItemsSummary}" -> "${newItemsSummary}"`);

          const logDescription = `Commande ${updatedOrderPayload.order_number} modifiée. ${changes.length > 0 ? `Changements: ${changes.join(', ')}.` : 'Détails mis à jour.'}`;

          await updateOrder(updatedOrderPayload, {
            action_type: LogActionType.ORDER_MODIFIED,
            description: logDescription,
          });
        }
      }
      onClose();
    } catch (error) {
      console.error("Failed to save order:", error);
      setErrors(prev => ({ ...prev, form: "Erreur lors de l'enregistrement de la commande." }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const clientOptions = clients.map(c => ({ value: c.id, label: `${c.name} (${c.phone})` }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={order ? "Modifier la commande" : "Créer une commande"} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Select
            label="Client"
            value={clientId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setClientId(e.target.value)}
            options={clientOptions}
            error={errors.client}
            placeholder="Sélectionner un client"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <h4 className="text-md font-medium text-slate-700 mb-2">Articles</h4>
          {items.map((item, index) => {
            const subcategoryOptions = getSubcategoriesForCategory(item.category);

            return (
              <div key={index} className="mb-3 p-3 border border-slate-200 rounded-md bg-slate-50 space-y-3">
                <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1.2fr_140px_120px_56px] gap-3 items-end">
                  <Select
                    label="Catégorie"
                    containerClassName="mb-0"
                    value={item.category}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => handleCategoryChange(index, e.target.value)}
                    options={availableCategories.map(category => ({ value: category, label: formatArticleCategoryLabel(category) }))}
                    required
                    disabled={isSubmitting}
                  />
                  <Select
                    label="Sous-catégorie"
                    containerClassName="mb-0"
                    value={item.subcategory}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => handleSubcategoryChange(index, e.target.value)}
                    options={subcategoryOptions.map(subcategory => ({ value: subcategory, label: subcategory }))}
                    required
                    disabled={isSubmitting}
                  />
                  <Input
                    label="Quantité"
                    containerClassName="mb-0"
                    type="number"
                    value={item.quantity}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleQuantityChange(index, parseInt(e.target.value, 10) || 1)}
                    min="1"
                    required
                    disabled={isSubmitting}
                  />
                  <div className="text-base text-slate-700 font-medium mb-2 text-right">
                    {(item.quantity * item.unitPrice).toFixed(2)} TND
                  </div>
                  <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveItem(index)} disabled={isSubmitting} className="px-3">
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-slate-500">
                  Article tarifaire sélectionné: <span className="font-medium text-slate-700">{item.articleName}</span>
                  {' | '}
                  {item.articleId ? (
                    <span>Prix unitaire: <span className="font-medium text-slate-700">{item.unitPrice.toFixed(2)} TND</span></span>
                  ) : (
                    <span className="font-semibold text-amber-600">Tarif non défini pour cette combinaison</span>
                  )}
                </div>
                {!item.articleId && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
                    <div className="mb-3 text-sm text-amber-800">
                      <span className="font-semibold">Tarif manquant.</span> Créez ce tarif pour continuer avec cette combinaison.
                    </div>
                    <div className="flex flex-col md:flex-row gap-3 md:items-end">
                      <div className="md:w-52">
                      <Input
                        label="Prix du nouveau tarif"
                        containerClassName="mb-0"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.draftTariffPrice || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => handleDraftTariffPriceChange(index, e.target.value)}
                        disabled={isSubmitting}
                      />
                      {(Number.isNaN(parseFloat(item.draftTariffPrice || '')) || parseFloat(item.draftTariffPrice || '') <= 0) && (
                        <p className="mt-1 text-xs text-amber-600">Saisissez un prix valide pour créer ce tarif.</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      onClick={() => handleCreateTariff(index)}
                      disabled={isSubmitting || Number.isNaN(parseFloat(item.draftTariffPrice || '')) || parseFloat(item.draftTariffPrice || '') <= 0}
                    >
                      Créer ce tarif
                    </Button>
                  </div>
                  </div>
                )}
              </div>
            );
          })}
          {errors.items && <p className="text-xs text-red-600 mt-1">{errors.items}</p>}
          <Button type="button" variant="secondary" size="md" onClick={handleAddItem} leftIcon={<PlusCircleIcon className="h-5 w-5" />} disabled={isSubmitting || resolvedArticles.length === 0}>
            Ajouter un article
          </Button>
        </div>

        <div className="text-right font-semibold text-lg text-slate-800">
          Total: {calculateTotal().toFixed(2)} TND
        </div>

        <div>
          <Input
            label="Date de retour prévue (optionnel)"
            type="date"
            value={dueDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDueDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            error={errors.dueDate}
            disabled={isSubmitting}
          />
        </div>
        {errors.form && <p className="text-xs text-red-600">{errors.form}</p>}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (order ? 'Mise à jour...' : 'Création...') : (order ? 'Mettre à jour la commande' : 'Créer la commande')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default OrderFormModal;
