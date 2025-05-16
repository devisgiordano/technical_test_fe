// File: frontend/src/app/components/order-detail/order-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';
import { CommonModule } from '@angular/common'; // Per *ngIf, *ngFor, pipe, ngClass

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  order: Order | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  private routeSubscription: Subscription | undefined;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
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
    this.errorMessage = null;
    this.orderService.getOrderById(id).subscribe({
      next: (data) => { this.order = data; this.isLoading = false; },
      error: (err) => {
        this.errorMessage = `Errore dettaglio ordine (ID: ${id}): ${err.message}`;
        this.isLoading = false; console.error(err);
      }
    });
  }

  calculateProductSubtotal(price: number, quantity: number): number {
    return price * quantity;
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }

  editOrder(): void {
    if (this.order) {
      this.router.navigate(['/orders', this.order.id, 'edit']);
    }
  }
}
