// File: frontend/src/app/services/order.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Order } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = '/api/orders'; // Adatta se l'endpoint del backend è diverso

  constructor(private http: HttpClient) { }

  getOrders(filterDate?: string, searchTerm?: string): Observable<Order[]> {
    let params = new HttpParams();
    if (filterDate) {
      params = params.append('date', filterDate);
    }
    if (searchTerm && searchTerm.trim() !== '') {
      params = params.append('search', searchTerm.trim());
    }
    return this.http.get<Order[]>(this.apiUrl, { params }).pipe(catchError(this.handleError));
  }

  getOrderById(id: string | number): Observable<Order> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Order>(url).pipe(catchError(this.handleError));
  }

  createOrder(orderData: Omit<Order, 'id' | 'totalAmount'>): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, orderData).pipe(catchError(this.handleError));
  }

  updateOrder(id: string | number, orderData: Partial<Order>): Observable<Order> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<Order>(url, orderData).pipe(catchError(this.handleError));
  }

  deleteOrder(id: string | number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Si è verificato un errore sconosciuto!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Errore del client: ${error.error.message}`;
    } else {
      errorMessage = `Codice errore dal server: ${error.status}\nMessaggio: ${error.message}`;
      if (error.error && typeof error.error === 'object') {
        const serverError = error.error;
        errorMessage += `\nDettagli: ${serverError.message || serverError.title || JSON.stringify(serverError)}`;
      }
    }
    console.error(errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
