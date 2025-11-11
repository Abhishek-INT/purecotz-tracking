import { useState, useMemo, useEffect } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { Calendar, CheckCircle, Package, ChevronUp, ChevronDown, X } from 'lucide-react';
import type { Order, OrderStage, Batch } from '../types';
import { clients, stages, lineManagers, users } from '../data/masterData';
import { DataService } from '../services/DataService';
import useAuth from '../hooks/useAuth';

interface CreateOrderProps {
  onComplete: () => void;
  onCancel: () => void;
  editOrder?: Order;
}

interface StageConfig {
  stageId: string;
  lineManagerId: string;
  customName?: string;
}

interface BatchInput {
  name: string;
  sku: string;
  quantity: number;
}

const stageLookup = new Map(stages.map((stage) => [stage.id, stage]));

const getStageDays = (stageId: string, quantity: number): number => {
  const stage = stageLookup.get(stageId);
  if (!stage) {
    return 1;
  }

  const tier = stage.defaultDaysPerTier.find((t) => quantity <= t.maxUnits);
  return tier ? tier.days : stage.defaultDaysPerTier[stage.defaultDaysPerTier.length - 1].days;
};

const formatDate = (date: Date): string => format(date, 'yyyy-MM-dd');

const addWorkingDays = (startDate: Date, days: number): Date => {
  let cursor = new Date(startDate);
  let daysAdded = 0;
  const targetDays = Math.ceil(days);

  while (daysAdded < targetDays) {
    cursor = addDays(cursor, 1);
    if (cursor.getDay() !== 0) {
      daysAdded++;
    }
  }

  return cursor;
};

