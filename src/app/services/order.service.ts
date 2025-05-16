// File: frontend/src/app/services/order.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators'; // Aggiunto 'map'
import { Order } from '../models/order.model';

// Interfaccia per la risposta della collezione da API Platform (basata sul tuo esempio)
interface ApiPlatformOrderCollection {
  '@context': string;
  '@id': string;
  '@type': 'Collection'; // O 'hydra:Collection', adatta se necessario
  'totalItems': number;
  'member': Order[];     // La lista effettiva degli ordini
  'view'?: {
    '@id'?: string;
    '@type'?: string;
  };
  'search'?: any;
  // Potrebbero esserci altri campi come 'hydra:view', 'hydra:search' a seconda della versione di API Platform
  // e della configurazione. L'importante è 'member'.
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = '/api/orders';

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/ld+json',
      'Accept': 'application/ld+json, application/json'
    })
  };

  private httpGetDeleteOptions = {
    headers: new HttpHeaders({
      'Accept': 'application/ld+json, application/json'
    })
  };

  constructor(private http: HttpClient) { }

  getOrders(filterDate?: string, searchTerm?: string): Observable<Order[]> {
    let params = new HttpParams();
    if (filterDate) {
      params = params.append('date', filterDate);
    }
    if (searchTerm && searchTerm.trim() !== '') {
      // Assicurati che il backend si aspetti 'customerName' per la ricerca generica,
      // o adatta il nome del parametro in base ai filtri SearchFilter definiti nell'entità Order.
      // Esempio: se SearchFilter è su 'customerName' e 'description'
      // potresti inviare params = params.append('customerName', searchTerm.trim());
      // o params = params.append('description', searchTerm.trim());
      // o un parametro generico se hai un filtro custom nel backend.
      // Per ora, manteniamo 'customerName' come nell'esempio precedente.
      params = params.append('customerName', searchTerm.trim());
    }

    // HttpClient ora si aspetta una risposta di tipo ApiPlatformOrderCollection
    return this.http.get<ApiPlatformOrderCollection>(this.apiUrl, { params, headers: this.httpGetDeleteOptions.headers })
      .pipe(
        // Usa l'operatore 'map' per trasformare la risposta
        map(response => {
          // Stampa la risposta completa per debug, se necessario
          console.log('[OrderService] Risposta completa da getOrders:', response);
          // Estrai e restituisci solo l'array 'member'
          if (response && response.member) {
            return response.member;
          }
          // Se 'member' non è presente, restituisci un array vuoto o gestisci l'errore
          console.warn('[OrderService] La risposta API non contiene la proprietà "member". Restituzione array vuoto.');
          return [];
        }),
        tap(orders => console.log(`[OrderService] Fetched and mapped ${orders.length} orders`, orders)),
        catchError(this.handleError)
      );
  }

  getOrderById(id: string | number): Observable<Order> {
    const url = `${this.apiUrl}/${id}`;
    // Per GET singolo, API Platform di solito restituisce direttamente l'oggetto Order, non una collezione.
    // Quindi non è necessario 'map' qui, a meno che anche il GET singolo non sia avvolto.
    return this.http.get<Order>(url, this.httpGetDeleteOptions)
      .pipe(
        tap(order => console.log(`[OrderService] Fetched order id=${id}:`, order)),
        catchError(this.handleError)
      );
  }

  createOrder(orderData: Omit<Order, 'id' | 'totalAmount'>): Observable<Order> {
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
