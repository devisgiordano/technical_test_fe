// File: frontend/src/app/components/order-list/order-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';
import { CommonModule } from '@angular/common'; // Per *ngIf, *ngFor, pipe, ngClass
import { FormsModule } from '@angular/forms';    // Per [(ngModel)]

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.css']
})
export class OrderListComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  filterDate: string = '';
  searchTerm: string = '';

  private searchTerms = new Subject<string>();
  private dateChanges = new Subject<string>();
  private subscriptions = new Subscription();

  constructor(private orderService: OrderService, private router: Router) {}

  ngOnInit(): void {
    this.loadInitialOrders();
    this.subscriptions.add(
      this.searchTerms.pipe(
        debounceTime(400),
        distinctUntilChanged(),
        tap(() => this.applyFilters())
      ).subscribe()
    );
    this.subscriptions.add(
      this.dateChanges.pipe(
        debounceTime(400),
        distinctUntilChanged(),
        tap(() => this.applyFilters())
      ).subscribe()
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadInitialOrders(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.subscriptions.add(
      this.orderService.getOrders().subscribe({
        next: (data) => { this.orders = data; this.isLoading = false; },
        error: (err) => this.handleLoadingError(err)
      })
    );
  }

  onSearchTermChanged(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.searchTerm = term;
    this.searchTerms.next(term);
  }

  onDateChanged(event: Event): void {
    const dateValue = (event.target as HTMLInputElement).value;
    this.filterDate = dateValue;
    this.dateChanges.next(dateValue);
  }

  applyFilters(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.subscriptions.add(
      this.orderService.getOrders(this.filterDate, this.searchTerm).subscribe({
        next: (data) => { this.orders = data; this.isLoading = false; },
        error: (err) => this.handleLoadingError(err)
      })
    );
  }

  clearFilters(): void {
    this.filterDate = '';
    this.searchTerm = '';
    this.loadInitialOrders();
  }

  private handleLoadingError(err: any): void {
    this.errorMessage = `Errore: ${err.message || 'Dettagli nella console.'}`;
    this.isLoading = false;
    console.error(err);
  }

  viewOrderDetails(id: string | number): void {
    this.router.navigate(['/orders', id]);
  }

  editOrder(id: string | number): void {
    this.router.navigate(['/orders', id, 'edit']);
  }

  deleteOrder(id: string | number): void {
    if (confirm(`Sei sicuro di voler eliminare l'ordine ID: ${id}?`)) {
      this.isLoading = true;
      this.subscriptions.add(
        this.orderService.deleteOrder(id).subscribe({
          next: () => { this.isLoading = false; this.applyFilters(); },
          error: (err) => {
            this.errorMessage = `Errore eliminazione: ${err.message}`;
            this.isLoading = false; console.error(err);
          }
        })
      );
    }
  }
}
