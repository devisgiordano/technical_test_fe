// File: frontend/src/app/services/order.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Order } from '../models/order.model'; // Assicurati che il path sia corretto

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = '/api/orders'; // Placeholder URL base

  // Opzioni HTTP per le richieste POST e PUT
  private httpOptions = {
    headers: new HttpHeaders({
      // API Platform si aspetta 'application/ld+json' per le operazioni di scrittura
      'Content-Type': 'application/ld+json',
      'Accept': 'application/ld+json, application/json' // Accetta ld+json o json semplice in risposta
      // 'Authorization': 'Bearer TUO_TOKEN_JWT' // Se usi autenticazione
    })
  };

  // Opzioni HTTP per le richieste GET e DELETE (non inviano un corpo JSON)
  private httpGetDeleteOptions = {
    headers: new HttpHeaders({
      'Accept': 'application/ld+json, application/json'
      // 'Authorization': 'Bearer TUO_TOKEN_JWT' // Se usi autenticazione
    })
  };


  constructor(private http: HttpClient) { }

  getOrders(filterDate?: string, searchTerm?: string): Observable<Order[]> {
    let params = new HttpParams();
    if (filterDate) {
      params = params.append('date', filterDate);
    }
    if (searchTerm && searchTerm.trim() !== '') {
      params = params.append('customerName', searchTerm.trim()); // Assumendo che il filtro 'search' cerchi su 'customerName'
    }
    return this.http.get<Order[]>(this.apiUrl, { params, headers: this.httpGetDeleteOptions.headers })
      .pipe(
        tap(orders => console.log(`[OrderService] Fetched ${orders.length} orders`, orders)),
        catchError(this.handleError)
      );
  }

  getOrderById(id: string | number): Observable<Order> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Order>(url, this.httpGetDeleteOptions)
      .pipe(
        tap(order => console.log(`[OrderService] Fetched order id=${id}:`, order)),
        catchError(this.handleError)
      );
  }

  createOrder(orderData: Omit<Order, 'id' | 'totalAmount'>): Observable<Order> {
    // Il payload deve essere conforme a quanto si aspetta il backend per Order e OrderItem
    // Specialmente per le relazioni (es. product IRI in orderItems)
    return this.http.post<Order>(this.apiUrl, orderData, this.httpOptions)
      .pipe(
        tap(newOrder => console.log('[OrderService] Created order:', newOrder)),
        catchError(this.handleError)
      );
  }

  updateOrder(id: string | number, orderData: Partial<Order>): Observable<Order> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<Order>(url, orderData, this.httpOptions)
      .pipe(
        tap(updatedOrder => console.log(`[OrderService] Updated order id=${id}:`, updatedOrder)),
        catchError(this.handleError)
      );
  }

  deleteOrder(id: string | number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url, this.httpGetDeleteOptions)
      .pipe(
        tap(() => console.log(`[OrderService] Deleted order id=${id}`)),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Si è verificato un errore sconosciuto durante la chiamata API!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Errore del client: ${error.error.message}`;
    } else {
      errorMessage = `Errore dal server (Codice: ${error.status}): ${error.message || error.statusText}`;
      // Tentativo di estrarre dettagli dall'errore JSON di API Platform
      if (error.error && typeof error.error === 'object') {
        const serverError = error.error;
        const details = serverError.detail || serverError.title || serverError['hydra:description'] || serverError['hydra:title'] || JSON.stringify(serverError);
        if (details) {
            errorMessage += `\nDettagli: ${details}`;
        }
      } else if (typeof error.error === 'string' && error.error.trim() !== '') {
        errorMessage += `\nDettagli: ${error.error}`;
      }
    }
    console.error('[OrderService API Error]', errorMessage, '\nRisposta completa errore:', error);
    return throwError(() => new Error(errorMessage));
  }
}
