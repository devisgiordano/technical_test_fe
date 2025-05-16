// File: frontend/src/app/components/layout/navbar/navbar.component.ts
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common'; // Importa CommonModule se usi direttive come *ngIf nel template

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule, // Necessario se il template usa *ngIf, *ngFor, ecc.
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  constructor() { }
}
