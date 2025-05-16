// File: frontend/src/app/models/product.model.ts
export interface Product {
  id: string | number;
  name: string;
  description?: string;
  price: number;
  quantity: number;
}
