import type { Order, User } from '../types';
import { sampleOrders } from '../data/sampleData';

const STORAGE_KEYS = {
  orders: 'purecotz_orders',
  currentUser: 'purecotz_current_user',
} as const;

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn('Failed to parse stored data:', error);
    return fallback;
  }
};

export class DataService {
  private constructor() {}

  private static get storageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private static getOrdersFromStorage(): Order[] {
    if (!this.storageAvailable) {
      return [];
    }

    return safeParse<Order[]>(localStorage.getItem(STORAGE_KEYS.orders), []);
  }

  private static saveOrdersToStorage(orders: Order[]): void {
    if (!this.storageAvailable) {
      return;
    }

    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
  }

  static getCurrentUser(): User | null {
    if (!this.storageAvailable) {
      return null;
    }

    return safeParse<User | null>(localStorage.getItem(STORAGE_KEYS.currentUser), null);
  }

  static setCurrentUser(user: User | null): void {
    if (!this.storageAvailable) {
      return;
    }

    if (user) {
      localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.currentUser);
    }
  }

  static getAllOrders(): Order[] {
    return this.getOrdersFromStorage();
  }

  static getOrdersByManager(userId: string): Order[] {
    return this.getOrdersFromStorage().filter((order) => order.createdBy === userId);
  }

  static getOrderById(orderId: string): Order | undefined {
    return this.getOrdersFromStorage().find((order) => order.id === orderId);
  }

  static saveOrder(order: Order): void {
    const orders = this.getOrdersFromStorage();

    if (orders.some((existing) => existing.id === order.id)) {
      throw new Error(`Order with id "${order.id}" already exists. Use updateOrder instead.`);
    }

    orders.push(order);
    this.saveOrdersToStorage(orders);
  }

  static updateOrder(order: Order): void {
    const orders = this.getAllOrders();
    const index = orders.findIndex((o) => o.id === order.id);
    if (index !== -1) {
      orders[index] = order;
      this.saveOrdersToStorage(orders);
    }
  }

  static deleteOrder(orderId: string): void {
    const orders = this.getOrdersFromStorage();
    const filtered = orders.filter((order) => order.id !== orderId);

    if (filtered.length === orders.length) {
      console.warn(`Order with id "${orderId}" not found.`);
    }

    this.saveOrdersToStorage(filtered);
  }

  static initializeSampleData(): void {
    if (!this.storageAvailable) {
      return;
    }

    const existing = localStorage.getItem(STORAGE_KEYS.orders);
    if (!existing) {
      this.saveOrdersToStorage(sampleOrders);
    }
  }

  static exportData(): string {
    const data = {
      orders: this.getOrdersFromStorage(),
      currentUser: this.getCurrentUser(),
    };

    return JSON.stringify(data, null, 2);
  }

  static importData(jsonString: string): void {
    if (!this.storageAvailable) {
      return;
    }

    const parsed = safeParse<{ orders?: Order[]; currentUser?: User | null }>(jsonString, {
      orders: [],
      currentUser: null,
    });

    const orders = Array.isArray(parsed.orders) ? (parsed.orders as Order[]) : [];
    const currentUser = parsed.currentUser ?? null;

    this.saveOrdersToStorage(orders);

    this.setCurrentUser(currentUser ?? null);
  }
}

