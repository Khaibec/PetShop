import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CartService } from '../../core/services/cart.service';
import { CartItem } from '../../core/models/order.model';

@Component({
  selector: 'app-cart',
  template: `
    <div class="container my-4">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-3 small">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a routerLink="/" class="text-muted">Trang chủ</a></li>
          <li class="breadcrumb-item active fw-bold text-danger">🛒 Giỏ Hàng</li>
        </ol>
      </nav>

      <div class="d-flex align-items-center justify-content-between mb-4">
        <h3 class="fw-bold brand-font mb-0 text-dark">
          <i class="fa-solid fa-cart-shopping text-danger me-2"></i> Giỏ Hàng Của Bạn
        </h3>
        <button *ngIf="items.length > 0" (click)="clearCart()" class="btn btn-outline-danger btn-sm rounded-pill">
          <i class="fa-regular fa-trash-can me-1"></i> Xóa tất cả
        </button>
      </div>

      <!-- Empty Cart State -->
      <div *ngIf="items.length === 0" class="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
        <div class="empty-icon bg-light rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 90px; height: 90px;">
          <i class="fa-solid fa-cart-shopping fs-1 text-muted"></i>
        </div>
        <h5 class="fw-bold text-dark">Giỏ hàng của bạn đang trống</h5>
        <p class="text-muted small mb-4">Hãy chọn cho boss những món đồ chơi, thức ăn hoặc đón một bé thú cưng về nhà nhé!</p>
        <div class="d-flex justify-content-center gap-3">
          <a routerLink="/pets" class="btn btn-warning rounded-pill px-4 fw-bold text-dark">
            <i class="fa-solid fa-paw me-1"></i> Khám phá Thú Cưng
          </a>
          <a routerLink="/products" class="btn btn-primary rounded-pill px-4 fw-bold">
            <i class="fa-solid fa-bone me-1"></i> Mua Phụ Kiện
          </a>
        </div>
      </div>

      <!-- Cart Items & Summary -->
      <div *ngIf="items.length > 0" class="row g-4">
        <!-- Items List -->
        <div class="col-12 col-lg-8">
          <div class="card border-0 shadow-sm rounded-4 p-3 bg-white mb-3">
            <div class="table-responsive">
              <table class="table align-middle mb-0">
                <thead class="text-muted small text-uppercase bg-light">
                  <tr>
                    <th scope="col" style="min-width: 250px;">Sản Phẩm / Thú Cưng</th>
                    <th scope="col" class="text-center" style="min-width: 120px;">Đơn Giá</th>
                    <th scope="col" class="text-center" style="min-width: 130px;">Số Lượng</th>
                    <th scope="col" class="text-end" style="min-width: 120px;">Thành Tiền</th>
                    <th scope="col" class="text-center" style="width: 50px;"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of items; trackBy: trackById">
                    <td>
                      <div class="d-flex align-items-center gap-3">
                        <div class="ratio ratio-1x1 rounded-3 overflow-hidden border bg-light" style="width: 65px;">
                          <img [src]="item.imageUrl" [alt]="item.name" class="w-100 h-100 object-fit-cover">
                        </div>
                        <div>
                          <span *ngIf="item.itemType === 'Pet'" class="badge bg-warning text-dark small mb-1">
                            <i class="fa-solid fa-paw me-1"></i> Bé Thú Cưng
                          </span>
                          <span *ngIf="item.itemType === 'Product'" class="badge bg-primary small mb-1">
                            <i class="fa-solid fa-box me-1"></i> Đồ Dùng
                          </span>
                          <h6 class="mb-0 fw-bold fs-6 text-dark text-truncate" style="max-width: 260px;" [title]="item.name">
                            {{ item.name }}
                          </h6>
                          <small class="text-muted" *ngIf="item.breed">Giống: {{ item.breed }}</small>
                          <small class="text-muted" *ngIf="item.brand">Hãng: {{ item.brand }}</small>
                        </div>
                      </div>
                    </td>
                    <td class="text-center">
                      <span class="fw-semibold text-dark">{{ item.price | number:'1.0-0' }} đ</span>
                    </td>
                    <td class="text-center">
                      <!-- Product: Quantity selector -->
                      <div *ngIf="item.itemType === 'Product'" class="input-group input-group-sm mx-auto" style="width: 105px;">
                        <button class="btn btn-outline-secondary" (click)="decreaseQty(item)">-</button>
                        <input type="text" class="form-control text-center bg-white" readonly [value]="item.quantity">
                        <button class="btn btn-outline-secondary" (click)="increaseQty(item)">+</button>
                      </div>
                      <!-- Pet: Fixed 1 -->
                      <span *ngIf="item.itemType === 'Pet'" class="badge bg-light text-dark border px-2 py-1">
                        1 bé (Độc nhất)
                      </span>
                    </td>
                    <td class="text-end fw-bold text-danger">
                      {{ (item.price * item.quantity) | number:'1.0-0' }} đ
                    </td>
                    <td class="text-center">
                      <button (click)="removeItem(item.id)" class="btn btn-link text-muted p-0 hover-danger" title="Xóa món này">
                        <i class="fa-regular fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Shopee Voucher Code Input -->
          <div class="card border-0 shadow-sm rounded-4 p-3 bg-white d-flex flex-row align-items-center justify-content-between flex-wrap gap-2">
            <div class="d-flex align-items-center gap-2">
              <i class="fa-solid fa-ticket text-danger fs-4"></i>
              <div>
                <strong class="d-block small">Mã Giảm Giá PetShop</strong>
                <small class="text-muted">Nhập <strong>PETSHOP50K</strong> (giảm 50k) hoặc <strong>FREESHIP</strong></small>
              </div>
            </div>
            <div class="d-flex gap-2">
              <input type="text" [(ngModel)]="voucherInput" placeholder="Nhập mã voucher" class="form-control form-control-sm rounded-pill" style="max-width: 150px;">
              <button (click)="applyVoucher()" class="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold">
                Áp Dụng
              </button>
            </div>
          </div>
          <div *ngIf="voucherApplied" class="alert alert-success mt-2 py-2 small d-flex align-items-center justify-content-between rounded-pill">
            <span><i class="fa-solid fa-circle-check me-1"></i> Đã áp dụng mã: <strong>{{ voucherCode }}</strong> (-{{ discountAmount | number:'1.0-0' }}đ)</span>
            <button (click)="removeVoucher()" class="btn btn-link btn-sm text-danger p-0 text-decoration-none">Hủy mã</button>
          </div>
        </div>

        <!-- Order Summary (Right Column) -->
        <div class="col-12 col-lg-4">
          <div class="card border-0 shadow-sm rounded-4 p-4 bg-white sticky-top" style="top: 100px;">
            <h5 class="fw-bold mb-3 pb-2 border-bottom text-dark">Tóm Tắt Đơn Hàng</h5>

            <div class="d-flex justify-content-between mb-2 small text-muted">
              <span>Tạm tính ({{ totalItems }} món):</span>
              <span class="text-dark fw-semibold">{{ subTotal | number:'1.0-0' }} đ</span>
            </div>

            <div class="d-flex justify-content-between mb-2 small text-muted">
              <span>Phí vận chuyển:</span>
              <span class="text-dark fw-semibold">{{ shippingFee | number:'1.0-0' }} đ</span>
            </div>

            <div *ngIf="discountAmount > 0" class="d-flex justify-content-between mb-2 small text-success">
              <span>Giảm giá voucher:</span>
              <span class="fw-bold">-{{ discountAmount | number:'1.0-0' }} đ</span>
            </div>

            <hr class="my-3">

            <div class="d-flex justify-content-between align-items-baseline mb-4">
              <span class="fw-bold text-dark">Tổng cộng:</span>
              <div class="text-end">
                <span class="fs-4 fw-bold text-danger">{{ finalTotal | number:'1.0-0' }} <span class="fs-6 text-decoration-underline">đ</span></span>
                <small class="d-block text-muted" style="font-size: 0.75rem;">(Đã bao gồm VAT nếu có)</small>
              </div>
            </div>

            <!-- Checkout Button -->
            <button (click)="proceedToCheckout()" class="btn btn-danger btn-lg w-100 rounded-pill fw-bold shadow">
              <i class="fa-solid fa-shield-check me-2"></i> Tiến Hành Đặt Hàng
            </button>

            <!-- Guarantees -->
            <div class="mt-4 pt-3 border-top small text-muted">
              <div class="d-flex align-items-center gap-2 mb-2">
                <i class="fa-solid fa-check text-success"></i>
                <span>Thanh toán an toàn, bảo mật 100%</span>
              </div>
              <div class="d-flex align-items-center gap-2 mb-2">
                <i class="fa-solid fa-box text-primary"></i>
                <span>Đóng gói cẩn thận, bảo quản nhiệt độ cho bé</span>
              </div>
              <div class="d-flex align-items-center gap-2">
                <i class="fa-solid fa-rotate-left text-warning"></i>
                <span>Đổi trả miễn phí 7 ngày cho phụ kiện</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hover-danger:hover {
      color: #dc3545 !important;
    }
  `]
})
export class CartComponent implements OnInit {
  items: CartItem[] = [];
  voucherInput: string = '';
  voucherApplied: boolean = false;
  voucherCode: string = '';
  discountAmount: number = 0;
  shippingFee: number = 30000;

