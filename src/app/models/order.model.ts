// File: frontend/src/app/models/order.model.ts
import { Product } from './product.model'; // Product qui rappresenta i dati di un item dell'ordine

export interface Order {
  id: string | number;
  orderNumber: string;
  customerName: string;
  orderDate: string | Date;
  description?: string;
  totalAmount?: number;
  // Modificato da 'products' a 'orderItems' per allinearsi al backend
  // e definito come potenzialmente undefined o null se il backend potrebbe ometterlo
  // quando la lista è vuota, oppure inizializzalo sempre come array.
  // Se il backend garantisce sempre un array (anche vuoto) per orderItems, puoi rimuovere '?'.
  // orderItems?: Product[]; // Product[] qui rappresenta la struttura degli item dell'ordine come attesi dal frontend
  products: Product[];
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
}
