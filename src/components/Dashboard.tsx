import { useEffect, useMemo, useState, ChangeEvent } from 'react';
import { AlertCircle, CheckCircle, Clock, Package, Plus, Search } from 'lucide-react';
import type { Order, User } from '../types';
import { clients, stages, users } from '../data/masterData';
import { DataService } from '../services/DataService';
import OrderCard from './OrderCard';
import CreateOrder from './CreateOrder';

interface DashboardProps {
  user: User;
}

type StatusFilter = 'all' | 'on_time' | 'at_risk' | 'delayed';

const statusLabel: Record<Exclude<StatusFilter, 'all'>, string> = {
  on_time: 'On Time',
  at_risk: 'At Risk',
  delayed: 'Delayed',
};

const getOrderStatus = (order: Order): Exclude<StatusFilter, 'all'> => {
  if (order.batches.some((b) => b.status === 'delayed')) return 'delayed';
  if (order.batches.some((b) => b.status === 'at_risk')) return 'at_risk';
  return 'on_time';
};

const Dashboard = ({ user }: DashboardProps) => {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState<string>('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [orderManagerId, setOrderManagerId] = useState<string>('all');
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  useEffect(() => {
    const loaded = DataService.getAllOrders();
    setAllOrders(loaded);
  }, []);

  const orderManagerOptions = useMemo(
    () => users.filter((u) => u.role === 'OrderManager'),
    [],
  );

  const visibleOrders = useMemo(() => {
    // Base role filter
    let orders =
      user.role === 'ProductionManager'
        ? allOrders
        : allOrders.filter((o) => o.createdBy === user.id);

    // Order Manager filter (visible only for ProductionManager)
    if (user.role === 'ProductionManager' && orderManagerId !== 'all') {
      orders = orders.filter((o) => o.createdBy === orderManagerId);
    }

    // Order number search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      orders = orders.filter((o) => o.orderNumber.toLowerCase().includes(q));
    }

    // Status filter (by batches)
    if (status !== 'all') {
      const desired = status as Exclude<StatusFilter, 'all'>;
      orders = orders.filter((o) => getOrderStatus(o) === desired);
    }

    return orders;
  }, [allOrders, orderManagerId, search, status, user.id, user.role]);

  const metrics = useMemo(() => {
    const orders = visibleOrders;
    const allBatches = orders.flatMap((o) => o.batches);
    const onTime = allBatches.filter((b) => b.status === 'on_time').length;
    const atRisk = allBatches.filter((b) => b.status === 'at_risk').length;
    const delayed = allBatches.filter((b) => b.status === 'delayed').length;
    return {
      totalOrders: orders.length,
      onTime,
      atRisk,
      delayed,
    };
  }, [visibleOrders]);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Order button */}
      <section className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Orders Dashboard</h2>
        <button
          onClick={() => setShowCreateOrder(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Order
        </button>
      </section>

      {/* Metrics */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-50 text-slate-600">
            <Package className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Orders</p>
            <p className="text-2xl font-semibold text-slate-900">{metrics.totalOrders}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-white p-4 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-green-50 text-green-600">
            <CheckCircle className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide text-green-600">On Time Batches</p>
            <p className="text-2xl font-semibold text-green-700">{metrics.onTime}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-white p-4 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-50 text-orange-600">
            <Clock className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide text-orange-600">At Risk Batches</p>
            <p className="text-2xl font-semibold text-orange-700">{metrics.atRisk}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-white p-4 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-red-50 text-red-600">
            <AlertCircle className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide text-red-600">Delayed Batches</p>
            <p className="text-2xl font-semibold text-red-700">{metrics.delayed}</p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          {user.role === 'ProductionManager' && (
            <div className="flex flex-col gap-1">
              <label htmlFor="manager-filter" className="text-xs font-medium text-slate-600">
                Order Manager
              </label>
              <select
                id="manager-filter"
                value={orderManagerId}
                onChange={(e) => setOrderManagerId(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">All</option>
                {orderManagerOptions.map((om) => (
                  <option key={om.id} value={om.id}>
                    {om.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label htmlFor="order-search" className="text-xs font-medium text-slate-600">
              Search Order Number
            </label>
            <div className="relative">
              <input
                id="order-search"
                value={search}
                onChange={handleSearch}
                placeholder="e.g. ORD-2025-001"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-9 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="status-filter" className="text-xs font-medium text-slate-600">
              Status
            </label>
            <select
              id="status-filter"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All</option>
              <option value="on_time">{statusLabel.on_time}</option>
              <option value="at_risk">{statusLabel.at_risk}</option>
              <option value="delayed">{statusLabel.delayed}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Orders list */}
      <section className="space-y-4">
        {visibleOrders.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
            No orders found.
          </div>
        ) : (
          visibleOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              clients={clients}
              stages={stages}
              onEdit={(order) => setEditingOrder(order)}
            />
          ))
        )}
      </section>

      {/* Create Order Modal */}
      {(showCreateOrder || editingOrder) && (
        <CreateOrder
          editOrder={editingOrder || undefined}
          onComplete={() => {
            setShowCreateOrder(false);
            setEditingOrder(null);
            setAllOrders(DataService.getAllOrders());
          }}
          onCancel={() => {
            setShowCreateOrder(false);
            setEditingOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;


