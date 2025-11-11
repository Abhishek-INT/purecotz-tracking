import { addDays, format, parseISO } from 'date-fns';
import { Batch, BatchProgress, Order, OrderStage } from '../types';
import { stages as masterStages } from './masterData';

const progressTimestamp = new Date().toISOString();

const stageLookup = new Map(masterStages.map((stage) => [stage.id, stage]));

const getStageDays = (stageId: string, quantity: number): number => {
  const stage = stageLookup.get(stageId);
  if (!stage) {
    throw new Error(`Unknown stage id: ${stageId}`);
  }

  const tier = stage.defaultDaysPerTier.find((t) => quantity <= t.maxUnits);
  return tier ? tier.days : stage.defaultDaysPerTier[stage.defaultDaysPerTier.length - 1].days;
};

type MinimalBatch = Pick<Batch, 'quantity'>;

type StageConfig = Pick<OrderStage, 'stageId' | 'lineManagerId' | 'actualStartDate' | 'actualEndDate'>;

const formatDate = (date: Date): string => format(date, 'yyyy-MM-dd');

const buildStages = (
  scheduleStartDate: string,
  stageConfigs: StageConfig[],
  batchInputs: MinimalBatch[],
): OrderStage[] => {
  let cursor = parseISO(scheduleStartDate);

  return stageConfigs.map((config, index) => {
    const expectedDays = batchInputs.reduce(
      (total, batch) => total + getStageDays(config.stageId, batch.quantity),
      0,
    );

    const expectedStartDate = formatDate(cursor);
    const expectedEndDate = formatDate(addDays(cursor, Math.max(expectedDays - 1, 0)));

    const stage: OrderStage = {
      stageId: config.stageId,
      lineManagerId: config.lineManagerId,
      expectedDays,
      sequence: index + 1,
      expectedStartDate,
      expectedEndDate,
      actualStartDate: config.actualStartDate,
      actualEndDate: config.actualEndDate,
    };

    cursor = addDays(cursor, expectedDays);
    return stage;
  });
};

const createProgress = (entries: Record<string, BatchProgress[]>): Record<string, BatchProgress[]> => entries;

