// File: frontend/src/app/components/order-detail/order-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core'; // Assicurati che OnInit e OnDestroy siano importati
import { ActivatedRoute, Router } from '@angular/router'; // RouterLink potrebbe non servire se non usato nel template
import { Subscription } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model'; // Order model aggiornato
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http'; // Per tipizzare l'errore HTTP

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  // order: Order | null = null; // Se Order model è ben definito dopo le modifiche
  order: any | null = null; // Usiamo 'any' per flessibilità con la struttura restituita dal backend
                            // che include 'product' annidato in 'orderItems'.
                            // Idealmente, definire un'interfaccia per questo.
  isLoading = true;
  errorMessage: string | null = null; // Proprietà dichiarata
  private routeSubscription: Subscription | undefined; // Proprietà dichiarata

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService, // Proprietà iniettata tramite costruttore
    private router: Router
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const idFromRoute = params.get('id');
      if (idFromRoute) {
        this.loadOrderDetails(idFromRoute);
      } else {
        this.handleMissingId();
      }
    });
  }

  private handleMissingId(): void {
    this.errorMessage = 'ID ordine non fornito.';
    this.isLoading = false;
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  loadOrderDetails(id: string | number): void {
    this.isLoading = true;
    this.errorMessage = null; // Accede alla proprietà dichiarata
    this.orderService.getOrderById(id).subscribe({ // Accede alla proprietà orderService
      next: (data: Order) => { // Tipizza 'data'
        this.order = data;
        this.isLoading = false;
        console.log('Order loaded:', data);
      },
      error: (err: HttpErrorResponse) => { // Tipizza 'err'
        this.errorMessage = `Errore dettaglio ordine (ID: ${id}): ${err.message}`; // Accede alla proprietà dichiarata
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  // Metodo per calcolare il subtotale di un item, aggiornato per usare priceAtPurchase (stringa)
  calculateItemSubtotal(priceAtPurchase: string, quantity: number): number {
    if (priceAtPurchase === null || quantity === null) {
        return 0;
    }
    return parseFloat(priceAtPurchase) * quantity;
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }

  editOrder(): void {
    if (this.order && this.order.id) { // Assicurati che order.id esista
      this.router.navigate(['/orders', this.order.id, 'edit']);
    }
  }
}