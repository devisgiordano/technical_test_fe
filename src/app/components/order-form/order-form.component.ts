// File: frontend/src/app/components/order-form/order-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { OrderService } from '../../services/order.service';
// Assicurati che il path sia corretto per i tuoi modelli.
// Se hai product.model.ts e order.model.ts separati in src/app/models/
import { Order } from '../../models/order.model';
import { Product } from '../../models/product.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink // Se usi routerLink nel template (es. per il bottone "Annulla")
  ],
  templateUrl: './order-form.component.html',
  styleUrls: ['./order-form.component.css']
})
export class OrderFormComponent implements OnInit, OnDestroy {
  orderForm!: FormGroup;
  isEditMode = false;
  orderId: string | number | null = null;
  isLoading = false;
  isSubmitting = false;
  errorMessage: string | null = null;
  pageTitle = 'Nuovo Ordine';

  availableStatuses: Order['status'][] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  private routeSubscription: Subscription | undefined;

  // TODO: Caricare i prodotti disponibili dal backend per la selezione nel form
  // availableProducts: BackendProduct[] = []; // BackendProduct avrebbe id, name, currentPrice

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    // TODO: Caricare this.availableProducts se si vogliono selezionare prodotti esistenti

    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const idFromRoute = params.get('id');
      if (idFromRoute) {
        this.isEditMode = true;
        this.orderId = idFromRoute;
        this.pageTitle = `Modifica Ordine #${this.orderId}`;
        this.loadOrderForEditing(this.orderId);
      } else {
        this.isEditMode = false;
        this.pageTitle = 'Crea Nuovo Ordine';
        this.addProduct(); // Aggiungi una riga di prodotto vuota per i nuovi ordini
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  initForm(): void {
    this.orderForm = this.fb.group({
      orderNumber: ['', Validators.required],
      customerName: ['', [Validators.required, Validators.minLength(3)]],
      orderDate: [new Date().toISOString().substring(0, 10), Validators.required],
      description: [''],
      status: ['Pending' as Order['status'], Validators.required],
      products: this.fb.array([], Validators.minLength(1)) // Almeno un prodotto
    });
  }

  loadOrderForEditing(id: string | number): void {
    this.isLoading = true;
    this.orderService.getOrderById(id).subscribe({
      next: (order) => {
        const orderDateFormatted = order.orderDate ? new Date(order.orderDate).toISOString().substring(0, 10) : '';
        this.orderForm.patchValue({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          orderDate: orderDateFormatted,
          description: order.description,
          status: order.status
        });
        this.products.clear();
        order.products.forEach(product => this.addProduct(product));
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = `Errore caricamento ordine: ${err.message}`;
        this.isLoading = false;
      }
    });
  }

  get products(): FormArray {
    return this.orderForm.get('products') as FormArray;
  }

  newProductGroup(product?: Product): FormGroup {
    return this.fb.group({
      name: [product?.name || '', Validators.required],
      description: [product?.description || ''],
      // CORREZIONE QUI: Validators.pattern invece di Validatorspattern
      quantity: [product?.quantity || 1, [Validators.required, Validators.min(1), Validators.pattern("^[1-9][0-9]*$")]],
      price: [product?.price || 0.01, [Validators.required, Validators.min(0.01)]]
    });
  }

  addProduct(product?: Product): void {
    this.products.push(this.newProductGroup(product));
  }

  removeProduct(index: number): void {
    if (this.products.length > 1) {
      this.products.removeAt(index);
    } else {
      alert("Un ordine deve contenere almeno un prodotto.");
    }
  }

  onSubmit(): void {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      this.errorMessage = "Form incompleto o con errori. Controlla i campi e aggiungi almeno un prodotto.";
      window.scrollTo(0,0);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    const formValue = this.orderForm.value;

    const orderPayload: Omit<Order, 'id' | 'totalAmount'> = {
        orderNumber: formValue.orderNumber,
        customerName: formValue.customerName,
        orderDate: new Date(formValue.orderDate).toISOString(),
        description: formValue.description,
        products: formValue.products,
        status: formValue.status,
    };

    const operation = this.isEditMode && this.orderId
      ? this.orderService.updateOrder(this.orderId, orderPayload as Partial<Order>)
      : this.orderService.createOrder(orderPayload);

    operation.subscribe({
      next: (savedOrder) => {
        this.isSubmitting = false;
        this.router.navigate(['/orders', savedOrder.id]);
      },
      error: (err) => this.handleSubmitError(err, this.isEditMode ? 'aggiornamento' : 'creazione')
    });
  }

  private handleSubmitError(err: any, operation: string): void {
    this.errorMessage = `Errore ${operation}: ${err.message || 'Dettagli nella console.'}`;
    this.isSubmitting = false;
    window.scrollTo(0,0);
    console.error(err);
  }

  cancel(): void {
    if (this.isEditMode && this.orderId) {
      this.router.navigate(['/orders', this.orderId]);
    } else {
      this.router.navigate(['/orders']);
    }
  }

  getProductControl(index: number, fieldName: string): AbstractControl | null {
    return this.products.at(index)?.get(fieldName) || null;
  }
}