  constructor(
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cartService.items$.subscribe(items => {
      this.items = items;
      if (items.length === 0) {
        this.removeVoucher();
      }
    });
  }

  get totalItems(): number {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  get subTotal(): number {
    return this.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  }

  get finalTotal(): number {
    return Math.max(0, this.subTotal + this.shippingFee - this.discountAmount);
  }

  increaseQty(item: CartItem): void {
    this.cartService.updateQuantity(item.id, item.quantity + 1);
  }

  decreaseQty(item: CartItem): void {
    this.cartService.updateQuantity(item.id, item.quantity - 1);
  }

  removeItem(id: string): void {
    this.cartService.removeFromCart(id);
  }

  clearCart(): void {
    if (confirm('Bạn có chắc muốn xóa tất cả sản phẩm khỏi giỏ hàng?')) {
      this.cartService.clearCart();
    }
  }

  applyVoucher(): void {
    const code = this.voucherInput.trim().toUpperCase();
    if (code === 'PETSHOP50K') {
      this.discountAmount = 50000;
      this.voucherApplied = true;
      this.voucherCode = code;
    } else if (code === 'FREESHIP') {
      this.discountAmount = this.shippingFee;
      this.voucherApplied = true;
      this.voucherCode = code;
    } else {
      alert('Mã giảm giá không hợp lệ hoặc đã hết lượt dùng!');
    }
  }

  removeVoucher(): void {
    this.voucherApplied = false;
    this.voucherCode = '';
    this.discountAmount = 0;
  }

  proceedToCheckout(): void {
    if (this.items.length === 0) return;
    this.router.navigate(['/checkout']);
  }

  trackById(index: number, item: CartItem): string {
    return item.id;
  }
}
