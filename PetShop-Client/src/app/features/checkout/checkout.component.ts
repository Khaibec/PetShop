import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { CartItem, CreateOrderRequest, OrderDetail } from '../../core/models/order.model';

@Component({
  selector: 'app-checkout',
  template: `
    <div class="container my-4">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-3 small">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a routerLink="/" class="text-muted">Trang chủ</a></li>
          <li class="breadcrumb-item"><a routerLink="/cart" class="text-muted">Giỏ hàng</a></li>
          <li class="breadcrumb-item active fw-bold text-danger">💳 Thanh Toán & Đặt Hàng</li>
        </ol>
      </nav>

      <!-- SUCCESS SCREEN -->
      <div *ngIf="orderSuccess" class="card border-0 shadow-sm rounded-4 p-5 text-center bg-white my-4">
        <div class="success-icon bg-success-subtle text-success rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 80px; height: 80px;">
          <i class="fa-solid fa-circle-check fs-1"></i>
        </div>
        <h3 class="fw-bold text-dark mb-2">Đặt Hàng Thành Công!</h3>
        <p class="text-muted mb-4">Cảm ơn bạn đã tin tưởng PetShop. Đơn hàng của bạn đã được tiếp nhận và nhân viên sẽ liên hệ xác nhận trong ít phút.</p>

        <!-- Order Summary Card -->
        <div class="bg-light p-4 rounded-4 mx-auto text-start mb-4 shadow-sm" style="max-width: 550px;">
          <div class="d-flex justify-content-between mb-2">
            <span class="text-muted">Mã Đơn Hàng:</span>
            <strong class="text-danger">{{ createdOrder?.orderCode }}</strong>
          </div>
          <div class="d-flex justify-content-between mb-2">
            <span class="text-muted">Người nhận:</span>
            <strong>{{ createdOrder?.customerName }} ({{ createdOrder?.phoneNumber }})</strong>
          </div>
          <div class="d-flex justify-content-between mb-2">
            <span class="text-muted">Địa chỉ giao:</span>
            <span>{{ createdOrder?.shippingAddress }}</span>
          </div>
          <div class="d-flex justify-content-between mb-2">
            <span class="text-muted">Hình thức thanh toán:</span>
            <span class="badge bg-primary">{{ createdOrder?.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng' }}</span>
          </div>
          <hr class="my-2">
          <div class="d-flex justify-content-between fs-5">
            <span class="fw-bold">Tổng thanh toán:</span>
            <strong class="text-danger">{{ createdOrder?.totalAmount | number:'1.0-0' }} đ</strong>
          </div>
        </div>

        <!-- Bank Transfer Instructions if BankTransfer -->
        <div *ngIf="createdOrder?.paymentMethod === 'BankTransfer'" class="alert alert-info rounded-4 mx-auto text-start mb-4 p-4" style="max-width: 550px;">
          <h6 class="fw-bold mb-2"><i class="fa-solid fa-qrcode me-2"></i> Hướng Dẫn Chuyển Khoản Ngân Hàng:</h6>
          <p class="small mb-1">Ngân hàng: <strong>MB BANK (Quân Đội)</strong></p>
          <p class="small mb-1">Số tài khoản: <strong>0988888888</strong></p>
          <p class="small mb-1">Chủ tài khoản: <strong>CONG TY CO PHAN PETSHOP VN</strong></p>
          <p class="small mb-0">Nội dung CK: <strong class="text-danger">{{ createdOrder?.orderCode }}</strong></p>
        </div>

        <div class="d-flex justify-content-center gap-3">
          <a routerLink="/orders/my-orders" class="btn btn-outline-danger rounded-pill px-4 fw-bold">
            <i class="fa-solid fa-box me-1"></i> Xem Đơn Hàng Của Tôi
          </a>
          <a routerLink="/" class="btn btn-danger rounded-pill px-4 fw-bold">
            <i class="fa-solid fa-house me-1"></i> Về Trang Chủ
          </a>
        </div>
      </div>

      <!-- CHECKOUT FORM (when not yet ordered) -->
      <div *ngIf="!orderSuccess" class="row g-4">
        <!-- Form Details (Left) -->
        <div class="col-12 col-lg-7">
          <div class="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
            <h5 class="fw-bold mb-3 pb-2 border-bottom text-dark">
              <i class="fa-solid fa-location-dot text-danger me-2"></i> 1. Thông Tin Nhận Hàng
            </h5>

            <form (ngSubmit)="submitOrder()">
              <div class="row g-3">
                <div class="col-12 col-sm-6">
                  <label class="form-label small fw-bold">Họ và tên người nhận <span class="text-danger">*</span></label>
                  <input type="text" [(ngModel)]="formData.customerName" name="customerName" required
                         class="form-control rounded-3" placeholder="Ví dụ: Nguyễn Văn An">
                </div>
                <div class="col-12 col-sm-6">
                  <label class="form-label small fw-bold">Số điện thoại <span class="text-danger">*</span></label>
                  <input type="tel" [(ngModel)]="formData.phoneNumber" name="phoneNumber" required
                         class="form-control rounded-3" placeholder="Ví dụ: 0912345678">
                </div>
                <div class="col-12">
                  <label class="form-label small fw-bold">Địa chỉ giao hàng chi tiết <span class="text-danger">*</span></label>
                  <input type="text" [(ngModel)]="formData.shippingAddress" name="shippingAddress" required
                         class="form-control rounded-3" placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố">
                </div>
                <div class="col-12">
                  <label class="form-label small fw-bold">Ghi chú giao hàng</label>
                  <textarea [(ngModel)]="formData.note" name="note" rows="2"
                            class="form-control rounded-3" placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..."></textarea>
                </div>
              </div>
            </form>
          </div>

          <!-- Payment Method Selection -->
          <div class="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 class="fw-bold mb-3 pb-2 border-bottom text-dark">
              <i class="fa-solid fa-credit-card text-primary me-2"></i> 2. Phương Thức Thanh Toán
            </h5>

            <div class="d-flex flex-column gap-3">
              <!-- COD Option -->
              <label class="d-flex align-items-center p-3 border rounded-3 cursor-pointer hover-bg-light"
                     [class.border-danger]="formData.paymentMethod === 'COD'"
                     [class.bg-danger-subtle]="formData.paymentMethod === 'COD'">
                <input type="radio" [(ngModel)]="formData.paymentMethod" value="COD" name="paymentMethod" class="form-check-input me-3 mt-0">
                <div class="d-flex align-items-center gap-3">
                  <i class="fa-solid fa-money-bill-wave fs-3 text-success"></i>
                  <div>
                    <strong class="d-block text-dark">Thanh toán khi nhận hàng (COD)</strong>
                    <small class="text-muted">Bạn chỉ thanh toán khi đã nhận hàng và kiểm tra hài lòng.</small>
                  </div>
                </div>
              </label>

              <!-- Bank Transfer Option -->
              <label class="d-flex align-items-center p-3 border rounded-3 cursor-pointer hover-bg-light"
                     [class.border-danger]="formData.paymentMethod === 'BankTransfer'"
                     [class.bg-danger-subtle]="formData.paymentMethod === 'BankTransfer'">
                <input type="radio" [(ngModel)]="formData.paymentMethod" value="BankTransfer" name="paymentMethod" class="form-check-input me-3 mt-0">
                <div class="d-flex align-items-center gap-3">
                  <i class="fa-solid fa-building-columns fs-3 text-primary"></i>
                  <div>
                    <strong class="d-block text-dark">Chuyển khoản ngân hàng (VietQR / Internet Banking)</strong>
                    <small class="text-muted">Quét mã QR chuyển khoản tức thì 24/7 từ mọi ứng dụng ngân hàng.</small>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Order Summary (Right) -->
        <div class="col-12 col-lg-5">
          <div class="card border-0 shadow-sm rounded-4 p-4 bg-white sticky-top" style="top: 100px;">
            <h5 class="fw-bold mb-3 pb-2 border-bottom text-dark">
              Đơn Hàng Của Bạn ({{ items.length }} món)
            </h5>

            <div class="cart-items-preview mb-3 overflow-auto" style="max-height: 250px;">
              <div *ngFor="let item of items; trackBy: trackById" class="d-flex align-items-center gap-3 mb-3">
                <div class="ratio ratio-1x1 rounded-3 overflow-hidden border bg-light" style="width: 50px;">
                  <img [src]="item.imageUrl" [alt]="item.name" class="w-100 h-100 object-fit-cover">
                </div>
                <div class="flex-grow-1">
                  <h6 class="mb-0 small fw-bold text-dark text-truncate" style="max-width: 200px;">{{ item.name }}</h6>
                  <small class="text-muted">{{ item.quantity }} x {{ item.price | number:'1.0-0' }}đ</small>
                </div>
                <span class="fw-bold small text-danger">{{ (item.price * item.quantity) | number:'1.0-0' }} đ</span>
              </div>
            </div>

            <hr class="my-3">

            <div class="d-flex justify-content-between mb-2 small text-muted">
              <span>Tạm tính:</span>
              <span class="text-dark fw-semibold">{{ subTotal | number:'1.0-0' }} đ</span>
            </div>

            <div class="d-flex justify-content-between mb-2 small text-muted">
              <span>Phí vận chuyển:</span>
              <span class="text-dark fw-semibold">{{ shippingFee | number:'1.0-0' }} đ</span>
            </div>

            <hr class="my-3">

            <div class="d-flex justify-content-between align-items-baseline mb-4">
              <span class="fw-bold fs-6 text-dark">Tổng thanh toán:</span>
              <span class="fs-4 fw-bold text-danger">{{ totalAmount | number:'1.0-0' }} đ</span>
            </div>

            <div *ngIf="errorMessage" class="alert alert-danger py-2 small mb-3">
              {{ errorMessage }}
            </div>

            <button (click)="submitOrder()" [disabled]="isSubmitting" class="btn btn-danger btn-lg w-100 rounded-pill fw-bold shadow">
              <span *ngIf="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
              Xác Nhận Đặt Hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cursor-pointer {
      cursor: pointer;
    }
    .hover-bg-light:hover {
      background-color: #f8f9fa;
    }
  `]
})
export class CheckoutComponent implements OnInit {
  items: CartItem[] = [];
  shippingFee = 30000;
  isSubmitting = false;
  orderSuccess = false;
  createdOrder: OrderDetail | null = null;
  errorMessage = '';

