import React from 'react';
import { OrderStatus, NavItem, UserRole, CompanyDetails } from './types';
import { ChartPieIcon, ClipboardDocumentListIcon, UsersIcon, RectangleStackIcon, HomeIcon, ChartBarIcon, QueueListIcon, UserGroupIcon, Cog6ToothIcon } from './components/icons/HeroIcons';

export const APP_NAME = "PressingApp Pro";

export const ORDER_STATUS_OPTIONS = Object.values(OrderStatus);

export const ARTICLE_CATEGORY_OPTIONS: Record<string, string[]> = {
  Pantalon: ['Jean', 'Tissu', 'Lin', 'Jogging', 'Short'],
  Chemise: ['Manches courtes', 'Manches longues', 'Soie', 'Uniforme'],
  TShirt: ['Manches courtes', 'Manches longues', 'Polo', 'Debardeur'],
  Pull: ['Laine', 'Cachemire', 'Gilet', 'Sweat'],
  Veste: ['Legere', 'Blazer', 'Jean', 'Cuir'],
  Manteau: ['Court', 'Long', 'Laine', 'Doudoune', 'Impermable'],
  Costume: ['2 pieces', '3 pieces', 'Veste seule', 'Pantalon seul'],
  Robe: ['Simple', 'Soiree', 'Mariee', 'Soie'],
  Jupe: ['Courte', 'Longue', 'Plissee', 'Jean'],
  Abaya: ['Simple', 'Brodee', 'Soiree'],
  LingeMaison: ['Drap', 'Taie', 'Housse de couette', 'Couverture', 'Serviette'],
  Couette: ['1 place', '2 places', 'King size', 'Plume'],
  Couverture: ['Legere', 'Laine', 'Epaisse', 'Bebe'],
  Rideau: ['Voilage', 'Occultant', 'Lourd', 'Double rideau'],
  Tapis: ['Petit', 'Moyen', 'Grand', 'Shaggy'],
  Chaussures: ['Basket', 'Ville', 'Sport', 'Bottes', 'Sandales'],
  Sac: ['Cuir', 'Tissu', 'Main', 'Voyage'],
  CouetteOreiller: ['Oreiller', 'Traversin', 'Protection'],
  CuirDaim: ['Veste cuir', 'Pantalon cuir', 'Sac cuir', 'Daim'],
  Repassage: ['Chemise', 'Pantalon', 'Robe', 'Costume'],
  Autres: ['Standard', 'Article delicat', 'Article special'],
};

export const ARTICLE_CATEGORIES = Object.keys(ARTICLE_CATEGORY_OPTIONS);

export const DEFAULT_ARTICLE_CATEGORY = ARTICLE_CATEGORIES[0] || '';

export const ARTICLE_CATEGORY_LABELS: Record<string, string> = {
  Pantalon: 'Pantalon',
  Chemise: 'Chemise',
  TShirt: 'T-Shirt',
  Pull: 'Pull',
  Veste: 'Veste',
  Manteau: 'Manteau',
  Costume: 'Costume',
  Robe: 'Robe',
  Jupe: 'Jupe',
  Abaya: 'Abaya',
  LingeMaison: 'Linge Maison',
  Couette: 'Couette',
  Couverture: 'Couverture',
  Rideau: 'Rideau',
  Tapis: 'Tapis',
  Chaussures: 'Chaussures',
  Sac: 'Sac',
  CouetteOreiller: 'Couette & Oreiller',
  CuirDaim: 'Cuir & Daim',
  Repassage: 'Repassage',
  Autres: 'Autres',
};

export const formatArticleCategoryLabel = (category: string): string => {
  return ARTICLE_CATEGORY_LABELS[category] || category;
};

export const buildArticleDisplayName = (category: string, subcategory: string): string => {
  const categoryLabel = formatArticleCategoryLabel(category).trim();
  const safeSubcategory = subcategory.trim();
  return safeSubcategory ? `${categoryLabel} - ${safeSubcategory}` : categoryLabel;
};

export const getDefaultArticleSubcategory = (category: string): string => {
  const subcategories = ARTICLE_CATEGORY_OPTIONS[category];
  return subcategories?.[0] || '';
};

export const splitArticleCategory = (value?: string): { category: string; subcategory: string } => {
  if (!value) {
    return {
      category: DEFAULT_ARTICLE_CATEGORY,
      subcategory: getDefaultArticleSubcategory(DEFAULT_ARTICLE_CATEGORY),
    };
  }

  const [rawCategory, ...rawSubcategoryParts] = value.split(' - ');
  const parsedCategory = rawCategory?.trim();
  const parsedSubcategory = rawSubcategoryParts.join(' - ').trim();

  if (parsedCategory && ARTICLE_CATEGORY_OPTIONS[parsedCategory]) {
    return {
      category: parsedCategory,
      subcategory: parsedSubcategory || getDefaultArticleSubcategory(parsedCategory),
    };
  }

  return {
    category: 'Autres',
    subcategory: value,
  };
};