const order1BatchInputs = [
  {
    id: 'batch-a',
    name: 'Batch A',
    quantity: 2500,
    sku: 'S-6Y-GRN-HALF',
    createdDate: '2025-01-15',
    expectedCompletionDate: '2025-03-05',
    currentStageIndex: 1,
    status: 'on_time',
    progress: createProgress({
      cutting: [
        {
          time: progressTimestamp,
          inwardQty: 2500,
          completedQty: 2500,
          pendingQty: 0,
          outQty: 2500,
          defectsFound: 6,
        },
      ],
      sewing: [
        {
          time: progressTimestamp,
          inwardQty: 2500,
          completedQty: 1500,
          pendingQty: 1000,
          outQty: 1500,
          defectsFound: 4,
        },
      ],
      'quality-check': [
        {
          time: progressTimestamp,
          inwardQty: 0,
          completedQty: 0,
          pendingQty: 2500,
          outQty: 0,
          defectsFound: 0,
        },
      ],
      packing: [
        {
          time: progressTimestamp,
          inwardQty: 0,
          completedQty: 0,
          pendingQty: 2500,
          outQty: 0,
          defectsFound: 0,
        },
      ],
    }),
  },
  {
    id: 'batch-b',
    name: 'Batch B',
    quantity: 2500,
    sku: 'S-6Y-GRN-HALF',
    createdDate: '2025-01-15',
    expectedCompletionDate: '2025-03-08',
    currentStageIndex: 0,
    status: 'at_risk',
    progress: createProgress({
      cutting: [
        {
          time: progressTimestamp,
          inwardQty: 2500,
          completedQty: 750,
          pendingQty: 1750,
          outQty: 750,
          defectsFound: 5,
        },
      ],
      sewing: [
        {
          time: progressTimestamp,
          inwardQty: 0,
          completedQty: 0,
          pendingQty: 2500,
          outQty: 0,
          defectsFound: 0,
        },
      ],
      'quality-check': [
        {
          time: progressTimestamp,
          inwardQty: 0,
          completedQty: 0,
          pendingQty: 2500,
          outQty: 0,
          defectsFound: 0,
        },
      ],
      packing: [
        {
          time: progressTimestamp,
          inwardQty: 0,
          completedQty: 0,
          pendingQty: 2500,
          outQty: 0,
          defectsFound: 0,
        },
      ],
    }),
  },
  {
    id: 'batch-c',
    name: 'Batch C',
    quantity: 1800,
    sku: 'M-8Y-BLU-FULL',
    createdDate: '2025-01-15',
    expectedCompletionDate: '2025-03-10',
    currentStageIndex: 2,
    status: 'on_time',
    progress: createProgress({
      cutting: [
        {
          time: progressTimestamp,
          inwardQty: 1800,
          completedQty: 1800,
          pendingQty: 0,
          outQty: 1800,
          defectsFound: 3,
        },
      ],
      sewing: [
        {
          time: progressTimestamp,
          inwardQty: 1800,
          completedQty: 1800,
          pendingQty: 0,
          outQty: 1785,
          defectsFound: 2,
        },
      ],
      'quality-check': [
        {
          time: progressTimestamp,
          inwardQty: 1800,
          completedQty: 1620,
          pendingQty: 180,
          outQty: 1500,
          defectsFound: 5,
        },
      ],
      packing: [
        {
          time: progressTimestamp,
          inwardQty: 0,
          completedQty: 0,
          pendingQty: 1800,
          outQty: 0,
          defectsFound: 0,
        },
      ],
    }),
  },
] satisfies Array<Omit<Batch, 'orderId' | 'stages'>>;

const order1Stages = buildStages(
  '2025-01-16',
  [
    {
      stageId: 'cutting',
      lineManagerId: 'sudheer-rao',
      actualStartDate: '2025-01-16',
      actualEndDate: '2025-01-18',
    },
    {
      stageId: 'sewing',
      lineManagerId: 'arjun-desai',
      actualStartDate: '2025-01-19',
    },
    {
      stageId: 'quality-check',
      lineManagerId: 'kiran-joshi',
      actualStartDate: '2025-02-01',
    },
    {
      stageId: 'packing',
      lineManagerId: 'rahul-gupta',
    },
  ],
  order1BatchInputs,
);

const order1Batches: Batch[] = order1BatchInputs.map((batch) => ({
  ...batch,
  orderId: 'order-2025-001',
  stages: order1Stages,
}));

