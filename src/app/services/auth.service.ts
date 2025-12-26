import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost/api';
  private tokenKey = 'auth_token';
  public currentUserSubject = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient, private router: Router) {
    const token = this.getToken();
    if (token) {
        this.currentUserSubject.next({ token });
    }
  }

  register(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, credentials);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  verifyLogin2fa(tempToken: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/2fa/login`, { temp_token: tempToken, code }).pipe(
      tap((response: any) => {
        if (response.token) {
          this.setToken(response.token);
        }
      })
    );
  }

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
    this.currentUserSubject.next({ token });
  }

  getToken(): string | null {
      // Check if running in browser
      if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(this.tokenKey);
      }
      return null;
  }

  logout() {
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.tokenKey);
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  setup2fa(): Observable<any> {
    return this.http.post(`${this.apiUrl}/2fa/setup`, {}, { headers: this.getHeaders() });
  }

  enable2fa(secret: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/2fa/enable`, { secret, code }, { headers: this.getHeaders() });
  }

  disable2fa(): Observable<any> {
    return this.http.post(`${this.apiUrl}/2fa/disable`, {}, { headers: this.getHeaders() });
  }

  private getHeaders(): HttpHeaders {
      const token = this.getToken();
      return new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
      });
  }
  
  isAuthenticated(): boolean {
      return !!this.getToken();
  }
}