export const inferArticleCategoryFromName = (articleName?: string): { category: string; subcategory: string } | null => {
  const normalizedName = articleName?.trim().toLowerCase();

  if (!normalizedName) {
    return null;
  }

  const keywordMappings: Array<{ keywords: string[]; category: string; subcategory: string }> = [
    { keywords: ['basket', 'sneaker', 'tennis'], category: 'Chaussures', subcategory: 'Basket' },
    { keywords: ['botte', 'boots'], category: 'Chaussures', subcategory: 'Bottes' },
    { keywords: ['sandale', 'sandales'], category: 'Chaussures', subcategory: 'Sandales' },
    { keywords: ['chemise'], category: 'Chemise', subcategory: 'Manches longues' },
    { keywords: ['pantalon'], category: 'Pantalon', subcategory: 'Tissu' },
    { keywords: ['jean'], category: 'Pantalon', subcategory: 'Jean' },
    { keywords: ['costume'], category: 'Costume', subcategory: '2 pieces' },
    { keywords: ['robe'], category: 'Robe', subcategory: 'Simple' },
    { keywords: ['jupe'], category: 'Jupe', subcategory: 'Courte' },
    { keywords: ['veste'], category: 'Veste', subcategory: 'Legere' },
    { keywords: ['manteau'], category: 'Manteau', subcategory: 'Court' },
    { keywords: ['pull', 'gilet', 'sweat'], category: 'Pull', subcategory: 'Sweat' },
    { keywords: ['rideau'], category: 'Rideau', subcategory: 'Voilage' },
    { keywords: ['tapis'], category: 'Tapis', subcategory: 'Moyen' },
    { keywords: ['couette'], category: 'Couette', subcategory: '2 places' },
    { keywords: ['couverture'], category: 'Couverture', subcategory: 'Legere' },
    { keywords: ['sac'], category: 'Sac', subcategory: 'Tissu' },
  ];

  const match = keywordMappings.find((mapping) =>
    mapping.keywords.some((keyword) => normalizedName.includes(keyword))
  );

  return match ? { category: match.category, subcategory: match.subcategory } : null;
};

export const resolveArticleClassification = (articleLike: { name?: string; category?: string }): { category: string; subcategory: string } => {
  const parsedCategory = splitArticleCategory(articleLike.category);
  const inferredCategory = inferArticleCategoryFromName(articleLike.name);
  const shouldUseInferredCategory =
    parsedCategory.category === 'Autres' &&
    (!articleLike.category || articleLike.category === 'Autres' || articleLike.category === 'Autres - Standard');

  return shouldUseInferredCategory && inferredCategory ? inferredCategory : parsedCategory;
};

export const buildArticleTariffKey = (category: string, subcategory: string): string => {
  return `${category.trim().toLowerCase()}::${subcategory.trim().toLowerCase()}`;
};

export const buildArticleCategory = (category: string, subcategory: string): string => {
  const safeCategory = category.trim();
  const safeSubcategory = subcategory.trim();
  return safeSubcategory ? `${safeCategory} - ${safeSubcategory}` : safeCategory;
};

export const USER_ROLE_OPTIONS = Object.values(UserRole).map(role => ({
  value: role,
  label: role.charAt(0).toUpperCase() + role.slice(1)
}));

export const NAVIGATION_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Tableau de bord', path: '/', icon: HomeIcon },
  { key: 'orders', label: 'Commandes', path: '/orders', icon: ClipboardDocumentListIcon },
  { key: 'articles', label: 'Articles', path: '/articles', icon: RectangleStackIcon },
  { key: 'clients', label: 'Clients', path: '/clients', icon: UsersIcon },
  { key: 'statistics', label: 'Statistiques', path: '/statistics', icon: ChartBarIcon },
  { key: 'history', label: 'Historique', path: '/history', icon: QueueListIcon },
  { key: 'adminUsers', label: 'Admin: Utilisateurs', path: '/admin/users', icon: UserGroupIcon, adminOnly: true },
  { key: 'adminSettings', label: 'Admin: Parametres', path: '/admin/settings', icon: Cog6ToothIcon, adminOnly: true },
];

export const ITEMS_PER_PAGE = 10;

export const COMPANY_DETAILS: CompanyDetails = {
  name: "Mon Pressing Super Pro (Defaut)",
  addressLine1: "1 Rue du Progres",
  addressLine2: "00000 MaVille",
  phone: "00 00 00 00 00",
  email: "contact@monpressing.pro",
  receiptFooterMessage: "Merci et a bientot !",
};
