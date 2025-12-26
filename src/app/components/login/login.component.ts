import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">Login</div>
            <div class="card-body">
              <div *ngIf="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>

              <!-- Step 1: Email/Password -->
              <form *ngIf="!twoFactorRequired" (ngSubmit)="login()">
                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input type="email" class="form-control" id="email" [(ngModel)]="email" name="email" required>
                </div>
                <div class="mb-3">
                  <label for="password" class="form-label">Password</label>
                  <input type="password" class="form-control" id="password" [(ngModel)]="password" name="password" required>
                </div>
                <button type="submit" class="btn btn-primary w-100">Login</button>
              </form>

              <!-- Step 2: 2FA Code -->
              <div *ngIf="twoFactorRequired">
                <p class="text-center">Two-Factor Authentication Required</p>
                <div class="mb-3">
                  <label for="code" class="form-label">Authentication Code</label>
                  <input type="text" class="form-control" id="code" [(ngModel)]="twoFactorCode" name="code" placeholder="123456" required>
                </div>
                <button (click)="verify2fa()" class="btn btn-primary w-100">Verify</button>
              </div>

              <div class="mt-3 text-center">
                <a routerLink="/register">Don't have an account? Register</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';
  twoFactorCode = '';
  twoFactorRequired = false;
  tempToken = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        if (res['2fa_required']) {
          this.twoFactorRequired = true;
          this.tempToken = res.temp_token;
        } else if (res.token) {
          this.authService.setToken(res.token);
          this.router.navigate(['/profile']);
        }
      },
      error: (err) => {
        this.errorMessage = err.error.message || 'Login failed';
      }
    });
  }

  verify2fa() {
    this.authService.verifyLogin2fa(this.tempToken, this.twoFactorCode).subscribe({
      next: (res) => {
        if (res.token) {
          this.authService.setToken(res.token);
          this.router.navigate(['/profile']);
        }
      },
      error: (err) => {
        this.errorMessage = err.error.message || 'Verification failed';
      }
    });
  }
}
