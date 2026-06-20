import React, { useEffect, useMemo, useState } from 'react';
import { Article, AppContextType } from '../../../types';
import Modal from '../../../components/common/Modal';
import Select from '../../../components/common/Select';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import { formatArticleCategoryLabel, splitArticleCategory } from '../../../constants';

interface QuickTariffManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: Article[];
  context: AppContextType;
}

const QuickTariffManagerModal: React.FC<QuickTariffManagerModalProps> = ({ isOpen, onClose, articles, context }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const nextDraftPrices: Record<string, string> = {};
    articles.forEach((article) => {
      nextDraftPrices[article.id] = String(article.price);
    });
    setDraftPrices(nextDraftPrices);
    setSavingIds({});
    setErrorMessage(null);
    setSearchTerm('');
    setCategoryFilter('');
  }, [isOpen, articles]);

  const availableCategories = useMemo(() => {
    return Array.from(
      new Set(articles.map((article) => splitArticleCategory(article.category).category))
    ).sort((a, b) => formatArticleCategoryLabel(a).localeCompare(formatArticleCategoryLabel(b), 'fr'));
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return [...articles]
      .filter((article) => {
        const parsedCategory = splitArticleCategory(article.category);
        const normalizedSearch = searchTerm.toLowerCase();
        const matchesSearch =
          article.name.toLowerCase().includes(normalizedSearch) ||
          formatArticleCategoryLabel(parsedCategory.category).toLowerCase().includes(normalizedSearch) ||
          parsedCategory.subcategory.toLowerCase().includes(normalizedSearch);
        const matchesCategory = !categoryFilter || parsedCategory.category === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, [articles, searchTerm, categoryFilter]);

  const handleDraftPriceChange = (articleId: string, nextValue: string) => {
    setDraftPrices((prev) => ({ ...prev, [articleId]: nextValue }));
  };

  const handleSavePrice = async (article: Article) => {
    const nextPrice = parseFloat(draftPrices[article.id] ?? '');

    if (Number.isNaN(nextPrice) || nextPrice <= 0) {
      setErrorMessage(`Prix invalide pour "${article.name}".`);
      return;
    }

    setSavingIds((prev) => ({ ...prev, [article.id]: true }));
    setErrorMessage(null);

    try {
      await context.updateArticle({ ...article, price: nextPrice });
    } catch (error: any) {
      setErrorMessage(error?.message || `Erreur lors de la mise a jour de "${article.name}".`);
    } finally {
      setSavingIds((prev) => ({ ...prev, [article.id]: false }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestion rapide des tarifs" size="xl">
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">Mise a jour rapide des prix</h4>
              <p className="text-sm text-slate-600">
                Modifiez les tarifs existants sans ouvrir chaque fiche article.
              </p>
            </div>
            <div className="text-sm font-medium text-slate-700">
              {filteredArticles.length} tarif{filteredArticles.length > 1 ? 's' : ''} affiche{filteredArticles.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.5fr_1fr]">
          <Input
            label="Recherche"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Article, categorie ou sous-categorie..."
            containerClassName="mb-0"
          />
          <Select
            label="Categorie"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={availableCategories.map((category) => ({
              value: category,
              label: formatArticleCategoryLabel(category),
            }))}
            placeholder="Toutes les categories"
            containerClassName="mb-0"
          />
        </div>

        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="space-y-3 xl:hidden">
          {filteredArticles.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
              Aucun tarif ne correspond a ce filtre.
            </div>
          ) : (
            filteredArticles.map((article) => {
              const parsedCategory = splitArticleCategory(article.category);
              const isSaving = !!savingIds[article.id];
              const currentDraftValue = draftPrices[article.id] ?? String(article.price);
              const draftPrice = parseFloat(currentDraftValue);
              const hasChanged = !Number.isNaN(draftPrice) && draftPrice !== article.price;

              return (
                <div key={article.id} className={`rounded-2xl border p-4 shadow-sm ${hasChanged ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-white'}`}>
                  <div className="space-y-3">
                    <div>
                      <p className="text-base font-semibold text-slate-800">{article.name}</p>
                      <div className="mt-1 space-y-1 text-sm text-slate-600">
                        <p>Categorie: {formatArticleCategoryLabel(parsedCategory.category)}</p>
                        <p>Sous-categorie: {parsedCategory.subcategory}</p>
                        <p>Prix actuel: <span className="font-medium text-slate-800">{article.price.toFixed(2)} TND</span></p>
                      </div>
                    </div>
                    <Input
                      label="Nouveau prix"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={currentDraftValue}
                      onChange={(e) => handleDraftPriceChange(article.id, e.target.value)}
                      containerClassName="mb-0"
                      disabled={isSaving}
                      className={hasChanged ? 'border-amber-400 bg-amber-50 focus:border-amber-500' : ''}
                    />
                    <Button
                      type="button"
                      size="md"
                      variant="primary"
                      onClick={() => handleSavePrice(article)}
                      disabled={isSaving || !hasChanged}
                      className="w-full"
                    >
                      {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="hidden xl:block max-h-[60vh] overflow-y-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 bg-white">
            <thead className="sticky top-0 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Article tarifaire</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Categorie</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Sous-categorie</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Prix</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                    Aucun tarif ne correspond a ce filtre.
                  </td>
                </tr>
              ) : (
                filteredArticles.map((article) => {
                  const parsedCategory = splitArticleCategory(article.category);
                  const isSaving = !!savingIds[article.id];
                  const currentDraftValue = draftPrices[article.id] ?? String(article.price);
                  const draftPrice = parseFloat(currentDraftValue);
                  const hasChanged = !Number.isNaN(draftPrice) && draftPrice !== article.price;

                  return (
                    <tr key={article.id} className={hasChanged ? 'bg-amber-50/50' : ''}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{article.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{formatArticleCategoryLabel(parsedCategory.category)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{parsedCategory.subcategory}</td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={currentDraftValue}
                          onChange={(e) => handleDraftPriceChange(article.id, e.target.value)}
                          className={`w-32 rounded-lg border px-3 py-2.5 text-right text-sm shadow-sm focus:outline-none focus:ring-brand-primary ${hasChanged ? 'border-amber-400 bg-amber-50 focus:border-amber-500' : 'border-slate-300 focus:border-brand-primary'}`}
                          disabled={isSaving}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="primary"
                          onClick={() => handleSavePrice(article)}
                          disabled={isSaving || !hasChanged}
                        >
                          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default QuickTariffManagerModal;
