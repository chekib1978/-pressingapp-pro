import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../App';
import { Article, AppContextType, UserRole } from '../../types';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import QuickTariffManagerModal from './components/QuickTariffManagerModal';
import { PencilSquareIcon, TrashIcon } from '../../components/icons/HeroIcons';
import { ARTICLE_CATEGORIES, formatArticleCategoryLabel, splitArticleCategory } from '../../constants';

interface ArticlesViewProps {
  onEdit: (article: Article) => void;
}

const ArticlesView: React.FC<ArticlesViewProps> = ({ onEdit }) => {
  const context = useContext(AppContext) as AppContextType | null;
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [isQuickTariffModalOpen, setIsQuickTariffModalOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);

  if (!context) return <p>Chargement du contexte...</p>;
  const { articles, isLoading, appError, setAppError, currentUser } = context;

  const availableCategories = useMemo(() => {
    const presentCategories = new Set(articles.map((article) => splitArticleCategory(article.category).category));
    return ARTICLE_CATEGORIES.filter((category) => presentCategories.has(category));
  }, [articles]);

  const filteredArticles = articles.filter((article) => {
    const parsedCategory = splitArticleCategory(article.category);
    const normalizedSearch = searchTerm.toLowerCase();
    const matchesSearch =
      article.name.toLowerCase().includes(normalizedSearch) ||
      article.category.toLowerCase().includes(normalizedSearch) ||
      formatArticleCategoryLabel(parsedCategory.category).toLowerCase().includes(normalizedSearch) ||
      parsedCategory.subcategory.toLowerCase().includes(normalizedSearch);
    const matchesCategory = !categoryFilter || parsedCategory.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteRequest = (article: Article) => {
    setArticleToDelete(article);
    setIsConfirmDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (articleToDelete && context) {
      try {
        await context.deleteArticle(articleToDelete.id);
        setAppError(null);
      } catch (error: any) {
        console.error("Erreur lors de la suppression de l'article:", error);
      } finally {
        setIsConfirmDeleteModalOpen(false);
        setArticleToDelete(null);
      }
    }
  };

  const renderArticleActions = (item: Article) => (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="px-4">
        <PencilSquareIcon className="h-5 w-5 text-white" />
      </Button>
      {currentUser?.role === UserRole.ADMIN && (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteRequest(item); }} className="px-4">
          <TrashIcon className="h-5 w-5 text-red-500" />
        </Button>
      )}
    </div>
  );

  const columns = [
    { header: 'Article tarifaire', accessor: 'name' as keyof Article, className: 'font-medium' },
    {
      header: 'Categorie',
      accessor: (item: Article) => {
        const parsedCategory = splitArticleCategory(item.category);
        return formatArticleCategoryLabel(parsedCategory.category);
      }
    },
    {
      header: 'Sous-categorie',
      accessor: (item: Article) => splitArticleCategory(item.category).subcategory
    },
    { header: 'Prix', accessor: (item: Article) => `${item.price.toFixed(2)} TND`, className: 'text-right' },
    {
      header: 'Actions',
      accessor: (item: Article) => <div className="flex justify-end">{renderArticleActions(item)}</div>,
      className: 'text-right'
    },
  ];

  if (isLoading && articles.length === 0 && !appError) {
    return <p>Chargement des articles...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-700">Gestion des articles ({filteredArticles.length})</h2>
          <Button type="button" variant="secondary" size="md" onClick={() => setIsQuickTariffModalOpen(true)}>
            Tarifs rapides
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-3">
          <input
            type="text"
            placeholder="Rechercher par article, categorie ou sous-categorie..."
            className="min-h-[48px] px-4 py-2.5 border border-slate-300 rounded-lg shadow-sm text-base focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
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
      </div>

      <div className="space-y-4 xl:hidden">
        {isLoading && filteredArticles.length > 0 && <p className="text-slate-500">Chargement...</p>}
        {!isLoading && filteredArticles.length === 0 && (
          <div className="rounded-xl bg-white p-6 text-center text-slate-500 shadow">
            Aucun article trouve. Ajoutez-en un pour commencer.
          </div>
        )}
        {filteredArticles.map((article) => {
          const parsedCategory = splitArticleCategory(article.category);
          return (
            <div key={article.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-slate-800">{article.name}</p>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p>Categorie: <span className="font-medium text-slate-800">{formatArticleCategoryLabel(parsedCategory.category)}</span></p>
                    <p>Sous-categorie: <span className="font-medium text-slate-800">{parsedCategory.subcategory}</span></p>
                    <p>Prix: <span className="font-semibold text-slate-800">{article.price.toFixed(2)} TND</span></p>
                  </div>
                </div>
                {renderArticleActions(article)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden xl:block">
        <Table<Article>
          columns={columns}
          data={filteredArticles}
          isLoading={isLoading && articles.length > 0 && !appError}
          emptyStateMessage="Aucun article trouve. Ajoutez-en un pour commencer."
        />
      </div>

      {articleToDelete && (
        <ConfirmationModal
          isOpen={isConfirmDeleteModalOpen}
          onClose={() => setIsConfirmDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Confirmer la suppression"
          message={<p>Etes-vous sur de vouloir supprimer l'article <strong className="font-semibold">{articleToDelete.name}</strong> ? Cette action est irreversible.</p>}
          confirmButtonText="Supprimer"
          confirmButtonVariant="danger"
        />
      )}
      <QuickTariffManagerModal
        isOpen={isQuickTariffModalOpen}
        onClose={() => setIsQuickTariffModalOpen(false)}
        articles={articles}
        context={context}
      />
    </div>
  );
};

export default ArticlesView;
