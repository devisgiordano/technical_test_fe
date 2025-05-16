// src/app/services/order.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Order, BackendOrderItemPayload } from '../models/order.model'; // Assicurati che i modelli siano corretti

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  // L'URL base per le API degli ordini. Il proxy.conf.json dovrebbe gestire il reindirizzamento a http://backend:8000
  private apiUrl = '/api/orders'; // Stesso URL base, ma ora punta ai controller Symfony

  // Opzioni HTTP per richieste POST e PUT (JSON standard)
  private httpPostPutOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  // Opzioni HTTP per richieste GET e DELETE (solo Accept JSON)
  private httpGetDeleteOptions = {
    headers: new HttpHeaders({
      'Accept': 'application/json'
    })
  };

  constructor(private http: HttpClient) { }

  // GET /api/orders
  getOrders(filterDate?: string, searchTerm?: string): Observable<Order[]> {
    let params = new HttpParams();
    if (filterDate) {
      // Adatta il nome del parametro se il backend si aspetta qualcosa di diverso
      params = params.append('orderDate', filterDate);
    }
    if (searchTerm && searchTerm.trim() !== '') {
      // Il backend controller ora deve implementare questa logica di filtro
      // Esempio: il controller potrebbe cercare su customerName o orderNumber
      params = params.append('q', searchTerm.trim()); // Parametro generico 'q' per la ricerca
    }

    // Il backend ora restituisce un array JSON semplice di Order[]
    return this.http.get<Order[]>(this.apiUrl, { params, headers: this.httpGetDeleteOptions.headers })
      .pipe(
        // Non è più necessario mappare da ApiPlatformOrderCollection
        tap(orders => console.log(`[OrderService] Fetched ${orders.length} orders`, orders)),
        catchError(this.handleError)
      );
  }

  // GET /api/orders/{id}
  getOrderById(id: string | number): Observable<Order> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Order>(url, { headers: this.httpGetDeleteOptions.headers })
      .pipe(
        tap(order => console.log(`[OrderService] Fetched order id=${id}:`, order)),
        catchError(this.handleError)
      );
  }

  // POST /api/orders
  // Il tipo orderData dovrebbe corrispondere a quello che il backend si aspetta.
  // Usiamo Omit<Order, 'id' | 'totalAmount'> e poi mappiamo a BackendOrderItemPayload internamente nel form.
  // Qui riceviamo già il payload corretto dal form.
  createOrder(orderPayload: {
    orderNumber: string;
    customerName: string;
    orderDate: string; // ISO string
    description?: string;
    status: Order['status'];
    orderItems: BackendOrderItemPayload[];
  }): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, orderPayload, this.httpPostPutOptions)
      .pipe(
        tap(newOrder => console.log('[OrderService] Created order:', newOrder)),
        catchError(this.handleError)
      );
  }

  // PUT /api/orders/{id}
  // Il tipo orderPayload qui dovrebbe essere simile a quello di createOrder o Partial<...>
  updateOrder(id: string | number, orderPayload: any): Observable<Order> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<Order>(url, orderPayload, this.httpPostPutOptions)
      .pipe(
        tap(updatedOrder => console.log(`[OrderService] Updated order id=${id}:`, updatedOrder)),
        catchError(this.handleError)
      );
  }

  // DELETE /api/orders/{id}
  deleteOrder(id: string | number): Observable<void> {
    const url = `${this.apiUrl}/${id}`;
    // Il backend restituisce 204 No Content, quindi il tipo di risposta è void
    return this.http.delete<void>(url, { headers: this.httpGetDeleteOptions.headers })
      .pipe(
        tap(() => console.log(`[OrderService] Deleted order id=${id}`)),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Si è verificato un errore sconosciuto durante la chiamata API!';
    if (error.error instanceof ErrorEvent) {
      // Errore client-side o di rete
      errorMessage = `Errore del client: ${error.error.message}`;
    } else {
      // Il backend ha restituito un codice di errore
      // error.error potrebbe contenere il corpo della risposta JSON con i dettagli
      let serverErrorDetails = '';
      if (error.error && typeof error.error === 'object') {
        serverErrorDetails = error.error.message || error.error.detail || JSON.stringify(error.error);
      } else if (typeof error.error === 'string') {
        serverErrorDetails = error.error;
      }
      errorMessage = `Errore dal server (Codice: ${error.status}): ${error.statusText || ''}. Dettagli: ${serverErrorDetails || 'N/A'}`;
    }
    console.error('[OrderService API Error]', errorMessage, '\nRisposta completa errore:', error);
    return throwError(() => new Error(errorMessage));
  }
}
