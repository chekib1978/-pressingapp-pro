import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../../App';
import { Article, AppContextType } from '../../../types';
import Modal from '../../../components/common/Modal';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';
import {
  ARTICLE_CATEGORIES,
  ARTICLE_CATEGORY_OPTIONS,
  DEFAULT_ARTICLE_CATEGORY,
  buildArticleCategory,
  buildArticleDisplayName,
  buildArticleTariffKey,
  formatArticleCategoryLabel,
  getDefaultArticleSubcategory,
  inferArticleCategoryFromName,
  resolveArticleClassification,
  splitArticleCategory,
} from '../../../constants';

interface ArticleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  article?: Article;
}

const ArticleFormModal: React.FC<ArticleFormModalProps> = ({ isOpen, onClose, article }) => {
  const context = useContext(AppContext) as AppContextType | null;
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(DEFAULT_ARTICLE_CATEGORY);
  const [subcategory, setSubcategory] = useState(getDefaultArticleSubcategory(DEFAULT_ARTICLE_CATEGORY));
  const [errors, setErrors] = useState<{ price?: string; category?: string; subcategory?: string; form?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (article) {
      const parsedCategory = splitArticleCategory(article.category);
      const inferredCategory = inferArticleCategoryFromName(article.name);
      const shouldUseInferredCategory =
        parsedCategory.category === 'Autres' &&
        (!article.category || article.category === 'Autres' || article.category === 'Autres - Standard');
      const resolvedCategory = shouldUseInferredCategory && inferredCategory ? inferredCategory : parsedCategory;

      setPrice(String(article.price));
      setCategory(resolvedCategory.category);
      setSubcategory(resolvedCategory.subcategory);
    } else {
      setPrice('');
      setCategory(DEFAULT_ARTICLE_CATEGORY);
      setSubcategory(getDefaultArticleSubcategory(DEFAULT_ARTICLE_CATEGORY));
    }

    setErrors({});
    setIsSubmitting(false);
  }, [isOpen, article]);

  if (!context) return null;
  const { addArticle, updateArticle, articles } = context;

  const availableSubcategories = ARTICLE_CATEGORY_OPTIONS[category] || [];
  const generatedArticleName = buildArticleDisplayName(category, subcategory);

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setSubcategory(getDefaultArticleSubcategory(value));
  };

  const validate = (): boolean => {
    const newErrors: { price?: string; category?: string; subcategory?: string; form?: string } = {};
    const priceNum = parseFloat(price);

    if (isNaN(priceNum) || priceNum <= 0) newErrors.price = "Le prix doit etre un nombre positif.";
    if (!category.trim()) newErrors.category = "La categorie est requise.";
    if (availableSubcategories.length > 0 && !subcategory.trim()) newErrors.subcategory = "La sous-categorie est requise.";

    const currentTariffKey = buildArticleTariffKey(category, subcategory);
    const duplicateArticle = articles.find((existingArticle) => {
      if (article && existingArticle.id === article.id) return false;
      const existingClassification = resolveArticleClassification(existingArticle);
      return buildArticleTariffKey(existingClassification.category, existingClassification.subcategory) === currentTariffKey;
    });

    if (duplicateArticle) {
      newErrors.form = `Le tarif "${duplicateArticle.name}" existe deja. Utilisez sa fiche pour modifier le prix.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);

    const articleData = {
      name: generatedArticleName,
      price: parseFloat(price),
      category: buildArticleCategory(category, subcategory),
    };

    try {
      if (article) {
        await updateArticle({ ...article, ...articleData });
      } else {
        await addArticle(articleData);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save article:", error);
      setErrors(prev => ({ ...prev, form: "Erreur lors de l'enregistrement de l'article." }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={article ? "Modifier l'Article" : "Ajouter un Article"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nom de l'article (genere automatiquement)"
          value={generatedArticleName}
          readOnly
          disabled
        />
        <Input
          label="Prix (TND)"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={errors.price}
          min="0.01"
          step="0.01"
          required
          disabled={isSubmitting}
        />
        <Select
          label="Categorie"
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          options={ARTICLE_CATEGORIES.map(cat => ({ value: cat, label: formatArticleCategoryLabel(cat) }))}
          error={errors.category}
          required
          disabled={isSubmitting}
        />
        <Select
          label="Sous-categorie"
          value={subcategory}
          onChange={(e) => setSubcategory(e.target.value)}
          options={availableSubcategories.map(subcat => ({ value: subcat, label: subcat }))}
          error={errors.subcategory}
          required
          disabled={isSubmitting}
        />
        {errors.form && <p className="text-xs text-red-600">{errors.form}</p>}
        <div className="rounded-md bg-slate-50 border border-slate-200 p-3 text-sm text-slate-600">
          Le prix saisi sera applique a cet article tarifaire: <span className="font-semibold text-slate-800">{generatedArticleName}</span>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (article ? 'Mise a jour...' : 'Ajout...') : (article ? 'Mettre a jour' : 'Ajouter')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ArticleFormModal;
