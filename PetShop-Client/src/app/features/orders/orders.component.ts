import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { OrderList, OrderDetail } from '../../core/models/order.model';

@Component({
  selector: 'app-orders',
  template: `
    <div class="container my-4">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-3 small">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a routerLink="/" class="text-muted">Trang chủ</a></li>
          <li class="breadcrumb-item active fw-bold text-primary">📦 Đơn Hàng Của Tôi</li>
        </ol>
      </nav>

      <div class="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
        <h4 class="fw-bold brand-font mb-4 text-dark">
          <i class="fa-solid fa-box text-primary me-2"></i> Lịch Sử Đơn Hàng
        </h4>

        <!-- Status Filter Tabs (Shopee Style) -->
        <ul class="nav nav-pills status-nav-pills mb-4 gap-2 border-bottom pb-3">
          <li class="nav-item">
            <button class="nav-link rounded-pill" [class.active]="selectedStatus === 'All'" (click)="filterStatus('All')">
              Tất cả ({{ orders.length }})
            </button>
          </li>
          <li class="nav-item">
            <button class="nav-link rounded-pill" [class.active]="selectedStatus === 'Pending'" (click)="filterStatus('Pending')">
              Chờ xác nhận
            </button>
          </li>
          <li class="nav-item">
            <button class="nav-link rounded-pill" [class.active]="selectedStatus === 'Shipping'" (click)="filterStatus('Shipping')">
              Đang giao hàng
            </button>
          </li>
          <li class="nav-item">
            <button class="nav-link rounded-pill" [class.active]="selectedStatus === 'Completed'" (click)="filterStatus('Completed')">
              Đã giao
            </button>
          </li>
          <li class="nav-item">
            <button class="nav-link rounded-pill" [class.active]="selectedStatus === 'Cancelled'" (click)="filterStatus('Cancelled')">
              Đã hủy
            </button>
          </li>
        </ul>

        <!-- Loading -->
        <div *ngIf="isLoading" class="text-center py-5">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="text-muted small mt-2">Đang tải đơn hàng...</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading && filteredOrders.length === 0" class="text-center py-5">
          <i class="fa-solid fa-receipt fs-1 text-muted mb-3 d-block"></i>
          <h6 class="fw-bold text-dark">Chưa có đơn hàng nào trong mục này</h6>
          <p class="text-muted small mb-3">Bạn chưa có đơn hàng nào, hãy ghé thăm cửa hàng ngay nhé!</p>
          <a routerLink="/" class="btn btn-danger btn-sm rounded-pill px-4 fw-semibold">
            Mua sắm ngay
          </a>
        </div>

        <!-- Orders List -->
        <div *ngIf="!isLoading && filteredOrders.length > 0" class="d-flex flex-column gap-3">
          <div *ngFor="let order of filteredOrders; trackBy: trackById" class="order-item-card border rounded-4 p-3 hover-shadow">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 pb-2 border-bottom mb-3">
              <div>
                <span class="fw-bold text-dark me-2">Mã Đơn: {{ order.orderCode }}</span>
                <small class="text-muted">{{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</small>
              </div>
              <div>
                <span class="badge" [ngClass]="getStatusBadge(order.status)">
                  {{ getStatusText(order.status) }}
                </span>
                <span class="badge bg-light text-dark border ms-1">{{ order.paymentMethod }}</span>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <p class="mb-1 small"><strong>Người nhận:</strong> {{ order.customerName }} - {{ order.phoneNumber }}</p>
                <p class="mb-0 small text-muted"><strong>Số lượng món:</strong> {{ order.totalItems }} sản phẩm / thú cưng</p>
              </div>

              <div class="text-end">
                <span class="small text-muted d-block">Thành tiền:</span>
                <span class="fs-5 fw-bold text-danger">{{ order.totalAmount | number:'1.0-0' }} đ</span>
                <button (click)="viewOrderDetail(order.id)" class="btn btn-outline-primary btn-sm rounded-pill px-3 mt-2">
                  <i class="fa-solid fa-eye me-1"></i> Xem chi tiết
                </button>
              </div>
            </div>

            <!-- Expanded Order Detail -->
            <div *ngIf="activeDetailId === order.id && selectedOrderDetail" class="mt-3 pt-3 border-top bg-light rounded-3 p-3">
              <h6 class="fw-bold mb-3 small text-uppercase text-secondary">Danh sách sản phẩm trong đơn</h6>
              <div *ngFor="let item of selectedOrderDetail.items" class="d-flex align-items-center justify-content-between py-2 border-bottom border-white">
                <div class="d-flex align-items-center gap-3">
                  <img [src]="item.itemImageUrl" class="rounded border" style="width: 45px; height: 45px; object-fit: cover;">
                  <div>
                    <strong class="d-block small text-dark">{{ item.itemName }}</strong>
                    <small class="text-muted">{{ item.quantity }} x {{ item.unitPrice | number:'1.0-0' }}đ</small>
                  </div>
                </div>
                <strong class="text-danger small">{{ item.totalPrice | number:'1.0-0' }} đ</strong>
              </div>
              <div class="mt-2 small text-muted">
                <p class="mb-1"><strong>Địa chỉ nhận:</strong> {{ selectedOrderDetail.shippingAddress }}</p>
                <p class="mb-0" *ngIf="selectedOrderDetail.note"><strong>Ghi chú:</strong> {{ selectedOrderDetail.note }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .status-nav-pills .nav-link {
      color: #495057;
      background: #f8f9fa;
      font-size: 0.9rem;
      font-weight: 500;
      &.active {
        background-color: #0d6efd;
        color: #fff;
      }
    }
    .order-item-card {
      transition: box-shadow 0.2s ease;
      background: #fff;
    }
    .hover-shadow:hover {
      box-shadow: 0 4px 15px rgba(0,0,0,0.06);
    }
  `]
})
export class OrdersComponent implements OnInit {
  orders: OrderList[] = [];
  selectedStatus: string = 'All';
  isLoading = true;
  activeDetailId: number | null = null;
  selectedOrderDetail: OrderDetail | null = null;

