import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { AuthResponse } from '../../core/models/auth.model';

@Component({
  selector: 'app-header',
  template: `
    <!-- Top Bar Shopee Style -->
    <div class="top-bar text-white py-1 small">
      <div class="container d-flex justify-content-between align-items-center">
        <div class="d-flex align-items-center gap-3">
          <span><i class="fa-solid fa-phone me-1"></i> Hotline: <strong>1900 8888</strong> (8:00 - 22:00)</span>
          <span class="d-none d-md-inline text-white-50">|</span>
          <span class="d-none d-md-inline"><i class="fa-solid fa-truck-fast me-1"></i> Freeship toàn quốc đơn từ 300K</span>
        </div>
        <div class="d-flex align-items-center gap-3">
          <a *ngIf="isAdmin$ | async" routerLink="/admin" class="badge bg-warning text-dark px-2 py-1 text-decoration-none">
            <i class="fa-solid fa-gauge-high me-1"></i> Quản Trị Admin
          </a>

          <ng-container *ngIf="currentUser$ | async as user; else guestTpl">
            <div class="dropdown">
              <a class="dropdown-toggle text-white text-decoration-none d-flex align-items-center gap-1" href="#" role="button" data-bs-toggle="dropdown">
                <i class="fa-solid fa-circle-user fs-6"></i>
                <span class="fw-semibold">{{ user.fullName || user.username }}</span>
              </a>
              <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                <li><span class="dropdown-item-text text-muted small">Quyền: <strong>{{ user.role }}</strong></span></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" routerLink="/orders/my-orders"><i class="fa-solid fa-box me-2 text-primary"></i> Đơn hàng của tôi</a></li>
                <li *ngIf="user.role === 'Admin'"><a class="dropdown-item" routerLink="/admin"><i class="fa-solid fa-gear me-2 text-warning"></i> Trang quản trị Admin</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><button class="dropdown-item text-danger" (click)="onLogout()"><i class="fa-solid fa-arrow-right-from-bracket me-2"></i> Đăng xuất</button></li>
              </ul>
            </div>
          </ng-container>

          <ng-template #guestTpl>
            <a routerLink="/auth/login" class="text-white text-decoration-none hover-underline">Đăng nhập</a>
            <span class="text-white-50">|</span>
            <a routerLink="/auth/register" class="text-white text-decoration-none hover-underline">Đăng ký</a>
          </ng-template>
        </div>
      </div>
    </div>

    <!-- Main Header -->
    <header class="main-header shadow-sm bg-white sticky-top">
      <div class="container py-2 py-md-3">
        <div class="row align-items-center g-2 g-md-4">
          <!-- Logo -->
          <div class="col-6 col-md-3">
            <a routerLink="/" class="d-flex align-items-center text-decoration-none">
              <div class="logo-icon bg-gradient-brand text-white rounded-circle d-flex align-items-center justify-content-center me-2 me-md-3">
                <i class="fa-solid fa-paw fs-4"></i>
              </div>
              <div>
                <span class="brand-title brand-font fs-3 fw-bold text-dark lh-1 d-block">PetShop<span class="text-brand">.vn</span></span>
                <small class="text-muted text-uppercase fw-semibold letter-spacing d-none d-sm-block">Thiên đường cưng nựng</small>
              </div>
            </a>
          </div>

          <!-- Search Bar -->
          <div class="col-12 col-md-6 order-3 order-md-2">
            <form (ngSubmit)="onSearch()" class="position-relative">
              <div class="input-group search-box shadow-sm rounded-pill overflow-hidden border">
                <input type="text" 
                       [(ngModel)]="searchKeyword" 
                       name="keyword"
                       class="form-control border-0 ps-3 ps-md-4 shadow-none py-2" 
                       placeholder="Tìm giống chó, mèo, hạt Royal Canin, thức ăn, phụ kiện...">
                <button class="btn btn-brand px-4 text-white" type="submit">
                  <i class="fa-solid fa-magnifying-glass me-1"></i> <span class="d-none d-sm-inline">Tìm kiếm</span>
                </button>
              </div>
              <!-- Hot keywords -->
              <div class="hot-keywords mt-1 small d-none d-md-flex gap-2 text-muted ps-3">
                <span>Gợi ý:</span>
                <a href="javascript:void(0)" (click)="quickSearch('Corgi')" class="text-muted hover-brand">Corgi</a>
                <a href="javascript:void(0)" (click)="quickSearch('Poodle')" class="text-muted hover-brand">Poodle</a>
                <a href="javascript:void(0)" (click)="quickSearch('Aln')" class="text-muted hover-brand">Mèo Aln</a>
                <a href="javascript:void(0)" (click)="quickSearch('Royal Canin')" class="text-muted hover-brand">Royal Canin</a>
                <a href="javascript:void(0)" (click)="quickSearch('Whiskas')" class="text-muted hover-brand">Whiskas</a>
              </div>
            </form>
          </div>

          <!-- Cart & Actions -->
          <div class="col-6 col-md-3 order-2 order-md-3 text-end">
            <a routerLink="/cart" class="btn btn-cart position-relative d-inline-flex align-items-center px-3 py-2 rounded-pill shadow-sm">
              <i class="fa-solid fa-cart-shopping fs-5 text-brand me-2"></i>
              <span class="d-none d-lg-inline fw-semibold text-dark">Giỏ hàng</span>
              <span *ngIf="(cartCount$ | async) as count" 
                    class="badge bg-danger rounded-pill ms-2 animate-bounce">
                {{ count }}
              </span>
            </a>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs (TAB 1: THÚ CƯNG | TAB 2: ĐỒ DÙNG THÚ CƯNG) -->
      <app-navbar></app-navbar>
    </header>
  `,
  styles: [`
    .top-bar {
      background: linear-gradient(90deg, #ff5722 0%, #ff7a00 100%);
    }
    .text-brand {
      color: #ff5722;
    }
    .bg-gradient-brand {
      background: linear-gradient(135deg, #ff5722 0%, #ff9800 100%);
      width: 44px;
      height: 44px;
    }
    .btn-brand {
      background-color: #ff5722;
      border: none;
      &:hover {
        background-color: #e64a19;
      }
    }
    .btn-cart {
      background-color: #fff4f0;
      border: 1px solid #ffd8cc;
      &:hover {
        background-color: #ffe8e0;
      }
    }
    .hover-brand:hover {
      color: #ff5722 !important;
    }
    .letter-spacing {
      letter-spacing: 1px;
      font-size: 0.65rem;
    }
    .search-box {
      border-color: #ffbba7 !important;
    }
    .animate-bounce {
      animation: bounce 1s infinite alternate;
    }
    @keyframes bounce {
      from { transform: translateY(0); }
      to { transform: translateY(-3px); }
    }
  `]
})
export class HeaderComponent implements OnInit {
  currentUser$: Observable<AuthResponse | null>;
  isAdmin$: Observable<boolean>;
  cartCount$: Observable<number>;
  searchKeyword: string = '';

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.isAdmin$ = this.authService.isAdmin$;
    this.cartCount$ = this.cartService.itemCount$;
  }

  ngOnInit(): void {}

  onSearch(): void {
    if (!this.searchKeyword.trim()) return;
    // Tìm kiếm điều hướng sang /products hoặc /pets theo ngữ cảnh
    this.router.navigate(['/products'], { queryParams: { q: this.searchKeyword.trim() } });
  }

  quickSearch(keyword: string): void {
    this.searchKeyword = keyword;
    this.onSearch();
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
