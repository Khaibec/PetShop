import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { OrderDetail } from '../../core/models/order.model';

@Component({
  selector: 'app-order-tracking',
  template: `
    <div class="container my-4">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-3 small">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a routerLink="/" class="text-muted">Trang chủ</a></li>
          <li class="breadcrumb-item"><a routerLink="/orders/my-orders" class="text-muted">Đơn hàng</a></li>
          <li class="breadcrumb-item active fw-bold text-primary">🔍 Tra Cứu Đơn Hàng</li>
        </ol>
      </nav>

      <!-- Search Box Card -->
      <div class="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white mb-4 text-center">
        <div class="search-header mx-auto mb-3" style="max-width: 600px;">
          <div class="tracking-icon bg-warning-subtle text-warning rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 65px; height: 65px;">
            <i class="fa-solid fa-truck-fast fs-2"></i>
          </div>
          <h4 class="fw-bold brand-font text-dark mb-2">Tra Cứu Tiến Độ Đơn Hàng</h4>
          <p class="text-muted small">
            Nhập mã đơn hàng đã được cấp khi đặt hàng (ví dụ: <code>ORD-20260923-A1B2C3</code>) để theo dõi trạng thái vận chuyển và thông tin thanh toán.
          </p>
        </div>

        <div class="search-form mx-auto" style="max-width: 550px;">
          <form (ngSubmit)="onSearch()" class="d-flex gap-2">
            <div class="input-group">
              <span class="input-group-text bg-light border-end-0"><i class="fa-solid fa-receipt text-muted"></i></span>
              <input type="text" 
                     [(ngModel)]="searchCode" 
                     name="searchCode" 
                     required
                     class="form-control form-control-lg border-start-0 fs-6 shadow-none" 
                     placeholder="Nhập mã đơn hàng (ví dụ: ORD-...)">
            </div>
            <button type="submit" [disabled]="isLoading" class="btn btn-primary px-4 fw-bold rounded-3 shadow-sm d-flex align-items-center gap-2">
              <span *ngIf="isLoading" class="spinner-border spinner-border-sm"></span>
              <i *ngIf="!isLoading" class="fa-solid fa-magnifying-glass"></i>
              <span>Tra cứu</span>
            </button>
          </form>
        </div>
      </div>

      <!-- Loading Indicator -->
      <div *ngIf="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="text-muted small mt-2">Đang tìm kiếm thông tin đơn hàng...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="errorMessage && !isLoading" class="card border-danger-subtle bg-danger-subtle bg-opacity-25 rounded-4 p-4 mb-4 text-center">
        <i class="fa-solid fa-triangle-exclamation text-danger fs-2 mb-2"></i>
        <h6 class="fw-bold text-danger mb-1">Không tìm thấy thông tin</h6>
        <p class="text-muted small mb-0">{{ errorMessage }}</p>
      </div>

      <!-- ORDER DETAILS VIEW -->
      <div *ngIf="order && !isLoading" class="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4 animate-fade-in">
        <!-- Order Header -->
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 pb-3 mb-4 border-bottom">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <h5 class="fw-bold mb-0 text-dark">Đơn Hàng: <span class="text-danger">{{ order.orderCode }}</span></h5>
              <button (click)="copyCode()" class="btn btn-outline-secondary btn-sm py-0 px-2 rounded" title="Sao chép mã đơn">
                <i class="fa-regular fa-copy"></i>
              </button>
            </div>
            <small class="text-muted">
              <i class="fa-regular fa-calendar me-1"></i> Ngày đặt: {{ order.createdAt | date:'HH:mm - dd/MM/yyyy' }}
            </small>
          </div>

          <div class="d-flex align-items-center gap-2">
            <span class="badge py-2 px-3 fs-6 rounded-pill" [ngClass]="getStatusBadgeClass(order.status)">
              <i class="fa-solid me-1" [ngClass]="getStatusIconClass(order.status)"></i>
              {{ getStatusLabel(order.status) }}
            </span>
          </div>
        </div>

        <!-- Order Timeline (Progress Bar) -->
        <div class="order-timeline-wrapper mb-5 px-md-4">
          <div class="d-flex justify-content-between position-relative timeline-track">
            <!-- Step 1: Pending -->
            <div class="timeline-step text-center position-relative" [class.completed]="isStepCompleted(1)" [class.active]="isStepActive(1)">
              <div class="step-circle mx-auto mb-2 d-flex align-items-center justify-content-center">
                <i class="fa-solid fa-file-invoice"></i>
              </div>
              <span class="d-block small fw-bold step-title">Chờ Xác Nhận</span>
            </div>

            <!-- Step 2: Processing -->
            <div class="timeline-step text-center position-relative" [class.completed]="isStepCompleted(2)" [class.active]="isStepActive(2)">
              <div class="step-circle mx-auto mb-2 d-flex align-items-center justify-content-center">
                <i class="fa-solid fa-boxes-packing"></i>
              </div>
              <span class="d-block small fw-bold step-title">Đang Xử Lý</span>
            </div>

            <!-- Step 3: Shipping -->
            <div class="timeline-step text-center position-relative" [class.completed]="isStepCompleted(3)" [class.active]="isStepActive(3)">
              <div class="step-circle mx-auto mb-2 d-flex align-items-center justify-content-center">
                <i class="fa-solid fa-truck-fast"></i>
              </div>
              <span class="d-block small fw-bold step-title">Đang Giao Hàng</span>
            </div>

            <!-- Step 4: Completed -->
            <div class="timeline-step text-center position-relative" [class.completed]="isStepCompleted(4)" [class.active]="isStepActive(4)">
              <div class="step-circle mx-auto mb-2 d-flex align-items-center justify-content-center">
                <i class="fa-solid fa-circle-check"></i>
              </div>
              <span class="d-block small fw-bold step-title">Giao Thành Công</span>
            </div>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="row g-4 mb-4">
          <!-- Customer & Shipping -->
          <div class="col-12 col-md-6">
            <div class="p-3 bg-light rounded-4 h-100 border">
              <h6 class="fw-bold text-dark mb-3">
                <i class="fa-solid fa-location-dot text-danger me-2"></i> Thông Tin Nhận Hàng
              </h6>
              <div class="small mb-2">
                <span class="text-muted">Người nhận:</span> <strong>{{ order.customerName }}</strong>
              </div>
              <div class="small mb-2">
                <span class="text-muted">Số điện thoại:</span> <strong>{{ order.phoneNumber }}</strong>
              </div>
              <div class="small mb-2" *ngIf="order.email">
                <span class="text-muted">Email thông báo:</span> <strong>{{ order.email }}</strong>
              </div>
              <div class="small mb-2">
                <span class="text-muted">Địa chỉ nhận hàng:</span> <span>{{ order.shippingAddress }}</span>
              </div>
              <div class="small" *ngIf="order.note">
                <span class="text-muted">Ghi chú:</span> <em class="text-dark">{{ order.note }}</em>
              </div>
            </div>
          </div>

          <!-- Payment Info -->
          <div class="col-12 col-md-6">
            <div class="p-3 bg-light rounded-4 h-100 border">
              <h6 class="fw-bold text-dark mb-3">
                <i class="fa-solid fa-credit-card text-primary me-2"></i> Thông Tin Thanh Toán
              </h6>
              <div class="small mb-2">
                <span class="text-muted">Phương thức:</span> 
                <strong class="ms-1">{{ order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng' }}</strong>
              </div>
              <div class="small mb-2">
                <span class="text-muted">Trạng thái thanh toán:</span>
                <span class="badge ms-1" [ngClass]="order.paymentStatus === 'Paid' ? 'bg-success' : 'bg-warning text-dark'">
                  {{ order.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán' }}
                </span>
              </div>
              <div class="small mb-2" *ngIf="order.trackingCode">
                <span class="text-muted">Mã vận đơn bưu tá:</span> 
                <strong class="text-primary ms-1">{{ order.trackingCode }}</strong>
              </div>
              <div class="small text-success mt-3 p-2 bg-white rounded border">
                <i class="fa-solid fa-shield-halved me-1"></i> Đơn hàng được đảm bảo kiểm tra khi nhận hàng.
              </div>
            </div>
          </div>
        </div>

        <!-- Ordered Items -->
        <h6 class="fw-bold text-dark mb-3">
          <i class="fa-solid fa-bag-shopping text-warning me-2"></i> Danh Sách Sản Phẩm / Thú Cưng ({{ order.items.length }} món)
        </h6>
        <div class="table-responsive mb-4">
          <table class="table align-middle">
            <thead class="table-light small">
              <tr>
                <th>Sản phẩm / Thú cưng</th>
                <th class="text-center">Đơn giá</th>
                <th class="text-center">Số lượng</th>
                <th class="text-end">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of order.items">
                <td>
                  <div class="d-flex align-items-center gap-3">
                    <img [src]="item.itemImageUrl" [alt]="item.itemName" class="rounded-3 border object-fit-cover" style="width: 55px; height: 55px;">
                    <div>
                      <h6 class="mb-0 fw-bold small text-dark">{{ item.itemName }}</h6>
                      <span class="badge bg-light text-muted border small mt-1">
                        {{ item.itemType === 'Pet' ? 'Thú cưng độc nhất' : 'Sản phẩm phụ kiện' }}
                      </span>
                    </div>
                  </div>
                </td>
                <td class="text-center small">{{ item.unitPrice | number:'1.0-0' }} đ</td>
                <td class="text-center small">x {{ item.quantity }}</td>
                <td class="text-end fw-bold text-danger">{{ item.totalPrice | number:'1.0-0' }} đ</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Financial Summary -->
        <div class="row justify-content-end">
          <div class="col-12 col-md-5">
            <div class="bg-light p-3 rounded-4 border">
              <div class="d-flex justify-content-between mb-2 small text-muted">
                <span>Tạm tính:</span>
                <span class="text-dark fw-semibold">{{ order.subTotal | number:'1.0-0' }} đ</span>
              </div>
              <div class="d-flex justify-content-between mb-2 small text-muted">
                <span>Phí vận chuyển:</span>
                <span class="text-dark fw-semibold">{{ order.shippingFee | number:'1.0-0' }} đ</span>
              </div>
              <div class="d-flex justify-content-between mb-2 small text-muted" *ngIf="order.discountAmount > 0">
                <span>Giảm giá:</span>
                <span class="text-success">-{{ order.discountAmount | number:'1.0-0' }} đ</span>
              </div>
              <hr class="my-2">
              <div class="d-flex justify-content-between fs-5">
                <span class="fw-bold text-dark">Tổng thanh toán:</span>
                <strong class="text-danger">{{ order.totalAmount | number:'1.0-0' }} đ</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .timeline-track::before {
      content: '';
      position: absolute;
      top: 20px;
      left: 10%;
      right: 10%;
      height: 4px;
      background-color: #e9ecef;
      z-index: 1;
    }
    .timeline-step {
      z-index: 2;
      flex: 1;
    }
    .step-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background-color: #fff;
      border: 3px solid #dee2e6;
      color: #adb5bd;
      font-size: 1.1rem;
      transition: all 0.3s ease;
    }
    .timeline-step.completed .step-circle {
      background-color: #10b981;
      border-color: #10b981;
      color: #fff;
    }
    .timeline-step.active .step-circle {
      background-color: #ff5722;
      border-color: #ff5722;
      color: #fff;
      box-shadow: 0 0 0 5px rgba(255, 87, 34, 0.2);
    }
    .timeline-step.completed .step-title {
      color: #10b981;
    }
    .timeline-step.active .step-title {
      color: #ff5722;
    }
    .animate-fade-in {
      animation: fadeIn 0.4s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class OrderTrackingComponent implements OnInit {
  searchCode: string = '';
  order: OrderDetail | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      if (code) {
        this.searchCode = code.trim();
        this.loadOrder(this.searchCode);
      }
    });
  }

  onSearch(): void {
    if (!this.searchCode.trim()) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { code: this.searchCode.trim() },
      queryParamsHandling: 'merge'
    });
  }

  loadOrder(code: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.order = null;

    this.orderService.trackOrder(code).subscribe({
      next: data => {
        this.isLoading = false;
        this.order = data;
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || `Không tìm thấy đơn hàng với mã '${code}'. Quý khách vui lòng kiểm tra lại mã chính xác trong email hoặc tin nhắn SMS.`;
      }
    });
  }

  copyCode(): void {
    if (this.order?.orderCode) {
      navigator.clipboard.writeText(this.order.orderCode);
      alert('Đã sao chép mã đơn hàng: ' + this.order.orderCode);
    }
  }

  isStepCompleted(step: number): boolean {
    if (!this.order) return false;
    const currentStep = this.getOrderStepNumber(this.order.status);
    return currentStep > step;
  }

  isStepActive(step: number): boolean {
    if (!this.order) return false;
    const currentStep = this.getOrderStepNumber(this.order.status);
    return currentStep === step;
  }

  getOrderStepNumber(status: string): number {
    switch (status?.toLowerCase()) {
      case 'pending': return 1;
      case 'confirmed':
      case 'processing': return 2;
      case 'shipping': return 3;
      case 'completed': return 4;
      default: return 1;
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'processing': return 'Đang xử lý';
      case 'shipping': return 'Đang giao hàng';
      case 'completed': return 'Giao thành công';
      case 'cancelled': return 'Đã hủy đơn';
      default: return status;
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-warning text-dark';
      case 'confirmed':
      case 'processing': return 'bg-info text-white';
      case 'shipping': return 'bg-primary text-white';
      case 'completed': return 'bg-success text-white';
      case 'cancelled': return 'bg-danger text-white';
      default: return 'bg-secondary text-white';
    }
  }

  getStatusIconClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'pending': return 'fa-clock';
      case 'confirmed':
      case 'processing': return 'fa-gear';
      case 'shipping': return 'fa-truck-fast';
      case 'completed': return 'fa-check';
      case 'cancelled': return 'fa-xmark';
      default: return 'fa-info-circle';
    }
  }
}