  constructor(
    private orderService: OrderService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    if (this.authService.currentUserValue) {
      this.orderService.getMyOrders().subscribe({
        next: list => {
          this.orders = list;
          this.isLoading = false;
        },
        error: () => {
          this.fetchMockOrders();
        }
      });
    } else {
      this.fetchMockOrders();
    }
  }

  fetchMockOrders(): void {
    // Nếu chưa đăng nhập, gọi GetAllOrders hoặc hiển thị danh sách đơn gần đây
    this.orderService.getAllOrders(1, 10).subscribe({
      next: res => {
        this.orders = res.items;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  get filteredOrders(): OrderList[] {
    if (this.selectedStatus === 'All') {
      return this.orders;
    }
    return this.orders.filter(o => o.status.toLowerCase() === this.selectedStatus.toLowerCase());
  }

  filterStatus(status: string): void {
    this.selectedStatus = status;
  }

  viewOrderDetail(orderId: number): void {
    if (this.activeDetailId === orderId) {
      this.activeDetailId = null;
      this.selectedOrderDetail = null;
      return;
    }

    this.activeDetailId = orderId;
    this.orderService.getOrderById(orderId).subscribe(res => {
      this.selectedOrderDetail = res;
    });
  }

  getStatusBadge(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-success';
      case 'shipping': return 'bg-primary';
      case 'processing': return 'bg-info text-dark';
      case 'cancelled': return 'bg-danger';
      default: return 'bg-warning text-dark';
    }
  }

  getStatusText(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed': return 'Đã hoàn tất';
      case 'shipping': return 'Đang giao hàng';
      case 'processing': return 'Đang xử lý';
      case 'cancelled': return 'Đã hủy đơn';
      default: return 'Chờ xác nhận';
    }
  }

  trackById(index: number, order: OrderList): number {
    return order.id;
  }
}
