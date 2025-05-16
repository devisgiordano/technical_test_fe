// src/app/components/order-form/order-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { OrderService } from '../../services/order.service';
// Assicurati che Order, BackendOrderItemPayload, FrontendOrderItem siano importati correttamente
import { Order, BackendOrderItemPayload, FrontendOrderItem } from '../../models/order.model';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http'; // Per tipizzare l'errore

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
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

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();

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
        this.addOrderItem();
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
      // Il campo del form HTML <input type="date"> restituisce una stringa yyyy-MM-dd
      orderDate: [new Date().toISOString().substring(0, 10), Validators.required],
      description: [''],
      status: ['Pending' as Order['status'], Validators.required],
      orderItems: this.fb.array([], Validators.minLength(1))
    });
  }

  loadOrderForEditing(id: string | number): void {
    this.isLoading = true;
    this.orderService.getOrderById(id).subscribe({
      next: (order: Order) => { // order.orderDate sarà una stringa ISO dal backend
        // Per il campo <input type="date">, serve solo la parte yyyy-MM-dd
        const orderDateFormatted = order.orderDate ? order.orderDate.substring(0, 10) : '';
        this.orderForm.patchValue({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          orderDate: orderDateFormatted,
          description: order.description,
          status: order.status
        });
        this.orderItems.clear();
        order.orderItems?.forEach((item) => { // item è di tipo BackendOrderItem
            const formItem: FrontendOrderItem = {
                name: item.product?.name || '',
                description: item.product?.description || '',
                quantity: item.quantity || 1,
                price: parseFloat(item.priceAtPurchase || item.product?.price || '0')
            };
            this.addOrderItem(formItem);
        });
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = `Errore caricamento ordine: ${err.message}`;
        this.isLoading = false;
      }
    });
  }

  get orderItems(): FormArray {
    return this.orderForm.get('orderItems') as FormArray;
  }

  newOrderItemFormGroup(itemData?: FrontendOrderItem): FormGroup {
    return this.fb.group({
      name: [itemData?.name || '', Validators.required],
      description: [itemData?.description || ''],
      quantity: [itemData?.quantity || 1, [Validators.required, Validators.min(1), Validators.pattern("^[1-9][0-9]*$")]],
      price: [itemData?.price || 0.01, [Validators.required, Validators.min(0.01)]]
    });
  }

  addOrderItem(itemData?: FrontendOrderItem): void {
    this.orderItems.push(this.newOrderItemFormGroup(itemData));
  }

  removeOrderItem(index: number): void {
    if (this.orderItems.length > 1) {
      this.orderItems.removeAt(index);
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

    // Prepara il payload per il backend
    // Definiamo esplicitamente il tipo del payload che inviamo al servizio
    const payloadForService: {
        orderNumber: string;
        customerName: string;
        orderDate: string; // Deve essere una stringa ISO
        description?: string;
        status: Order['status'];
        orderItems: BackendOrderItemPayload[];
    } = {
        orderNumber: formValue.orderNumber,
        customerName: formValue.customerName,
        // formValue.orderDate è 'yyyy-MM-dd'. Convertiamo in ISO string completa se necessario,
        // o ci assicuriamo che il backend la gestisca. Per coerenza, inviamo ISO completa.
        orderDate: new Date(formValue.orderDate).toISOString(), // Già una stringa ISO
        description: formValue.description,
        status: formValue.status,
        orderItems: formValue.orderItems.map((item: FrontendOrderItem): BackendOrderItemPayload => {
          return {
            product: {
              name: item.name,
              price: String(item.price),
              description: item.description || undefined // Invia undefined se vuoto
            },
            quantity: item.quantity,
            priceAtPurchase: String(item.price)
          };
        })
    };

    // Ora non c'è più bisogno del cast problematico se payloadForService matcha la firma del servizio
    const operation = this.isEditMode && this.orderId
      ? this.orderService.updateOrder(this.orderId, payloadForService) // Assicurati che updateOrder accetti questo tipo
      : this.orderService.createOrder(payloadForService);

    operation.subscribe({
      next: (savedOrder) => {
        this.isSubmitting = false;
        // this.router.navigate(['/orders', savedOrder.id]); // L'ID potrebbe essere string o number
        this.router.navigate(['/orders', String(savedOrder.id)]);
      },
      error: (err: HttpErrorResponse) => this.handleSubmitError(err, this.isEditMode ? 'aggiornamento' : 'creazione')
    });
  }

  private handleSubmitError(err: HttpErrorResponse, operation: string): void {
    this.errorMessage = `Errore ${operation}: ${err.message || 'Dettagli nella console.'}`;
    this.isSubmitting = false;
    window.scrollTo(0,0);
    console.error(`Errore durante ${operation}:`, err);
  }

  cancel(): void {
    if (this.isEditMode && this.orderId) {
      // this.router.navigate(['/orders', this.orderId]);
      this.router.navigate(['/orders', String(this.orderId)]);
    } else {
      this.router.navigate(['/orders']);
    }
  }

  getOrderItemControl(index: number, fieldName: string): AbstractControl | null {
    return this.orderItems.at(index)?.get(fieldName) || null;
  }
}
