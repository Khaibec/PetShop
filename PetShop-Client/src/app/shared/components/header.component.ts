
import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ChatService } from '../../core/services/chat.service';
import { AuthResponse } from '../../core/models/auth.model';

@Component({
  selector: 'app-header',
  template: `
    <!-- =========================TOP BAR========================== -->
    <div class="top-bar text-white">
      <div class="container">
        <div class="top-bar-content">

          <!-- LEFT: Hotline + Freeship -->
          <div class="top-left">
            <span class="top-item">
              <i class="fa-solid fa-phone me-1"></i>
              Hotline:
              <strong>1900 8888</strong>
              <span class="top-time">(8:00 - 22:00)</span>
            </span>

            <span class="top-divider d-none d-lg-inline">|</span>

            <span class="top-item d-none d-md-inline">
              <i class="fa-solid fa-truck-fast me-1"></i>
              Freeship toàn quốc đơn từ 300K
            </span>
          </div>

          <!-- RIGHT: Admin + Profile -->
          <div class="top-right">

            <!-- Admin -->
            <a
              *ngIf="isAdmin$ | async"
              routerLink="/admin"
              class="admin-link d-none d-lg-flex"
            >
              <i class="fa-solid fa-gauge-high"></i>
              <span>Quản trị</span>
            </a>

            <!-- Chat hỗ trợ (Ẩn đối với Admin) -->
            <a
              *ngIf="!(isAdmin$ | async)"
              href="javascript:void(0)"
              (click)="onOpenChat()"
              class="admin-link d-flex align-items-center"
              title="Chat tư vấn với PetShop"
            >
              <i class="fa-solid fa-comments"></i>
              <span>Hỗ trợ</span>
              <span *ngIf="(unreadChatCount$ | async) as count" class="badge bg-danger rounded-pill ms-1" style="font-size: 10px;">
                {{ count > 99 ? '99+' : count }}
              </span>
            </a>

            <!-- Logged in -->
            <ng-container
              *ngIf="currentUser$ | async as user; else guestTpl"
            >
              <div class="user-dropdown">

                <button
                  type="button"
                  class="user-button"
                  (click)="toggleUserMenu($event)"
                >
                  <i class="fa-solid fa-circle-user"></i>

                  <span class="user-name">
                    {{ user.fullName || user.username }}
                  </span>

                  <i
                    class="fa-solid fa-chevron-down user-arrow"
                    [class.rotate]="isUserMenuOpen"
                  ></i>
                </button>

                <!-- Dropdown -->
                <div
                  class="user-menu"
                  [class.show]="isUserMenuOpen"
                >
                  <!-- User information -->
                  <div class="user-menu-header">
                    <div class="user-avatar">
                      <i class="fa-solid fa-user"></i>
                    </div>

                    <div class="user-info">
                      <strong>
                        {{ user.fullName || user.username }}
                      </strong>

                      <span>
                        <i class="fa-solid fa-shield-halved"></i>
                        {{ user.role }}
                      </span>
                    </div>
                  </div>

                  <div class="menu-divider"></div>

                  <!-- Orders -->
                  <a
                    class="user-menu-item"
                    routerLink="/orders/my-orders"
                    (click)="isUserMenuOpen = false"
                  >
                    <span class="menu-icon blue">
                      <i class="fa-solid fa-box"></i>
                    </span>

                    <span>Đơn hàng của tôi</span>

                    <i class="fa-solid fa-chevron-right menu-arrow"></i>
                  </a>

                  <!-- Chat với cửa hàng (Ẩn đối với Admin) -->
                  <a
                    *ngIf="user.role !== 'Admin'"
                    class="user-menu-item"
                    href="javascript:void(0)"
                    (click)="onOpenChat()"
                  >
                    <span class="menu-icon green">
                      <i class="fa-solid fa-comments"></i>
                    </span>

                    <span>Chat với cửa hàng</span>
                    <span *ngIf="(unreadChatCount$ | async) as count" class="badge bg-danger rounded-pill ms-auto me-2">
                      {{ count }}
                    </span>
                    <i *ngIf="!(unreadChatCount$ | async)" class="fa-solid fa-chevron-right menu-arrow"></i>
                  </a>


                  <!-- Admin -->
                  <a
                    *ngIf="user.role === 'Admin'"
                    class="user-menu-item"
                    routerLink="/admin"
                    (click)="isUserMenuOpen = false"
                  >
                    <span class="menu-icon orange">
                      <i class="fa-solid fa-gauge-high"></i>
                    </span>

                    <span>Trang quản trị</span>

                    <i class="fa-solid fa-chevron-right menu-arrow"></i>
                  </a>

                                    <!-- Cài đặt tài khoản -->
                  <a
                    class="user-menu-item"
                    routerLink="/profile/settings"
                    (click)="isUserMenuOpen = false"
                  >
                    <span class="menu-icon purple">
                      <i class="fa-solid fa-gear"></i>
                    </span>

                    <span>Cài đặt tài khoản</span>

                    <i class="fa-solid fa-chevron-right menu-arrow"></i>
                  </a>

                  <div class="menu-divider"></div>

                  <!-- Logout -->
                  <button
                    type="button"
                    class="user-menu-item logout-item"
                    (click)="onLogout()"
                  >
                    <span class="menu-icon red">
                      <i class="fa-solid fa-arrow-right-from-bracket"></i>
                    </span>

                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            </ng-container>

            <!-- Guest -->
            <ng-template #guestTpl>
              <div class="guest-actions">
                <a
                  routerLink="/auth/login"
                  class="guest-link"
                >
                  Đăng nhập
                </a>

                <span class="guest-divider">|</span>

                <a
                  routerLink="/auth/register"
                  class="guest-link"
                >
                  Đăng ký
                </a>
              </div>
            </ng-template>

          </div>
        </div>
      </div>
    </div>

    <!-- =========================
         MAIN HEADER
    ========================== -->
    <header class="main-header bg-white sticky-top shadow-sm">

      <div class="container main-header-container">

        <div class="main-header-content">

          <!-- LOGO -->
          <div class="logo-section">
            <a
              routerLink="/"
              class="logo-link"
            >
              <div class="logo-icon">
                <i class="fa-solid fa-paw"></i>
              </div>

              <div class="logo-text">
                <span class="brand-title">
                  PetShop<span class="text-brand">.vn</span>
                </span>

                <small>
                  Thiên đường cưng nựng
                </small>
              </div>
            </a>
          </div>

          <!-- SEARCH -->
          <div class="search-section">

            <form
              (ngSubmit)="onSearch()"
              class="search-form"
            >
              <div class="search-box">

                <input
                  type="text"
                  [(ngModel)]="searchKeyword"
                  name="keyword"
                  placeholder="Tìm giống chó, mèo, thức ăn, phụ kiện..."
                />

                <button
                  type="submit"
                  class="search-button"
                >
                  <i class="fa-solid fa-magnifying-glass"></i>

                  <span class="d-none d-sm-inline">
                    Tìm kiếm
                  </span>
                </button>

              </div>

              <!-- HOT KEYWORDS -->
              <div class="hot-keywords">

                <span class="suggest-label">
                  <i class="fa-solid fa-fire"></i>
                  Gợi ý:
                </span>

                <button
                  type="button"
                  class="keyword-chip"
                  (click)="quickSearch('Corgi')"
                >
                  Corgi
                </button>

                <button
                  type="button"
                  class="keyword-chip"
                  (click)="quickSearch('Poodle')"
                >
                  Poodle
                </button>

                <button
                  type="button"
                  class="keyword-chip"
                  (click)="quickSearch('Mèo ALN')"
                >
                  Mèo ALN
                </button>

                <button
                  type="button"
                  class="keyword-chip"
                  (click)="quickSearch('Royal Canin')"
                >
                  Royal Canin
                </button>

                <button
                  type="button"
                  class="keyword-chip"
                  (click)="quickSearch('Whiskas')"
                >
                  Whiskas
                </button>

              </div>
            </form>

          </div>

          <!-- CART -->
          <div class="cart-section">

            <a
              routerLink="/cart"
              class="cart-button"
            >
              <div class="cart-icon-wrapper">
                <i class="fa-solid fa-cart-shopping"></i>

                <span
                  *ngIf="cartCount$ | async as count"
                  class="cart-badge"
                >
                  {{ count }}
                </span>
              </div>

              <span class="cart-text">
                Giỏ hàng
              </span>
            </a>

          </div>

        </div>

      </div>

      <!-- NAVIGATION -->
      <app-navbar></app-navbar>

    </header>
  `,

  styles: [
    `
      /* =====================================================
         TOP BAR
      ===================================================== */

      .top-bar {
        background: linear-gradient(
          90deg,
          #ff5722 0%,
          #ff6f32 50%,
          #ff9800 100%
        );

        position: relative;
        z-index: 1040;
        min-height: 36px;
      }

      .top-bar-content {
        min-height: 36px;

        display: grid;
        grid-template-columns: 1fr auto 1fr;

        align-items: center;
        column-gap: 20px;
      }

      /* LEFT */

      .top-left {
        display: flex;
        align-items: center;
        gap: 12px;

        min-width: 0;
      }

      .top-item {
        white-space: nowrap;
        font-size: 12px;
      }

      .top-item i {
        font-size: 11px;
      }

      .top-time {
        opacity: 0.8;
      }

      .top-divider {
        opacity: 0.45;
        font-size: 12px;
      }

      /* RIGHT */

      .top-right {
        display: flex;
        justify-content: flex-end;
        align-items: center;

        gap: 16px;

        min-width: 0;
      }

      .admin-link {
        color: white;
        text-decoration: none;

        font-size: 12px;
        font-weight: 600;

        align-items: center;
        gap: 5px;

        transition: opacity 0.2s ease;
      }

      .admin-link:hover {
        color: white;
        opacity: 0.8;
      }

      /* USER */

      .user-dropdown {
        position: relative;
      }

      .user-button {
        display: flex;
        align-items: center;
        gap: 6px;

        border: none;
        outline: none;
        background: transparent;

        color: white;

        padding: 5px 0;

        cursor: pointer;

        font-size: 12px;
        font-weight: 600;
      }

      .user-button:hover {
        color: white;
        opacity: 0.9;
      }

      .user-button > i:first-child {
        font-size: 19px;
      }

      .user-name {
        max-width: 140px;

        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .user-arrow {
        font-size: 9px;

        transition: transform 0.2s ease;
      }

      .user-arrow.rotate {
        transform: rotate(180deg);
      }

      /* USER MENU */

      .user-menu {
        position: absolute;

        top: calc(100% + 8px);
        right: 0;

        width: 265px;

        background: white;

        border-radius: 12px;

        box-shadow:
          0 10px 30px rgba(0, 0, 0, 0.15),
          0 3px 10px rgba(0, 0, 0, 0.08);

        overflow: hidden;

        opacity: 0;
        visibility: hidden;

        transform: translateY(-5px);

        transition:
          opacity 0.2s ease,
          transform 0.2s ease,
          visibility 0.2s ease;

        z-index: 1050;
      }

      .user-menu.show {
        opacity: 1;
        visibility: visible;

        transform: translateY(0);
      }

      .user-menu-header {
        display: flex;
        align-items: center;

        gap: 12px;

        padding: 15px;
      }

      .user-avatar {
        width: 42px;
        height: 42px;

        flex-shrink: 0;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 50%;

        background: linear-gradient(
          135deg,
          #ff5722,
          #ff9800
        );

        color: white;

        font-size: 18px;
      }

      .user-info {
        min-width: 0;

        display: flex;
        flex-direction: column;

        gap: 4px;
      }

      .user-info strong {
        color: #333;

        font-size: 14px;

        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .user-info span {
        color: #999;

        font-size: 11px;
      }

      .user-info span i {
        color: #ff5722;
        margin-right: 3px;
      }

      .menu-divider {
        height: 1px;
        background: #f0f0f0;
      }

      .user-menu-item {
        width: 100%;

        display: flex;
        align-items: center;

        gap: 10px;

        padding: 10px 14px;

        border: none;
        background: white;

        color: #444;

        text-decoration: none;

        font-size: 13px;

        cursor: pointer;

        text-align: left;

        transition:
          background 0.2s ease,
          color 0.2s ease;
      }

      .user-menu-item:hover {
        background: #fff7f3;
        color: #ff5722;
      }

      .menu-icon {
        width: 30px;
        height: 30px;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 8px;

        font-size: 13px;
      }

      .menu-icon.blue {
        background: #edf4ff;
        color: #4285f4;
      }

      .menu-icon.cyan {
        background: #eafaff;
        color: #00a6c7;
      }

      .menu-icon.orange {
        background: #fff3e8;
        color: #ff9800;
      }

      .menu-icon.purple {
        background: #f3e8ff;
        color: #9333ea;
      }

      .menu-icon.red {
        background: #fff0f0;
        color: #dc3545;
      }

      .menu-arrow {
        margin-left: auto;

        font-size: 9px;
        color: #bbb;
      }

      .logout-item {
        color: #dc3545;
      }

      .logout-item:hover {
        color: #dc3545;
        background: #fff5f5;
      }

      /* GUEST */

      .guest-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .guest-link {
        color: white;

        text-decoration: none;

        font-size: 12px;
        font-weight: 600;

        transition: opacity 0.2s ease;
      }

      .guest-link:hover {
        color: white;
        opacity: 0.8;
      }

      .guest-divider {
        opacity: 0.5;
      }


      /* =====================================================
         MAIN HEADER
      ===================================================== */

      .main-header {
        z-index: 1030;
      }

      .main-header-container {
        padding-top: 12px;
        padding-bottom: 8px;
      }

      .main-header-content {
        display: grid;

        grid-template-columns: 250px minmax(350px, 1fr) 150px;

        align-items: center;

        column-gap: 35px;
      }

      /* LOGO */

      .logo-link {
        display: inline-flex;
        align-items: center;

        text-decoration: none;

        color: #222;
      }

      .logo-icon {
        width: 46px;
        height: 46px;

        flex-shrink: 0;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 50%;

        background: linear-gradient(
          135deg,
          #ff5722 0%,
          #ff9800 100%
        );

        color: white;

        font-size: 22px;

        box-shadow: 0 4px 10px rgba(255, 87, 34, 0.22);

        margin-right: 10px;
      }

      .logo-text {
        display: flex;
        flex-direction: column;
      }

      .brand-title {
        color: #222;

        font-family: Arial, sans-serif;

        font-size: 25px;
        font-weight: 800;

        line-height: 1;
      }

      .text-brand {
        color: #ff5722;
      }

      .logo-text small {
        margin-top: 5px;

        color: #888;

        font-size: 8px;
        font-weight: 700;

        letter-spacing: 1px;
        text-transform: uppercase;
      }


      /* =====================================================
         SEARCH
      ===================================================== */

      .search-section {
        width: 100%;
      }

      .search-form {
        width: 100%;
      }

      .search-box {
        display: flex;
        align-items: center;

        width: 100%;
        height: 43px;

        overflow: hidden;

        border: 2px solid #ffbba7;
        border-radius: 24px;

        background: white;

        box-shadow: 0 2px 8px rgba(255, 87, 34, 0.08);

        transition:
          border-color 0.2s ease,
          box-shadow 0.2s ease;
      }

      .search-box:focus-within {
        border-color: #ff5722;

        box-shadow:
          0 3px 12px rgba(255, 87, 34, 0.15);
      }

      .search-box input {
        flex: 1;

        min-width: 0;

        height: 100%;

        border: none;
        outline: none;

        padding: 0 16px;

        color: #333;

        font-size: 13px;
      }

      .search-box input::placeholder {
        color: #aaa;
      }

      .search-button {
        height: 35px;

        margin-right: 3px;

        padding: 0 18px;

        border: none;
        border-radius: 20px;

        background: #ff5722;

        color: white;

        font-size: 13px;
        font-weight: 600;

        cursor: pointer;

        display: flex;
        align-items: center;
        justify-content: center;

        gap: 6px;

        transition: background 0.2s ease;
      }

      .search-button:hover {
        background: #e64a19;
      }


      /* =====================================================
         HOT KEYWORDS
      ===================================================== */

      .hot-keywords {
        display: flex;
        align-items: center;
        flex-wrap: wrap;

        gap: 6px;

        margin-top: 7px;
        padding-left: 8px;
      }

      .suggest-label {
        display: flex;
        align-items: center;

        gap: 4px;

        margin-right: 2px;

        color: #777;

        font-size: 11px;
        font-weight: 600;
      }

      .suggest-label i {
        color: #ff5722;
        font-size: 10px;
      }

      .keyword-chip {
        border: 1px solid #f2d7cf;

        border-radius: 12px;

        background: #fff8f5;

        color: #777;

        padding: 2px 9px;

        font-size: 10px;

        cursor: pointer;

        transition:
          color 0.2s ease,
          background 0.2s ease,
          border-color 0.2s ease,
          transform 0.2s ease;
      }

      .keyword-chip:hover {
        border-color: #ffb39e;

        background: #fff0eb;

        color: #ff5722;

        transform: translateY(-1px);
      }


      /* =====================================================
         CART
      ===================================================== */

      .cart-section {
        display: flex;
        justify-content: flex-end;
      }

      .cart-button {
        display: inline-flex;
        align-items: center;

        gap: 9px;

        padding: 8px 13px;

        border: 1px solid #ffd8cc;
        border-radius: 22px;

        background: #fff7f4;

        color: #333;

        text-decoration: none;

        transition:
          background 0.2s ease,
          border-color 0.2s ease,
          transform 0.2s ease;
      }

      .cart-button:hover {
        border-color: #ffb39e;

        background: #fff0eb;

        transform: translateY(-1px);
      }

      .cart-icon-wrapper {
        position: relative;

        display: flex;
        align-items: center;
        justify-content: center;

        color: #ff5722;

        font-size: 20px;
      }

      .cart-badge {
        position: absolute;

        top: -9px;
        right: -10px;

        min-width: 17px;
        height: 17px;

        display: flex;
        align-items: center;
        justify-content: center;

        padding: 0 4px;

        border-radius: 10px;

        background: #dc3545;

        color: white;

        font-size: 9px;
        font-weight: 700;

        border: 2px solid white;
      }

      .cart-text {
        color: #333;

        font-size: 13px;
        font-weight: 600;
      }


      /* =====================================================
         RESPONSIVE
      ===================================================== */

      @media (max-width: 1199px) {

        .main-header-content {
          grid-template-columns: 210px minmax(300px, 1fr) 125px;

          column-gap: 20px;
        }

        .brand-title {
          font-size: 22px;
        }

        .logo-icon {
          width: 42px;
          height: 42px;

          font-size: 20px;
        }

        .user-name {
          max-width: 100px;
        }

      }


      @media (max-width: 991px) {

        .top-bar-content {
          grid-template-columns: 1fr auto;
        }

        .top-center {
          display: none !important;
        }

        .main-header-content {
          grid-template-columns: 200px 1fr 110px;

          column-gap: 15px;
        }

        .cart-text {
          display: none;
        }

        .cart-button {
          padding: 8px 12px;
        }

        .hot-keywords {
          display: none;
        }

      }


      @media (max-width: 767px) {

        .top-bar {
          min-height: 32px;
        }

        .top-bar-content {
          min-height: 32px;

          display: flex;
          justify-content: space-between;

          column-gap: 10px;
        }

        .top-left {
          flex: 1;
        }

        .top-item {
          font-size: 10px;
        }

        .top-time {
          display: none;
        }

        .top-right {
          gap: 8px;
        }

        .user-name {
          display: none;
        }

        .user-button > i:first-child {
          font-size: 18px;
        }

        .guest-link {
          font-size: 10px;
        }

        .main-header-container {
          padding-top: 10px;
          padding-bottom: 10px;
        }

        .main-header-content {
          display: grid;

          grid-template-columns: 1fr auto;

          grid-template-areas:
            "logo cart"
            "search search";

          row-gap: 12px;
        }

        .logo-section {
          grid-area: logo;
        }

        .cart-section {
          grid-area: cart;
        }

        .search-section {
          grid-area: search;
        }

        .brand-title {
          font-size: 21px;
        }

        .logo-icon {
          width: 40px;
          height: 40px;

          font-size: 18px;
        }

        .logo-text small {
          font-size: 7px;
        }

        .search-box {
          height: 42px;
        }

        .search-button {
          padding: 0 14px;
        }

      }


      @media (max-width: 400px) {

        .top-item {
          font-size: 9px;
        }

        .logo-icon {
          width: 36px;
          height: 36px;

          font-size: 16px;

          margin-right: 7px;
        }

        .brand-title {
          font-size: 18px;
        }

        .logo-text small {
          display: none;
        }

        .search-box input {
          padding: 0 12px;

          font-size: 12px;
        }

        .search-button {
          padding: 0 12px;
        }

      }
    `,
  ],
})
export class HeaderComponent implements OnInit {
  currentUser$: Observable<AuthResponse | null>;
  isAdmin$: Observable<boolean>;
  cartCount$: Observable<number>;
  unreadChatCount$: Observable<number>;

