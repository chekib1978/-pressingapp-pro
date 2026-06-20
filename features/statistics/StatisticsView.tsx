
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../App';
import { OrderStatus, Article, Client, Order } from '../../types';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ExclamationTriangleIcon } from '../../components/icons/HeroIcons';

const COLORS = ['#14b8a6', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const MONTH_ORDER_FR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];


const StatisticsView: React.FC = () => {
  const context = useContext(AppContext);

  if (!context) {
    return <div className="p-6 text-center text-slate-500">Chargement du contexte des statistiques...</div>;
  }
   const { orders, articles, clients, isLoading, appError } = context;

   if (isLoading && !appError) {
    return <p>Chargement des données statistiques...</p>;
  }
  if (appError) {
      return <p className="text-red-500">Erreur de chargement: {appError}</p>
  }


  const paidOrders = useMemo(() => orders.filter(o => o.is_paid || o.status === OrderStatus.PAID), [orders]);

  const monthlyRevenueData = useMemo(() => {
    const dataByMonth: { [key: string]: { revenue: number, year: number, monthIndex: number} } = {};
    paidOrders.forEach(order => {
      const orderDate = new Date(order.order_date); // Use order_date
      const monthShort = orderDate.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''); // remove dot for consistency
      const year = orderDate.getFullYear();
      const monthYearKey = `${monthShort} ${year}`;
      
      if (!dataByMonth[monthYearKey]) {
        dataByMonth[monthYearKey] = { revenue: 0, year: year, monthIndex: MONTH_ORDER_FR.indexOf(monthShort) };
      }
      dataByMonth[monthYearKey].revenue += order.total_amount; // Use total_amount
    });
    
    return Object.entries(dataByMonth)
        .map(([name, data]) => ({ name, Revenu: parseFloat(data.revenue.toFixed(2)), year: data.year, monthIndex: data.monthIndex }))
        .sort((a,b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.monthIndex - b.monthIndex;
        });
  }, [paidOrders]);

  const ordersByStatusData = useMemo(() => {
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<OrderStatus, number>);
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value })).filter(s => s.value > 0);
  }, [orders]);

  const topArticlesData = useMemo(() => {
    const articleQuantities: { [articleId: string]: { name: string, quantity: number } } = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!articleQuantities[item.articleId]) {
          const articleInfo = articles.find(a => a.id === item.articleId);
          articleQuantities[item.articleId] = { name: articleInfo?.name || 'Article Inconnu', quantity: 0 };
        }
        articleQuantities[item.articleId].quantity += item.quantity;
      });
    });
    return Object.values(articleQuantities)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5) 
      .map(item => ({ name: item.name, Quantité: item.quantity }));
  }, [orders, articles]);

  const topClientsData = useMemo(() => {
    const clientSpending: { [clientId: string]: { name: string, totalSpent: number, orderCount: number } } = {};
    paidOrders.forEach(order => {
      if (!clientSpending[order.client_id]) { // Use client_id
        const clientInfo = clients.find(c => c.id === order.client_id); // Use client_id
        clientSpending[order.client_id] = { name: clientInfo?.name || 'Client Inconnu', totalSpent: 0, orderCount: 0 };
      }
      clientSpending[order.client_id].totalSpent += order.total_amount; // Use total_amount
      clientSpending[order.client_id].orderCount += 1;
    });
    return Object.values(clientSpending)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5) 
      .map(client => ({ name: client.name, "Total Dépensé": parseFloat(client.totalSpent.toFixed(2)), "Nb Commandes": client.orderCount }));
  }, [paidOrders, clients]);


  const renderChartOrEmptyState = (data: unknown[], chartType: 'line' | 'bar' | 'pie', title: string, dataKey: string, nameKey?: string) => {
    if (!Array.isArray(data) || data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] text-slate-500 py-10">
          <ExclamationTriangleIcon className="h-12 w-12 mb-2" />
          <p>Pas assez de données pour afficher: {title}</p>
        </div>
      );
    }

    const ActualChart = () => {
      if (chartType === 'line') {
        return (
          <LineChart data={data as any[]} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }}/>
            <YAxis tickFormatter={(value) => `${value} TND`} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(value: number) => `${value.toFixed(2)} TND`} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey={dataKey} stroke={COLORS[0]} activeDot={{ r: 8 }} name="Revenu" />
          </LineChart>
        );
      }
      if (chartType === 'bar') {
        return (
          <BarChart data={data as any[]} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={dataKey.toLowerCase().includes("total") ? true : false} tickFormatter={dataKey.toLowerCase().includes("total") ? (value) => `${value} TND` : undefined} />
            <Tooltip formatter={dataKey.toLowerCase().includes("total") ? (value:number) => `${value.toFixed(2)} TND` : (value: number) => value} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey={dataKey} fill={COLORS[1]} name={dataKey.replace(/([A-Z])/g, ' $1').trim()} />
          </BarChart>
        );
      }
      if (chartType === 'pie' && nameKey) {
        return (
          <PieChart>
            <Pie data={data as any[]} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
              {(data as any[]).map((_entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
          </PieChart>
        );
      }
      return null;
    };
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <ActualChart />
      </ResponsiveContainer>
    );
  };


  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-800">Statistiques Détaillées</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Revenu Mensuel (Payé)</h3>
          {renderChartOrEmptyState(monthlyRevenueData, 'line', 'Revenu Mensuel', 'Revenu')}
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Répartition des Commandes par Statut</h3>
          {renderChartOrEmptyState(ordersByStatusData, 'pie', 'Commandes par Statut', 'value', 'name')}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Top 5 Articles par Quantité Vendue</h3>
          {renderChartOrEmptyState(topArticlesData, 'bar', 'Top Articles', 'Quantité')}
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Top 5 Clients par Total Dépensé</h3>
          {renderChartOrEmptyState(topClientsData, 'bar', 'Top Clients', 'Total Dépensé')}
        </div>
      </div>
    </div>
  );
};

export default StatisticsView;