  formData: {
    customerName: string;
    phoneNumber: string;
    shippingAddress: string;
    note: string;
    paymentMethod: 'COD' | 'BankTransfer';
  } = {
    customerName: '',
    phoneNumber: '',
    shippingAddress: '',
    note: '',
    paymentMethod: 'COD'
  };

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cartService.items$.subscribe(items => {
      this.items = items;
      if (items.length === 0 && !this.orderSuccess) {
        this.router.navigate(['/cart']);
      }
    });

    // Auto-fill if user logged in
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.formData.customerName = currentUser.fullName || currentUser.username;
    }
  }

  get subTotal(): number {
    return this.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  }

  get totalAmount(): number {
    return this.subTotal + this.shippingFee;
  }

  submitOrder(): void {
    this.errorMessage = '';

    if (!this.formData.customerName.trim()) {
      this.errorMessage = 'Vui lòng nhập họ và tên người nhận hàng.';
      return;
    }
    if (!this.formData.phoneNumber.trim()) {
      this.errorMessage = 'Vui lòng nhập số điện thoại liên hệ.';
      return;
    }
    if (!this.formData.shippingAddress.trim()) {
      this.errorMessage = 'Vui lòng nhập địa chỉ nhận hàng chi tiết.';
      return;
    }

    const orderRequest: CreateOrderRequest = {
      customerName: this.formData.customerName.trim(),
      phoneNumber: this.formData.phoneNumber.trim(),
      shippingAddress: this.formData.shippingAddress.trim(),
      note: this.formData.note.trim(),
      paymentMethod: this.formData.paymentMethod,
      items: this.items.map(item => ({
        itemType: item.itemType,
        productId: item.productId,
        petId: item.petId,
        quantity: item.quantity
      }))
    };

    this.isSubmitting = true;
    this.orderService.createOrder(orderRequest).subscribe({
      next: (order: OrderDetail) => {
        this.isSubmitting = false;
        this.createdOrder = order;
        this.orderSuccess = true;
        this.cartService.clearCart();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: err => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại!';
      }
    });
  }

  trackById(index: number, item: CartItem): string {
    return item.id;
  }
}
