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
      <div *ngIf="orderSuccess" class="card border-0 shadow-sm rounded-4 p-4 p-md-5 text-center bg-white my-4">
        <div class="success-icon bg-success-subtle text-success rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 80px; height: 80px;">
          <i class="fa-solid fa-circle-check fs-1"></i>
        </div>
        <h3 class="fw-bold text-dark mb-2">🎉 Đặt Hàng Thành Công!</h3>
        <p class="text-muted mb-4">Cảm ơn bạn đã tin tưởng PetShop. Đơn hàng của bạn đã được tiếp nhận và nhân viên sẽ xử lý ngay.</p>

        <!-- Simulated Notification Notice (Email & SMS Dispatch) -->
        <div class="alert alert-success border-success-subtle rounded-4 mx-auto text-start mb-4 p-3 p-md-4 shadow-sm" style="max-width: 600px;">
          <div class="d-flex align-items-start gap-3">
            <i class="fa-solid fa-envelope-circle-check text-success fs-3 mt-1"></i>
            <div>
              <strong class="d-block text-dark mb-1">Xác nhận đơn hàng đã được gửi:</strong>
              <div class="small text-muted mb-2">
                Thông tin đơn hàng cùng <strong>Mã Tra Cứu</strong> đã được gửi tự động đến Email: 
                <span class="badge bg-light text-primary border">{{ createdOrder?.email || formData.email }}</span> 
                và SĐT: <span class="badge bg-light text-dark border">{{ createdOrder?.phoneNumber }}</span> (hệ thống mô phỏng).
              </div>
              <div class="small bg-white p-2 rounded border text-muted">
                <i class="fa-solid fa-circle-info text-info me-1"></i> 
                Quý khách có thể sử dụng mã đơn hàng <strong>{{ createdOrder?.orderCode }}</strong> để tra cứu tiến độ vận chuyển bất kỳ lúc nào tại thanh tra cứu hoặc nút bên dưới.
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary Card -->
        <div class="bg-light p-4 rounded-4 mx-auto text-start mb-4 shadow-sm border" style="max-width: 600px;">
          <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
            <span class="text-muted">Mã Đơn Hàng:</span>
            <div class="d-flex align-items-center gap-2">
              <span class="fs-5 fw-bold text-danger">{{ createdOrder?.orderCode }}</span>
              <button (click)="copyOrderCode()" class="btn btn-outline-secondary btn-sm py-0 px-2 rounded" title="Sao chép mã đơn">
                <i class="fa-regular fa-copy"></i>
              </button>
            </div>
          </div>
          <div class="d-flex justify-content-between mb-2 small">
            <span class="text-muted">Người nhận:</span>
            <strong>{{ createdOrder?.customerName }} ({{ createdOrder?.phoneNumber }})</strong>
          </div>
          <div class="d-flex justify-content-between mb-2 small" *ngIf="createdOrder?.email || formData.email">
            <span class="text-muted">Email:</span>
            <span>{{ createdOrder?.email || formData.email }}</span>
          </div>
          <div class="d-flex justify-content-between mb-2 small">
            <span class="text-muted">Địa chỉ giao:</span>
            <span class="text-end" style="max-width: 320px;">{{ createdOrder?.shippingAddress }}</span>
          </div>
          <div class="d-flex justify-content-between mb-2 small">
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
        <div *ngIf="createdOrder?.paymentMethod === 'BankTransfer'" class="alert alert-info rounded-4 mx-auto text-start mb-4 p-4 shadow-sm" style="max-width: 600px;">
          <h6 class="fw-bold mb-2"><i class="fa-solid fa-qrcode me-2"></i> Hướng Dẫn Chuyển Khoản Ngân Hàng:</h6>
          <p class="small mb-1">Ngân hàng: <strong>MB BANK (Quân Đội)</strong></p>
          <p class="small mb-1">Số tài khoản: <strong>0988888888</strong></p>
          <p class="small mb-1">Chủ tài khoản: <strong>CONG TY CO PHAN PETSHOP VN</strong></p>
          <p class="small mb-0">Nội dung CK: <strong class="text-danger">{{ createdOrder?.orderCode }}</strong></p>
        </div>

        <!-- Action Buttons -->
        <div class="d-flex flex-wrap justify-content-center gap-3">
          <a [routerLink]="['/orders/tracking']" [queryParams]="{ code: createdOrder?.orderCode }" class="btn btn-warning rounded-pill px-4 fw-bold shadow-sm">
            <i class="fa-solid fa-magnifying-glass me-1"></i> Tra Cứu Tiến Độ Đơn Này
          </a>
          <a *ngIf="isLoggedIn" routerLink="/orders/my-orders" class="btn btn-outline-danger rounded-pill px-4 fw-bold">
            <i class="fa-solid fa-box me-1"></i> Xem Đơn Hàng Của Tôi
          </a>
          <a routerLink="/" class="btn btn-danger rounded-pill px-4 fw-bold">
            <i class="fa-solid fa-house me-1"></i> Tiếp Tục Mua Sắm
          </a>
        </div>
      </div>

      <!-- CHECKOUT FORM (when not yet ordered) -->
      <div *ngIf="!orderSuccess" class="row g-4">
        <!-- Form Details (Left) -->
        <div class="col-12 col-lg-7">
          <!-- GUEST CHOICES BANNER (If not logged in) -->
          <div *ngIf="!isLoggedIn" class="card border-primary border-opacity-25 bg-primary-subtle bg-opacity-10 rounded-4 p-3 p-md-4 mb-4 shadow-sm">
            <div class="row align-items-center g-3">
              <div class="col-12 col-md-7">
                <h6 class="fw-bold text-dark mb-1">
                  <i class="fa-solid fa-user-shield text-primary me-2"></i> Bạn chưa đăng nhập tài khoản?
                </h6>
                <p class="text-muted small mb-0">
                  Bạn có thể đăng nhập để lưu lịch sử đơn hàng, hoặc tiếp tục thanh toán nhanh với tư cách Khách vãng lai.
                </p>
              </div>
              <div class="col-12 col-md-5 d-flex flex-wrap gap-2 justify-content-md-end">
                <button type="button" (click)="goToLogin()" class="btn btn-outline-primary btn-sm rounded-pill px-3 fw-semibold shadow-sm">
                  <i class="fa-solid fa-arrow-right-to-bracket me-1"></i> Đăng nhập / Đăng ký
                </button>
                <button type="button" (click)="focusGuestForm()" class="btn btn-primary btn-sm rounded-pill px-3 fw-semibold shadow-sm">
                  <i class="fa-solid fa-bolt me-1"></i> Đặt hàng ngay (Guest)
                </button>
              </div>
            </div>
          </div>

          <div class="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
            <h5 class="fw-bold mb-3 pb-2 border-bottom text-dark">
              <i class="fa-solid fa-location-dot text-danger me-2"></i> 1. Thông Tin Nhận Hàng
            </h5>

            <form (ngSubmit)="submitOrder()">
              <div class="row g-3">
                <div class="col-12 col-sm-6">
                  <label class="form-label small fw-bold">Họ và tên người nhận <span class="text-danger">*</span></label>
                  <input type="text" id="customerNameInput" [(ngModel)]="formData.customerName" name="customerName" required
                         class="form-control rounded-3" placeholder="Ví dụ: Nguyễn Văn An">
                </div>
                <div class="col-12 col-sm-6">
                  <label class="form-label small fw-bold">Số điện thoại <span class="text-danger">*</span></label>
                  <input type="tel" [(ngModel)]="formData.phoneNumber" name="phoneNumber" required
                         class="form-control rounded-3" placeholder="Ví dụ: 0912345678">
                </div>
                <div class="col-12">
                  <label class="form-label small fw-bold">
                    Email nhận thông báo & Mã tra cứu đơn hàng <span class="text-danger">*</span>
                  </label>
                  <input type="email" [(ngModel)]="formData.email" name="email" required
                         class="form-control rounded-3" placeholder="Ví dụ: nguyenvanan@gmail.com">
                  <small class="text-muted d-block mt-1">
                    <i class="fa-solid fa-info-circle me-1"></i> Chúng tôi sẽ gửi xác nhận và mã tra cứu đơn hàng đến email này.
                  </small>
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
    email: string;
    shippingAddress: string;
    note: string;
    paymentMethod: 'COD' | 'BankTransfer';
  } = {
    customerName: '',
    phoneNumber: '',
    email: '',
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

  get isLoggedIn(): boolean {
    return this.authService.currentUserValue != null;
  }

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
      this.formData.email = currentUser.email || '';
    }
  }

  get subTotal(): number {
    return this.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  }

  get totalAmount(): number {
    return this.subTotal + this.shippingFee;
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/checkout' } });
  }

  focusGuestForm(): void {
    const el = document.getElementById('customerNameInput');
    if (el) {
      el.focus();
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  copyOrderCode(): void {
    if (this.createdOrder?.orderCode) {
      navigator.clipboard.writeText(this.createdOrder.orderCode);
      alert('Đã sao chép mã đơn hàng: ' + this.createdOrder.orderCode);
    }
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
    if (!this.formData.email.trim()) {
      this.errorMessage = 'Vui lòng nhập địa chỉ Email để nhận thông báo và mã tra cứu đơn hàng.';
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.formData.email.trim())) {
      this.errorMessage = 'Địa chỉ email không đúng định dạng.';
      return;
    }
    if (!this.formData.shippingAddress.trim()) {
      this.errorMessage = 'Vui lòng nhập địa chỉ nhận hàng chi tiết.';
      return;
    }

    const orderRequest: CreateOrderRequest = {
      customerName: this.formData.customerName.trim(),
      phoneNumber: this.formData.phoneNumber.trim(),
      email: this.formData.email.trim(),
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
