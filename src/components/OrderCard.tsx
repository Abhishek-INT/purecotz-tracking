import { useMemo, useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, Package, Pencil, User as UserIcon } from 'lucide-react';
import type { Order, Client, Stage, OrderStage, Batch } from '../types';
import { users } from '../data/masterData';

const canEditOrder = (order: Order): boolean => {
  return order.batches.every((batch) => Object.keys(batch.progress).length === 0);
};

interface OrderCardProps {
  order: Order;
  clients: Client[];
  stages: Stage[];
  onEdit?: (order: Order) => void;
}

const statusStyles: Record<Batch['status'], string> = {
  on_time: 'bg-green-100 text-green-700 ring-1 ring-inset ring-green-200',
  at_risk: 'bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-200',
  delayed: 'bg-red-100 text-red-700 ring-1 ring-inset ring-red-200',
};

const findClientName = (clientId: string, clients: Client[]): string => {
  return clients.find((c) => c.id === clientId)?.name ?? clientId;
};

const getStageName = (orderStage: OrderStage, stages: Stage[]): string => {
  if (orderStage.customName) return orderStage.customName;
  return stages.find((s) => s.id === orderStage.stageId)?.name ?? orderStage.stageId;
};

const formatDate = (iso: string): string => {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
};

const computeBatchProgressPercent = (batch: Batch, orderStages: OrderStage[]): number => {
  const totalStages = orderStages.length || 1;
  const currentIdx = Math.min(Math.max(batch.currentStageIndex, 0), totalStages - 1);
  const currentStage = orderStages[currentIdx];
  const currentStageKey = currentStage?.stageId;
  const currentProgressList = (currentStageKey && batch.progress[currentStageKey]) || [];
  const latest = currentProgressList[currentProgressList.length - 1];
  const fractionCompletedInCurrent = latest ? Math.min(1, latest.completedQty / batch.quantity) : 0;
  const priorFraction = currentIdx / totalStages;
  const withinCurrentWeight = 1 / totalStages;
  const overall = priorFraction + fractionCompletedInCurrent * withinCurrentWeight;
  return Math.round(Math.min(1, overall) * 100);
};

const BatchCard = ({ batch, orderStages, stages }: { batch: Batch; orderStages: OrderStage[]; stages: Stage[] }) => {
  const progressPercent = useMemo(() => computeBatchProgressPercent(batch, orderStages), [batch, orderStages]);
  const currentStageName = useMemo(() => {
    const stage = orderStages[Math.min(Math.max(batch.currentStageIndex, 0), Math.max(orderStages.length - 1, 0))];
    return stage ? getStageName(stage, stages) : 'N/A';
  }, [batch.currentStageIndex, orderStages, stages]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-600">
            <Package className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h4 className="text-base font-semibold text-slate-900">{batch.name}</h4>
            <p className="text-sm text-slate-500">SKU: {batch.sku}</p>
            <p className="text-sm text-slate-500">Qty: {batch.quantity.toLocaleString()}</p>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[batch.status]}`}>
          {batch.status.replace('_', ' ')}
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Current stage</p>
          <p className="mt-1 text-sm font-medium text-slate-800">{currentStageName}</p>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Progress</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2 w-full rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="w-10 text-right text-xs font-medium text-slate-700">{progressPercent}%</span>
          </div>
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Expected completion</p>
          <p className="mt-1 text-sm font-medium text-slate-800">{formatDate(batch.expectedCompletionDate)}</p>
        </div>
      </div>
    </div>
  );
};

const OrderCard = ({ order, clients, stages, onEdit }: OrderCardProps) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const clientName = useMemo(() => findClientName(order.clientId, clients), [order.clientId, clients]);
  const orderManager = useMemo(() => users.find((u) => u.id === order.createdBy), [order.createdBy]);
  const orderStatus: Batch['status'] = useMemo(() => {
    if (order.batches.some((b) => b.status === 'delayed')) return 'delayed';
    if (order.batches.some((b) => b.status === 'at_risk')) return 'at_risk';
    return 'on_time';
  }, [order.batches]);

  return (
    <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold text-slate-900">{order.orderNumber}</h3>
            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
              <UserIcon className="h-3 w-3" />
              {orderManager?.name || 'Unknown'}
            </span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[orderStatus]}`}>
              {orderStatus.replace('_', ' ')}
            </span>
            {onEdit && canEditOrder(order) && (
              <button
                onClick={() => onEdit(order)}
                className="flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            )}
          </div>
          <p className="text-sm text-slate-600">{order.briefDescription}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1">
              <UserIcon className="h-4 w-4 text-slate-400" aria-hidden />
              <span className="font-medium text-slate-700">{clientName}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4 text-slate-400" aria-hidden />
              <span>Created: {formatDate(order.createdDate)}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4 text-slate-400" aria-hidden />
              <span>Deadline: {formatDate(order.deadline)}</span>
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Batches
          <span className="ml-1 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
            {order.batches.length}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-500" aria-hidden />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden />
          )}
        </button>
      </header>

      {expanded && (
        <div className="space-y-4 p-5">
          {order.batches.map((batch) => (
            <BatchCard key={batch.id} batch={batch} orderStages={order.stages} stages={stages} />
          ))}
        </div>
      )}
    </article>
  );
};

export default OrderCard;


