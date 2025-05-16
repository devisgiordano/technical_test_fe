// File: frontend/src/app/components/order-form/order-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model'; // Usa la versione aggiornata con orderItems
import { Product } from '../../models/product.model'; // Rappresenta una riga d'ordine nel form
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
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
      // 'products' FormArray conterrà FormGroups che corrispondono all'interfaccia Product del frontend
      products: this.fb.array([], Validators.minLength(1))
    });
  }

  loadOrderForEditing(id: string | number): void {
    this.isLoading = true;
    this.orderService.getOrderById(id).subscribe({
      next: (orderFromBackend) => {
        const orderDateFormatted = orderFromBackend.orderDate ? new Date(orderFromBackend.orderDate).toISOString().substring(0, 10) : '';
        this.orderForm.patchValue({
          orderNumber: orderFromBackend.orderNumber,
          customerName: orderFromBackend.customerName,
          orderDate: orderDateFormatted,
          description: orderFromBackend.description,
          status: orderFromBackend.status
        });

        this.products.clear(); // Pulisci il FormArray
        // Mappa gli orderItems del backend alla struttura Product del frontend per il form
        orderFromBackend.orderItems?.forEach(backendItem => {
          // Assumiamo che backendItem.product contenga l'entità Product completa
          // e backendItem.priceAtPurchase e backendItem.quantity siano disponibili
          if (backendItem.product) { // Verifica che il prodotto esista nell'item
            const formProductItem: Product = {
              id: backendItem.product.id, // ID del Product effettivo
              name: backendItem.product.name,
              description: backendItem.product.description,
              price: parseFloat(backendItem.priceAtPurchase as string), // Prezzo al momento dell'acquisto
              quantity: backendItem.quantity
            };
            this.addProduct(formProductItem);
          } else {
            console.warn("OrderItem dal backend non ha un prodotto associato:", backendItem);
          }
        });
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

  // Il 'product' qui è un oggetto che corrisponde all'interfaccia Product del frontend
  // (che rappresenta una riga d'ordine nel form)
  newProductGroup(product?: Product): FormGroup {
    return this.fb.group({
      // 'id' qui è l'ID del Prodotto del backend, usato per creare l'IRI
      // Per un nuovo item aggiunto manualmente, l'utente dovrebbe selezionare un prodotto
      // e questo ID verrebbe popolato.
      id: [product?.id || null, Validators.required], // ID del Product del backend
      name: [product?.name || '', Validators.required], // Nome per display, potrebbe essere disabilitato se selezionato da una lista
      description: [product?.description || ''], // Descrizione per display
      quantity: [product?.quantity || 1, [Validators.required, Validators.min(1), Validators.pattern("^[1-9][0-9]*$")]],
      price: [product?.price || 0.01, [Validators.required, Validators.min(0.01)]] // Questo è il priceAtPurchase
    });
  }

  // Aggiunge una nuova riga di prodotto al form.
  // Se 'product' è fornito, popola i campi (utile per loadOrderForEditing).
  // Se non fornito, aggiunge una riga vuota (utile per il bottone "Aggiungi Prodotto").
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

    // Prepara il payload per il backend, trasformando 'products' del form in 'orderItems'
    const orderPayloadForBackend = {
      orderNumber: formValue.orderNumber,
      customerName: formValue.customerName,
      orderDate: new Date(formValue.orderDate).toISOString(),
      description: formValue.description,
      status: formValue.status,
      orderItems: formValue.products.map((formProductItem: Product) => {
        if (!formProductItem.id) {
          // Questo non dovrebbe accadere se il campo 'id' nel form è required
          // e se l'utente seleziona un prodotto da una lista.
          // Se l'utente può inserire prodotti "nuovi" direttamente nel form dell'ordine,
          // la logica qui e nel backend dovrebbe essere più complessa.
          console.error("ID prodotto mancante per un item dell'ordine nel form:", formProductItem);
          throw new Error("ID prodotto (formProductItem.id) è mancante per un item dell'ordine.");
        }
        return {
          product: `/api/products/${formProductItem.id}`, // IRI del Product del backend
          quantity: formProductItem.quantity,
          priceAtPurchase: formProductItem.price.toString() // Invia come stringa se il backend si aspetta decimal come string
        };
      })
    };

    // Determina se creare o aggiornare
    const operation = this.isEditMode && this.orderId
      ? this.orderService.updateOrder(this.orderId, orderPayloadForBackend as Partial<Order>) // Potrebbe servire un cast più specifico o un tipo dedicato per il payload
      : this.orderService.createOrder(orderPayloadForBackend as Omit<Order, 'id' | 'totalAmount' | 'orderItems'> & { orderItems: any[] }); // Cast per il tipo di payload

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

  // TODO: Implementare la logica per selezionare un prodotto da una lista
  // (es. da this.availableProducts) e popolare i campi 'id', 'name', 'description', 'price'
  // del FormGroup del prodotto nel FormArray.
  // onProductSelected(productIndex: number, selectedBackendProduct: BackendProduct): void {
  //   const productFormGroup = this.products.at(productIndex) as FormGroup;
  //   if (productFormGroup) {
  //     productFormGroup.patchValue({
  //       id: selectedBackendProduct.id, // ID del prodotto del backend
  //       name: selectedBackendProduct.name,
  //       description: selectedBackendProduct.description,
  //       price: parseFloat(selectedBackendProduct.price), // Prezzo corrente del prodotto, da usare come priceAtPurchase
  //       quantity: 1 // Default quantity
  //     });
  //   }
  // }
}
