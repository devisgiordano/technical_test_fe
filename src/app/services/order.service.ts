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
  // Questo è il placeholder URL base per le API degli ordini.
  // Il proxy (nginx in produzione, proxy.conf.json in sviluppo)
  // reindirizzerà le richieste che iniziano con /api/ al tuo backend.
  // Se il tuo backend ha un prefisso diverso per le API degli ordini,
  // ad esempio /api/v1/ordini, modificalo qui.
  private apiUrl = '/api/orders'; // Placeholder URL base

  // Opzioni HTTP, ad esempio per specificare il tipo di contenuto
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
      // Potresti aggiungere altri header qui, come token di autorizzazione, se necessari
      // 'Authorization': 'Bearer TUO_TOKEN_JWT'
    })
  };

  constructor(private http: HttpClient) { }

  /**
   * GET: Recupera tutti gli ordini dal server, con filtri opzionali.
   * @param filterDate - Data per filtrare gli ordini (formato YYYY-MM-DD).
   * @param searchTerm - Termine di ricerca per nome cliente o descrizione.
   * Il backend si occuperà di interpretare questi parametri.
   */
  getOrders(filterDate?: string, searchTerm?: string): Observable<Order[]> {
    let params = new HttpParams();
    if (filterDate) {
      params = params.append('date', filterDate); // Es: /api/orders?date=2024-12-25
    }
    if (searchTerm && searchTerm.trim() !== '') {
      params = params.append('search', searchTerm.trim()); // Es: /api/orders?search=Mario
    }

    // La chiamata GET sarà a: /api/orders?param1=valore1&param2=valore2...
    return this.http.get<Order[]>(this.apiUrl, { params }) // Non servono httpOptions per GET semplice
      .pipe(
        tap(orders => console.log(`[OrderService] Fetched ${orders.length} orders with params:`, {filterDate, searchTerm})),
        catchError(this.handleError)
      );
  }

  /**
   * GET: Recupera un singolo ordine per ID.
   * @param id - L'ID dell'ordine da recuperare.
   */
  getOrderById(id: string | number): Observable<Order> {
    // La chiamata GET sarà a: /api/orders/{id}
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Order>(url) // Non servono httpOptions per GET semplice
      .pipe(
        tap(order => console.log(`[OrderService] Fetched order id=${id}:`, order)),
        catchError(this.handleError)
      );
  }

  /**
   * POST: Crea un nuovo ordine sul server.
   * @param orderData - I dati dell'ordine da creare (senza ID, che sarà assegnato dal backend).
   * Il backend dovrebbe restituire l'ordine creato, incluso il suo nuovo ID.
   */
  createOrder(orderData: Omit<Order, 'id' | 'totalAmount'>): Observable<Order> {
    // La chiamata POST sarà a: /api/orders
    // Il corpo della richiesta conterrà orderData in formato JSON.
    return this.http.post<Order>(this.apiUrl, orderData, this.httpOptions)
      .pipe(
        tap(newOrder => console.log('[OrderService] Created order:', newOrder)),
        catchError(this.handleError)
      );
  }

  /**
   * PUT: Aggiorna un ordine esistente sul server.
   * @param id - L'ID dell'ordine da aggiornare.
   * @param orderData - I dati parziali o completi dell'ordine da aggiornare.
   * Il backend dovrebbe restituire l'ordine aggiornato.
   */
  updateOrder(id: string | number, orderData: Partial<Order>): Observable<Order> {
    // La chiamata PUT sarà a: /api/orders/{id}
    // Il corpo della richiesta conterrà orderData in formato JSON.
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<Order>(url, orderData, this.httpOptions)
      .pipe(
        tap(updatedOrder => console.log(`[OrderService] Updated order id=${id}:`, updatedOrder)),
        catchError(this.handleError)
      );
  }

  /**
   * DELETE: Elimina un ordine dal server.
   * @param id - L'ID dell'ordine da eliminare.
   * Il backend dovrebbe rispondere con uno stato 204 (No Content) o 200 OK se l'eliminazione ha successo.
   */
  deleteOrder(id: string | number): Observable<void> { // Observable<void> se il backend non restituisce corpo
    // La chiamata DELETE sarà a: /api/orders/{id}
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<void>(url, this.httpOptions) // httpOptions può includere header di autorizzazione
      .pipe(
        tap(() => console.log(`[OrderService] Deleted order id=${id}`)),
        catchError(this.handleError)
      );
  }

  /**
   * Gestore di errori generico per le chiamate HTTP.
   * @param error - L'oggetto HttpErrorResponse.
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Si è verificato un errore sconosciuto durante la chiamata API!';
    if (error.error instanceof ErrorEvent) {
      // Errore lato client o di rete.
      errorMessage = `Errore del client: ${error.error.message}`;
    } else {
      // Il backend ha restituito un codice di errore.
      // Il corpo della risposta (error.error) potrebbe contenere indizi sull'errore.
      errorMessage = `Errore dal server (Codice: ${error.status}): ${error.message}`;
      if (error.error && typeof error.error === 'object') {
        // Prova a estrarre un messaggio più specifico dal corpo dell'errore JSON del backend
        const serverError = error.error;
        const details = serverError.message || serverError.title || serverError.detail || JSON.stringify(serverError);
        errorMessage += `\nDettagli: ${details}`;
      } else if (typeof error.error === 'string' && error.error.trim() !== '') {
        errorMessage += `\nDettagli: ${error.error}`;
      }
    }
    console.error('[OrderService API Error]', errorMessage, error); // Log completo dell'errore
    // Restituisci un observable con un errore user-friendly.
    return throwError(() => new Error(`Si è verificato un problema. ${errorMessage}`));
  }
}
