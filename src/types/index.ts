export type UserRole = 'OrderManager' | 'ProductionManager' | 'Operations';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface Client {
  id: string;
  name: string;
}

export interface StageTier {
  maxUnits: number;
  days: number;
}

export interface Stage {
  id: string;
  name: string;
  defaultDaysPerTier: StageTier[];
}

export interface LineManager {
  id: string;
  name: string;
  stages: string[];
}

export interface OrderStage {
  stageId: string;
  customName?: string;
  lineManagerId: string;
  expectedDays: number;
  sequence: number;
  expectedStartDate: string;
  expectedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
}

export interface BatchProgress {
  time: string;
  inwardQty: number;
  completedQty: number;
  pendingQty: number;
  outQty: number;
  defectsFound: number;
}

export interface Batch {
  id: string;
  name: string;
  quantity: number;
  orderId: string;
  sku: string;
  createdDate: string;
  expectedCompletionDate: string;
  stages: OrderStage[];
  progress: Record<string, BatchProgress[]>;
  currentStageIndex: number;
  status: 'on_time' | 'at_risk' | 'delayed';
}

export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  briefDescription: string;
  detailedDescription: string;
  createdBy: string;
  createdDate: string;
  deadline: string;
  stages: OrderStage[];
  batches: Batch[];
}
