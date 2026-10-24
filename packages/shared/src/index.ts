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
  note?: string;
  statusHistory?: {   
    status: OrderStatus;
    timestamp: string;
  }[];
}