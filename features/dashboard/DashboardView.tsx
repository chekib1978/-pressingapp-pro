
import React, { useContext } from 'react';
import { AppContext } from '../../App';
import StatCard from './components/StatCard';
import { OrderStatus, Order } from '../../types'; // Added Order type
import { CurrencyEuroIcon, ClipboardDocumentCheckIcon, ClockIcon, UserGroupIcon, ExclamationTriangleIcon } from '../../components/icons/HeroIcons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const DashboardView: React.FC = () => {
  const context = useContext(AppContext);

  if (!context) return <p>Chargement du contexte...</p>;
  const { orders, articles, clients, isLoading, appError } = context;

  if (isLoading && !appError) {
    return <p>Chargement des données du tableau de bord...</p>;
  }
  if (appError) {
      return <p className="text-red-500">Erreur de chargement: {appError}</p>
  }


  const totalRevenue = orders
    .filter(o => o.status === OrderStatus.PAID || o.is_paid)
    .reduce((sum, order) => sum + order.total_amount, 0);
  
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === OrderStatus.RECEIVED || o.status === OrderStatus.PROCESSING).length;
  // const readyOrders = orders.filter(o => o.status === OrderStatus.READY_FOR_PICKUP).length; // Not used currently
  const totalClients = clients.length;

  const ordersByStatusData = Object.values(OrderStatus).map(status => ({
    name: status,
    count: orders.filter(o => o.status === status).length,
  })).filter(s => s.count > 0); // Only show statuses with orders

  const popularArticlesData = articles.map(article => {
    const count = orders.reduce((acc, order) => {
      const item = order.items.find(i => i.articleId === article.id);
      return acc + (item ? item.quantity : 0);
    }, 0);
    return { name: article.name, count };
  }).filter(a => a.count > 0).sort((a,b) => b.count - a.count).slice(0, 5);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ec4899'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Revenu Total" value={`${totalRevenue.toFixed(2)} TND`} icon={<CurrencyEuroIcon className="h-8 w-8 text-green-500" />} />
        <StatCard title="Commandes Totales" value={String(totalOrders)} icon={<ClipboardDocumentCheckIcon className="h-8 w-8 text-blue-500" />} />
        <StatCard title="Commandes en Attente" value={String(pendingOrders)} icon={<ClockIcon className="h-8 w-8 text-yellow-500" />} />
        <StatCard title="Clients Enregistrés" value={String(totalClients)} icon={<UserGroupIcon className="h-8 w-8 text-purple-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Commandes par Statut</h3>
          {ordersByStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ordersByStatusData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip wrapperStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }}/>
                <Bar dataKey="count" fill="#3b82f6" name="Nombre de commandes" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex flex-col items-center justify-center h-[300px] text-slate-500">
                <ExclamationTriangleIcon className="h-12 w-12 mb-2" />
                <p>Aucune donnée de commande disponible pour afficher le graphique.</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Articles Populaires (Top 5)</h3>
          {popularArticlesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={popularArticlesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="name"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {popularArticlesData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip wrapperStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }}/>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-slate-500">
                <ExclamationTriangleIcon className="h-12 w-12 mb-2" />
                <p>Pas assez de données pour afficher les articles populaires.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;