const order2BatchInputs = [
  {
    id: 'batch-d',
    name: 'Batch D',
    quantity: 3000,
    sku: 'L-10Y-NAV-HOOD',
    createdDate: '2025-02-01',
    expectedCompletionDate: '2025-03-28',
    currentStageIndex: 0,
    status: 'delayed',
    progress: createProgress({
      procurement: [
        {
          time: progressTimestamp,
          inwardQty: 3000,
          completedQty: 600,
          pendingQty: 2400,
          outQty: 600,
          defectsFound: 4,
        },
      ],
      cutting: [
        {
          time: progressTimestamp,
          inwardQty: 0,
          completedQty: 0,
          pendingQty: 3000,
          outQty: 0,
          defectsFound: 0,
        },
      ],
      sewing: [
        {
          time: progressTimestamp,
          inwardQty: 0,
          completedQty: 0,
          pendingQty: 3000,
          outQty: 0,
          defectsFound: 0,
        },
      ],
      washing: [
        {
          time: progressTimestamp,
          inwardQty: 0,
          completedQty: 0,
          pendingQty: 3000,
          outQty: 0,
          defectsFound: 0,
        },
      ],
      packing: [
        {
          time: progressTimestamp,
          inwardQty: 0,
          completedQty: 0,
          pendingQty: 3000,
          outQty: 0,
          defectsFound: 0,
        },
      ],
    }),
  },
  {
    id: 'batch-e',
    name: 'Batch E',
    quantity: 2000,
    sku: 'XL-12Y-GRY-HOOD',
    createdDate: '2025-02-01',
    expectedCompletionDate: '2025-03-20',
    currentStageIndex: 1,
    status: 'on_time',
    progress: createProgress({
      procurement: [
        {
          time: progressTimestamp,
          inwardQty: 2000,
          completedQty: 2000,
          pendingQty: 0,
          outQty: 2000,
          defectsFound: 3,
        },
      ],
      cutting: [
        {
          time: progressTimestamp,
          inwardQty: 2000,
          completedQty: 1600,
          pendingQty: 400,
          outQty: 1600,
          defectsFound: 2,
        },
      ],
      sewing: [
        {
          time: progressTimestamp,
          inwardQty: 0,
          completedQty: 0,
          pendingQty: 2000,
          outQty: 0,
          defectsFound: 0,
        },
      ],
      washing: [
        {
          time: progressTimestamp,
          inwardQty: 0,
          completedQty: 0,
          pendingQty: 2000,
          outQty: 0,
          defectsFound: 0,
        },
      ],
      packing: [
        {
          time: progressTimestamp,
          inwardQty: 0,
          completedQty: 0,
          pendingQty: 2000,
          outQty: 0,
          defectsFound: 0,
        },
      ],
    }),
  },
] satisfies Array<Omit<Batch, 'orderId' | 'stages'>>;

const order2Stages = buildStages(
  '2025-02-01',
  [
    {
      stageId: 'procurement',
      lineManagerId: 'rajesh-mehta',
      actualStartDate: '2025-02-01',
    },
    {
      stageId: 'cutting',
      lineManagerId: 'kavita-nair',
      actualStartDate: '2025-02-08',
    },
    {
      stageId: 'sewing',
      lineManagerId: 'meera-iyer',
    },
    {
      stageId: 'washing',
      lineManagerId: 'sneha-patel',
    },
    {
      stageId: 'packing',
      lineManagerId: 'pooja-verma',
    },
  ],
  order2BatchInputs,
);

const order2Batches: Batch[] = order2BatchInputs.map((batch) => ({
  ...batch,
  orderId: 'order-2025-002',
  stages: order2Stages,
}));

const order3BatchInputs = [
  {
    id: 'batch-f',
    name: 'Batch F',
    quantity: 4000,
    sku: 'M-7Y-WHT-SHIRT',
    createdDate: '2025-02-10',
    expectedCompletionDate: '2025-03-05',
    currentStageIndex: 4,
    status: 'on_time',
    progress: createProgress({
      cutting: [
        {
          time: progressTimestamp,
          inwardQty: 4000,
          completedQty: 4000,
          pendingQty: 0,
          outQty: 4000,
          defectsFound: 5,
        },
      ],
      sewing: [
        {
          time: progressTimestamp,
          inwardQty: 4000,
          completedQty: 4000,
          pendingQty: 0,
          outQty: 3985,
          defectsFound: 6,
        },
      ],
      ironing: [
        {
          time: progressTimestamp,
          inwardQty: 4000,
          completedQty: 4000,
          pendingQty: 0,
          outQty: 3980,
          defectsFound: 4,
        },
      ],
      'quality-check': [
        {
          time: progressTimestamp,
          inwardQty: 4000,
          completedQty: 4000,
          pendingQty: 0,
          outQty: 3975,
          defectsFound: 8,
        },
      ],
      packing: [
        {
          time: progressTimestamp,
          inwardQty: 4000,
          completedQty: 4000,
          pendingQty: 0,
          outQty: 4000,
          defectsFound: 2,
        },
      ],
    }),
  },
  {
    id: 'batch-g',
    name: 'Batch G',
    quantity: 3500,
    sku: 'L-9Y-BLK-SHIRT',
    createdDate: '2025-02-10',
    expectedCompletionDate: '2025-03-12',
    currentStageIndex: 2,
    status: 'at_risk',
    progress: createProgress({
      cutting: [
        {
          time: progressTimestamp,
          inwardQty: 3500,
          completedQty: 3500,
          pendingQty: 0,
          outQty: 3490,
          defectsFound: 4,
        },
      ],
      sewing: [
        {
          time: progressTimestamp,
          inwardQty: 3500,
          completedQty: 3500,
          pendingQty: 0,
          outQty: 3485,
          defectsFound: 5,
        },
      ],
      ironing: [
        {
          time: progressTimestamp,
          inwardQty: 3500,
          completedQty: 1575,
          pendingQty: 1925,
          outQty: 1500,
          defectsFound: 3,
        },
      ],
      'quality-check': [
        {
          time: progressTimestamp,
          inwardQty: 0,
          completedQty: 0,
          pendingQty: 3500,
          outQty: 0,
          defectsFound: 0,
        },
      ],
      packing: [
        {
          time: progressTimestamp,
          inwardQty: 0,
          completedQty: 0,
          pendingQty: 3500,
          outQty: 0,
          defectsFound: 0,
        },
      ],
    }),
  },
] satisfies Array<Omit<Batch, 'orderId' | 'stages'>>;

