import { Stage, LineManager, Client, User } from '../types';

export const stages: Stage[] = [
  {
    id: 'procurement',
    name: 'Procurement',
    defaultDaysPerTier: [
      { maxUnits: 3333, days: 3 },
      { maxUnits: 6666, days: 7 },
      { maxUnits: 10000, days: 10 },
    ],
  },
  {
    id: 'washing',
    name: 'Washing',
    defaultDaysPerTier: [
      { maxUnits: 5000, days: 1 },
      { maxUnits: 10000, days: 2 },
    ],
  },
  {
    id: 'ironing',
    name: 'Ironing',
    defaultDaysPerTier: [
      { maxUnits: 5000, days: 1 },
      { maxUnits: 10000, days: 2 },
    ],
  },
  {
    id: 'cutting',
    name: 'Cutting',
    defaultDaysPerTier: [
      { maxUnits: 3333, days: 1 },
      { maxUnits: 6666, days: 2 },
      { maxUnits: 10000, days: 3 },
    ],
  },
  {
    id: 'sewing',
    name: 'Sewing',
    defaultDaysPerTier: [
      { maxUnits: 2000, days: 1 },
      { maxUnits: 5000, days: 3 },
      { maxUnits: 10000, days: 5 },
    ],
  },
  {
    id: 'quality-check',
    name: 'Quality Check',
    defaultDaysPerTier: [
      { maxUnits: 3333, days: 1 },
      { maxUnits: 6666, days: 2 },
      { maxUnits: 10000, days: 3 },
    ],
  },
  {
    id: 'packing',
    name: 'Packing',
    defaultDaysPerTier: [
      { maxUnits: 3333, days: 1 },
      { maxUnits: 6666, days: 2 },
      { maxUnits: 10000, days: 3 },
    ],
  },
];

export const lineManagers: LineManager[] = [
  { id: 'rajesh-mehta', name: 'Rajesh Mehta', stages: ['procurement'] },
  { id: 'priya-sharma', name: 'Priya Sharma', stages: ['procurement'] },
  { id: 'amit-kumar', name: 'Amit Kumar', stages: ['washing'] },
  { id: 'sneha-patel', name: 'Sneha Patel', stages: ['washing'] },
  { id: 'vikram-singh', name: 'Vikram Singh', stages: ['ironing'] },
  { id: 'anjali-reddy', name: 'Anjali Reddy', stages: ['ironing'] },
  { id: 'sudheer-rao', name: 'Sudheer Rao', stages: ['cutting'] },
  { id: 'kavita-nair', name: 'Kavita Nair', stages: ['cutting'] },
  { id: 'arjun-desai', name: 'Arjun Desai', stages: ['sewing'] },
  { id: 'meera-iyer', name: 'Meera Iyer', stages: ['sewing'] },
  { id: 'kiran-joshi', name: 'Kiran Joshi', stages: ['quality-check'] },
  { id: 'deepa-menon', name: 'Deepa Menon', stages: ['quality-check'] },
  { id: 'rahul-gupta', name: 'Rahul Gupta', stages: ['packing'] },
  { id: 'pooja-verma', name: 'Pooja Verma', stages: ['packing'] },
];

export const clients: Client[] = [
  { id: 'purethrill-kids-garments', name: 'PureThrill Kids Garments' },
  { id: 'fantabulous-clothing', name: 'Fantabulous Clothing' },
  { id: 'kiddy-gems', name: 'Kiddy Gems' },
  { id: 'starworks', name: 'Starworks' },
];

export const users: User[] = [
  { id: 'kalpesh-patel', name: 'Kalpesh Patel', role: 'ProductionManager' },
  { id: 'rajesh-kumar', name: 'Rajesh Kumar', role: 'OrderManager' },
  { id: 'priya-menon', name: 'Priya Menon', role: 'OrderManager' },
  { id: 'operations-team', name: 'Operations Team', role: 'Operations' },
];