const CreateOrder = ({ onComplete, onCancel, editOrder }: CreateOrderProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [orderData, setOrderData] = useState({
    orderNumber: '',
    assignedToId: '',
    startDate: '',
    clientId: '',
    briefDescription: '',
    detailedDescription: '',
    deadline: '',
  });
  const [selectedStages, setSelectedStages] = useState<StageConfig[]>([]);
  const [batches, setBatches] = useState<BatchInput[]>([{ name: '', sku: '', quantity: 0 }]);

  useEffect(() => {
    if (editOrder) {
      setOrderData({
        orderNumber: editOrder.orderNumber,
        assignedToId: editOrder.createdBy,
        clientId: editOrder.clientId,
        briefDescription: editOrder.briefDescription,
        detailedDescription: editOrder.detailedDescription || '',
        deadline: editOrder.deadline,
        startDate: editOrder.createdDate,
      });

      const stageConfigs: StageConfig[] = editOrder.stages.map((stage) => ({
        stageId: stage.stageId,
        lineManagerId: stage.lineManagerId,
        customName: stage.customName,
      }));
      setSelectedStages(stageConfigs);

      const batchInputs: BatchInput[] = editOrder.batches.map((batch) => ({
        name: batch.name,
        sku: batch.sku,
        quantity: batch.quantity,
      }));
      setBatches(batchInputs);
    } else if (user?.role === 'OrderManager') {
      setOrderData((prev) => ({ ...prev, assignedToId: user.id }));
    }
  }, [editOrder, user]);

  const availableStages = useMemo(() => {
    return stages;
  }, []);

  const getLineManagersForStage = (stageId: string) => {
    return lineManagers.filter((lm) => lm.stages.includes(stageId));
  };

  const moveStage = (index: number, direction: 'up' | 'down') => {
    const newStages = [...selectedStages];
    if (direction === 'up' && index > 0) {
      [newStages[index - 1], newStages[index]] = [newStages[index], newStages[index - 1]];
      setSelectedStages(newStages);
    } else if (direction === 'down' && index < newStages.length - 1) {
      [newStages[index], newStages[index + 1]] = [newStages[index + 1], newStages[index]];
      setSelectedStages(newStages);
    }
  };

  const addStage = (stageId: string) => {
    const stage = stages.find((s) => s.id === stageId);
    if (!stage) return;

    const managers = getLineManagersForStage(stageId);
    setSelectedStages([
      ...selectedStages,
      {
        stageId,
        lineManagerId: managers[0]?.id || '',
        customName: stage.name,
      },
    ]);
  };

  const removeStage = (index: number) => {
    setSelectedStages(selectedStages.filter((_, i) => i !== index));
  };

  const updateStage = (index: number, updates: Partial<StageConfig>) => {
    const newStages = [...selectedStages];
    newStages[index] = { ...newStages[index], ...updates };
    setSelectedStages(newStages);
  };

  const addBatch = () => {
    setBatches([...batches, { name: '', sku: '', quantity: 0 }]);
  };

  const removeBatch = (index: number) => {
    if (batches.length > 1) {
      setBatches(batches.filter((_, i) => i !== index));
    }
  };

  const updateBatch = (index: number, updates: Partial<BatchInput>) => {
    const newBatches = [...batches];
    newBatches[index] = { ...newBatches[index], ...updates };
    setBatches(newBatches);
  };

  const buildOrderStages = (): OrderStage[] => {
    let cursor = parseISO(orderData.startDate);

    return selectedStages.map((config, index) => {
      const maxDays = batches.reduce((max, batch) => {
        const days = getStageDays(config.stageId, batch.quantity);
        return Math.max(max, days);
      }, 0);

      const expectedStartDate = formatDate(cursor);
      const expectedEndDate = formatDate(addWorkingDays(cursor, Math.max(maxDays - 1, 0)));

      const stage: OrderStage = {
        stageId: config.stageId,
        customName: config.customName,
        lineManagerId: config.lineManagerId,
        expectedDays: maxDays,
        sequence: index + 1,
        expectedStartDate,
        expectedEndDate,
      };

      cursor = addWorkingDays(cursor, maxDays);
      return stage;
    });
  };

  const calculateBatchCompletionDate = (quantity: number): string => {
    if (selectedStages.length === 0) {
      return orderData.deadline || formatDate(new Date());
    }

    if (!orderData.startDate) {
      return orderData.deadline || formatDate(new Date());
    }

    let cursor = parseISO(orderData.startDate);

    for (const config of selectedStages) {
      const days = getStageDays(config.stageId, quantity);
      cursor = addWorkingDays(cursor, days);
    }

    return formatDate(cursor);
  };

  const handleStep1Next = () => {
    if (
      orderData.orderNumber &&
      orderData.assignedToId &&
      orderData.startDate &&
      orderData.clientId &&
      orderData.briefDescription &&
      orderData.deadline
    ) {
      setCurrentStep(2);
    }
  };

  const handleStep2Next = () => {
    if (selectedStages.length > 0 && selectedStages.every((s) => s.lineManagerId)) {
      setCurrentStep(3);
    }
  };

  const handleCreateOrder = () => {
    if (!user) return;

    const validBatches = batches.filter((b) => b.name && b.sku && b.quantity > 0);
    if (validBatches.length === 0) return;

    const today = formatDate(new Date());
    const orderStages = buildOrderStages();

    const orderBatches: Batch[] = validBatches.map((batch, idx) => {
      const batchId = editOrder
        ? editOrder.batches[idx]?.id || `batch-${orderData.orderNumber.toLowerCase()}-${String.fromCharCode(65 + idx)}`
        : `batch-${orderData.orderNumber.toLowerCase()}-${String.fromCharCode(65 + idx)}`;
      const createdDate = orderData.startDate;
      const expectedCompletionDate = calculateBatchCompletionDate(batch.quantity);

      return {
        id: batchId,
        name: batch.name,
        quantity: batch.quantity,
        orderId: editOrder ? editOrder.id : `order-${orderData.orderNumber.toLowerCase()}`,
        sku: batch.sku,
        createdDate,
        expectedCompletionDate,
        stages: orderStages,
        progress: editOrder ? editOrder.batches[idx]?.progress || {} : {},
        currentStageIndex: editOrder ? editOrder.batches[idx]?.currentStageIndex || 0 : 0,
        status: editOrder ? editOrder.batches[idx]?.status || 'on_time' : 'on_time',
      };
    });

    const newOrder: Order = {
      id: editOrder ? editOrder.id : `order-${orderData.orderNumber.toLowerCase()}`,
      orderNumber: orderData.orderNumber,
      clientId: orderData.clientId,
      briefDescription: orderData.briefDescription,
      detailedDescription: orderData.detailedDescription,
      createdBy: editOrder
        ? user.role === 'ProductionManager'
          ? orderData.assignedToId
          : editOrder.createdBy
        : user.role === 'OrderManager'
          ? user.id
          : orderData.assignedToId,
      createdDate: editOrder ? editOrder.createdDate : today,
      deadline: orderData.deadline,
      stages: orderStages,
      batches: orderBatches,
    };

    if (editOrder) {
      DataService.updateOrder(newOrder);
    } else {
      DataService.saveOrder(newOrder);
    }
    onComplete();
  };

  const isStep1Valid = Boolean(
    orderData.orderNumber &&
      orderData.assignedToId &&
      orderData.startDate &&
      orderData.clientId &&
      orderData.briefDescription &&
      orderData.deadline,
  );
  const isStep2Valid = selectedStages.length > 0 && selectedStages.every((s) => s.lineManagerId);
  const isStep3Valid =
    batches.length > 0 && batches.some((b) => b.name && b.sku && b.quantity > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              {editOrder ? 'Edit Order' : 'Create New Order'}
            </h2>
            <button
              onClick={onCancel}
              className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 font-semibold text-sm transition-colors ${
                    step === currentStep
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : step < currentStep
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-slate-300 bg-white text-slate-400'
                  }`}
                >
                  {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
                </div>
                {step < 3 && (
                  <div
                    className={`h-0.5 w-12 ${
                      step < currentStep ? 'bg-green-500' : 'bg-slate-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Order Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={orderData.orderNumber}
                  onChange={(e) =>
                    setOrderData({ ...orderData, orderNumber: e.target.value.toUpperCase() })
                  }
                  placeholder="ORD-2025-001"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {user?.role === 'ProductionManager' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Assign to Order Manager <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={orderData.assignedToId}
                    onChange={(e) => setOrderData({ ...orderData, assignedToId: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select an Order Manager</option>
                    {users
                      .filter((u) => u.role === 'OrderManager')
                      .map((om) => (
                        <option key={om.id} value={om.id}>
                          {om.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={orderData.startDate}
                    onChange={(e) => setOrderData({ ...orderData, startDate: e.target.value })}
                    min={formatDate(new Date())}
                    className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Client <span className="text-red-500">*</span>
                </label>
                <select
                  value={orderData.clientId}
                  onChange={(e) => setOrderData({ ...orderData, clientId: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Brief Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={orderData.briefDescription}
                  onChange={(e) =>
                    setOrderData({ ...orderData, briefDescription: e.target.value })
                  }
                  placeholder="Summer Collection - Organic Cotton Tees"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Detailed Description
                </label>
                <textarea
                  value={orderData.detailedDescription}
                  onChange={(e) =>
                    setOrderData({ ...orderData, detailedDescription: e.target.value })
                  }
                  placeholder="Additional details about the order..."
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Deadline <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={orderData.deadline}
                    onChange={(e) => setOrderData({ ...orderData, deadline: e.target.value })}
                    min={formatDate(new Date())}
                    className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Add Stages
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addStage(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Select a stage to add</option>
                  {availableStages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedStages.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Configure Stages (drag to reorder)
                  </label>
                  {selectedStages.map((stageConfig, index) => {
                    const stage = stages.find((s) => s.id === stageConfig.stageId);
                    const managers = getLineManagersForStage(stageConfig.stageId);

                    return (
                      <div
                        key={`${stageConfig.stageId}-${index}`}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                              {index + 1}
                            </span>
                            <span className="font-medium text-slate-900">
                              {stage?.name || 'Unknown Stage'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => moveStage(index, 'up')}
                              disabled={index === 0}
                              className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => moveStage(index, 'down')}
                              disabled={index === selectedStages.length - 1}
                              className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => removeStage(index)}
                              className="rounded p-1 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                              Custom Name (optional)
                            </label>
                            <input
                              type="text"
                              value={stageConfig.customName || ''}
                              onChange={(e) =>
                                updateStage(index, { customName: e.target.value || undefined })
                              }
                              placeholder={stage?.name}
                              className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                              Line Manager <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={stageConfig.lineManagerId}
                              onChange={(e) =>
                                updateStage(index, { lineManagerId: e.target.value })
                              }
                              className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                            >
                              <option value="">Select manager</option>
                              {managers.map((manager) => (
                                <option key={manager.id} value={manager.id}>
                                  {manager.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Batches</label>
                {batches.map((batch, index) => (
                  <div
                    key={index}
                    className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        Batch {String.fromCharCode(65 + index)}
                      </span>
                      {batches.length > 1 && (
                        <button
                          onClick={() => removeBatch(index)}
                          className="rounded p-1 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Batch Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={batch.name}
                          onChange={(e) => updateBatch(index, { name: e.target.value })}
                          placeholder="Batch A"
                          className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          SKU <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={batch.sku}
                          onChange={(e) => updateBatch(index, { sku: e.target.value.toUpperCase() })}
                          placeholder="S-6Y-GRN-HALF"
                          className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-600">
                          Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={batch.quantity || ''}
                          onChange={(e) =>
                            updateBatch(index, { quantity: parseInt(e.target.value) || 0 })
                          }
                          min="1"
                          placeholder="2500"
                          className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                        />
                      </div>
                    </div>

                    {batch.quantity > 0 && selectedStages.length > 0 && (
                      <div className="mt-3 rounded bg-blue-50 p-2">
                        <p className="text-xs text-slate-600">
                          <span className="font-medium">Expected Completion:</span>{' '}
                          {calculateBatchCompletionDate(batch.quantity)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={addBatch}
                  className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Package className="h-4 w-4" />
                  Add Another Batch
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Back
              </button>
            )}

            {currentStep < 3 ? (
              <button
                onClick={currentStep === 1 ? handleStep1Next : handleStep2Next}
                disabled={
                  (currentStep === 1 && !isStep1Valid) || (currentStep === 2 && !isStep2Valid)
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleCreateOrder}
                disabled={!isStep3Valid}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  editOrder ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                {editOrder ? 'Update Order' : 'Create Order'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder;

