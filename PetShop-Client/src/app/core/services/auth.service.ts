import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject: BehaviorSubject<AuthResponse | null>;
  public currentUser$: Observable<AuthResponse | null>;

  constructor(private http: HttpClient) {
    const savedUser = localStorage.getItem('petshop_user');
    this.currentUserSubject = new BehaviorSubject<AuthResponse | null>(
      savedUser ? JSON.parse(savedUser) : null
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  public get isLoggedIn$(): Observable<boolean> {
    return this.currentUser$.pipe(map(user => !!user && !!user.token));
  }

  public get isAdmin$(): Observable<boolean> {
    return this.currentUser$.pipe(map(user => !!user && user.role === 'Admin'));
  }

  public getToken(): string | null {
    return this.currentUserValue ? this.currentUserValue.token : null;
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, req).pipe(
      tap(res => {
        localStorage.setItem('petshop_user', JSON.stringify(res));
        this.currentUserSubject.next(res);
      })
    );
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, req).pipe(
      tap(res => {
        localStorage.setItem('petshop_user', JSON.stringify(res));
        this.currentUserSubject.next(res);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('petshop_user');
    this.currentUserSubject.next(null);
  }
}
