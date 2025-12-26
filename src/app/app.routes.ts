// File: frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { OrderListComponent } from './components/order-list/order-list.component';
import { OrderDetailComponent } from './components/order-detail/order-detail.component';
import { OrderFormComponent } from './components/order-form/order-form.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProfileComponent } from './components/profile/profile.component';

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
  { path: 'login', component: LoginComponent, title: 'Login' },
  { path: 'register', component: RegisterComponent, title: 'Register' },
  { path: 'profile', component: ProfileComponent, title: 'Profile' },
];