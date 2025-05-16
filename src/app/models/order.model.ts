// src/app/models/order.model.ts

// Interfaccia per gli articoli dell'ordine che il frontend usa internamente nel form
export interface FrontendOrderItem {
  name: string; // Nome del prodotto
  description?: string; // Descrizione del prodotto
  quantity: number;
  price: number; // Prezzo unitario del prodotto inserito nel form
}

// Interfaccia per il payload di un OrderItem inviato al backend
export interface BackendOrderItemPayload {
  product: { // Dati per l'entità Product
    name: string;
    price: string; // L'entità Product ha price come stringa (per decimali)
    description?: string;
  };
  quantity: number;
  priceAtPurchase: string; // L'entità OrderItem ha priceAtPurchase come stringa
}

// Interfaccia per un OrderItem come restituito dal backend (con product annidato)
export interface BackendProduct {
    id: number;
    name: string;
    description?: string;
    price: string;
}
export interface BackendOrderItem {
    id: number;
    quantity: number;
    priceAtPurchase: string;
    subtotal?: number;
    product: BackendProduct;
}

// Interfaccia principale per l'Ordine
export interface Order {
  id: string | number;
  orderNumber: string;
  customerName: string;
  orderDate: string; // MODIFICATO: Ora è solo string (formato ISO atteso)
  description?: string;
  totalAmount?: number | string;
  orderItems?: BackendOrderItem[];
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
}
