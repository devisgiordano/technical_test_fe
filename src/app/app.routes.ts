// File: frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { OrderListComponent } from './components/order-list/order-list.component';
import { OrderDetailComponent } from './components/order-detail/order-detail.component';
import { OrderFormComponent } from './components/order-form/order-form.component';
// import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component'; // Se lo crei

export const routes: Routes = [
  { path: '', redirectTo: '/orders', pathMatch: 'full' },
  {
    path: 'orders',
    component: OrderListComponent,
    title: 'Elenco Ordini'
  },
  {
    path: 'orders/new',
    component: OrderFormComponent,
    title: 'Nuovo Ordine'
  },
  {
    path: 'orders/:id',
    component: OrderDetailComponent,
    title: 'Dettaglio Ordine'
  },
  {
    path: 'orders/:id/edit',
    component: OrderFormComponent,
    title: 'Modifica Ordine'
  },
  // { path: '**', component: PageNotFoundComponent, title: 'Pagina Non Trovata' }
];
