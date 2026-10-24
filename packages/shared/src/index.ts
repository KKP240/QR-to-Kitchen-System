export type OrderStatus = "pending" | "cooking" | "ready" | "served";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  available: boolean;
  description?: string;
  category?: string;
  recommended?: boolean;
}

export interface RestaurantTable {
  id: string;
  name: string;
  seats: number;
  active: boolean;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  startedAt?: string;
  servedAt?: string;
  note?: string;
  customerUsername?: string;
  statusHistory?: {   
    status: OrderStatus;
    timestamp: string;
  }[];
}