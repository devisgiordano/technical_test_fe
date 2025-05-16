// File: frontend/src/app/models/order.model.ts
import { Product } from './product.model';

export interface Order {
  id: string | number;
  orderNumber: string;
  customerName: string;
  orderDate: string | Date; // Preferibilmente stringa ISO dal backend
  description?: string;
  totalAmount?: number; // Calcolato dal backend o frontend
  products: Product[];
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
}