  searchKeyword: string = '';

  isUserMenuOpen: boolean = false;

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private chatService: ChatService,
    private router: Router,
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.isAdmin$ = this.authService.isAdmin$;
    this.cartCount$ = this.cartService.itemCount$;
    this.unreadChatCount$ = this.chatService.unreadCount$;
  }

  ngOnInit(): void {}

  onOpenChat(): void {
    this.isUserMenuOpen = false;
    this.chatService.requestOpenChat();
  }

  /**
   * Toggle user dropdown
   */
  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();

    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  /**
   * Close dropdown when clicking outside
   */
  @HostListener('document:click')
  onDocumentClick(): void {
    this.isUserMenuOpen = false;
  }


  /**
   * Search products
   */
  onSearch(): void {
    if (!this.searchKeyword.trim()) {
      return;
    }

    // Both listing pages support `q`. Keep the search in the current main tab
    // so a search from /pets does not make the /products navbar tab active.
    const currentPath = this.router.url.split('?')[0];
    const searchRoute = currentPath === '/pets' || currentPath.startsWith('/pets/')
      ? '/pets'
      : '/products';

    this.router.navigate([searchRoute], {
      queryParams: {
        q: this.searchKeyword.trim(),
      },
    });
  }

  /**
   * Quick search from suggestion
   */
  quickSearch(keyword: string): void {
    this.searchKeyword = keyword;

    this.onSearch();
  }

  /**
   * Logout
   */
  onLogout(): void {
    this.isUserMenuOpen = false;

    this.authService.logout();

    this.router.navigate(['/']);
  }
}