const order3Stages = buildStages(
  '2025-02-11',
  [
    {
      stageId: 'cutting',
      lineManagerId: 'kavita-nair',
      actualStartDate: '2025-02-11',
      actualEndDate: '2025-02-14',
    },
    {
      stageId: 'sewing',
      lineManagerId: 'arjun-desai',
      actualStartDate: '2025-02-15',
      actualEndDate: '2025-02-20',
    },
    {
      stageId: 'ironing',
      lineManagerId: 'vikram-singh',
      actualStartDate: '2025-02-21',
    },
    {
      stageId: 'quality-check',
      lineManagerId: 'deepa-menon',
      actualStartDate: '2025-02-24',
    },
    {
      stageId: 'packing',
      lineManagerId: 'rahul-gupta',
      actualStartDate: '2025-02-28',
    },
  ],
  order3BatchInputs,
);

const order3Batches: Batch[] = order3BatchInputs.map((batch) => ({
  ...batch,
  orderId: 'order-2025-003',
  stages: order3Stages,
}));

export const sampleOrders: Order[] = [
  {
    id: 'order-2025-001',
    orderNumber: 'ORD-2025-001',
    clientId: 'purethrill-kids-garments',
    briefDescription: 'Summer Collection - Organic Cotton Tees',
    detailedDescription:
      'Organic cotton tees in multiple colorways and fits for the PureThrill summer launch. Includes green half sleeve and blue full sleeve variants.',
    createdBy: 'rajesh-kumar',
    createdDate: '2025-01-15',
    deadline: '2025-03-15',
    stages: order1Stages,
    batches: order1Batches,
  },
  {
    id: 'order-2025-002',
    orderNumber: 'ORD-2025-002',
    clientId: 'kiddy-gems',
    briefDescription: 'Winter Hoodies Collection',
    detailedDescription:
      'Thermal-lined hoodies for Kiddy Gems winter range featuring navy and grey colorways across senior kid sizes.',
    createdBy: 'priya-menon',
    createdDate: '2025-02-01',
    deadline: '2025-04-10',
    stages: order2Stages,
    batches: order2Batches,
  },
  {
    id: 'order-2025-003',
    orderNumber: 'ORD-2025-003',
    clientId: 'starworks',
    briefDescription: 'Spring Casual Shirts',
    detailedDescription:
      'Lightweight casual shirts with premium finishes for the Starworks spring capsule, covering multiple colorways and sizes.',
    createdBy: 'rajesh-kumar',
    createdDate: '2025-02-10',
    deadline: '2025-03-25',
    stages: order3Stages,
    batches: order3Batches,
  },
];
