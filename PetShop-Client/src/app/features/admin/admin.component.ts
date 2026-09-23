import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../core/services/order.service';
import { PetService } from '../../core/services/pet.service';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { OrderList } from '../../core/models/order.model';
import { Pet } from '../../core/models/pet.model';
import { Product } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';

@Component({
  selector: 'app-admin',
  template: `
    <div class="container-fluid my-4 px-lg-5">
      <!-- Admin Header -->
      <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
        <div>
          <span class="badge bg-danger px-3 py-1 rounded-pill small fw-bold mb-1">
            <i class="fa-solid fa-crown me-1"></i> ADMIN MANAGEMENT SYSTEM
          </span>
          <h3 class="fw-bold brand-font mb-0 text-dark">Bảng Điều Khiển Quản Trị PetShop</h3>
        </div>
        <a routerLink="/" class="btn btn-outline-secondary btn-sm rounded-pill px-3">
          <i class="fa-solid fa-arrow-left me-1"></i> Về cửa hàng
        </a>
      </div>

      <div class="row g-4">
        <!-- Sidebar Navigation -->
        <div class="col-12 col-lg-2">
          <div class="list-group shadow-sm rounded-4 border-0 overflow-hidden">
            <button class="list-group-item list-group-item-action py-3 fw-semibold border-0 d-flex align-items-center gap-2"
                    [class.active]="activeTab === 'dashboard'" (click)="activeTab = 'dashboard'">
              <i class="fa-solid fa-chart-line fs-5"></i> Dashboard
            </button>
            <button class="list-group-item list-group-item-action py-3 fw-semibold border-0 d-flex align-items-center gap-2"
                    [class.active]="activeTab === 'orders'" (click)="activeTab = 'orders'; loadOrders()">
              <i class="fa-solid fa-box-open fs-5"></i> Đơn Hàng
            </button>
            <button class="list-group-item list-group-item-action py-3 fw-semibold border-0 d-flex align-items-center gap-2"
                    [class.active]="activeTab === 'pets'" (click)="activeTab = 'pets'; loadPets()">
              <i class="fa-solid fa-dog fs-5"></i> Thú Cưng
            </button>
            <button class="list-group-item list-group-item-action py-3 fw-semibold border-0 d-flex align-items-center gap-2"
                    [class.active]="activeTab === 'products'" (click)="activeTab = 'products'; loadProducts()">
              <i class="fa-solid fa-bone fs-5"></i> Sản Phẩm
            </button>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="col-12 col-lg-10">

          <!-- 1. DASHBOARD TAB -->
          <div *ngIf="activeTab === 'dashboard'">
            <!-- Metric Cards -->
            <div class="row g-3 mb-4">
              <div class="col-6 col-md-3">
                <div class="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-primary">
                  <span class="text-muted small fw-semibold">Tổng Doanh Thu</span>
                  <h4 class="fw-bold text-primary mb-0 mt-1">{{ stats?.totalRevenue | number:'1.0-0' }} đ</h4>
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-warning">
                  <span class="text-muted small fw-semibold">Tổng Số Đơn Hàng</span>
                  <h4 class="fw-bold text-dark mb-0 mt-1">{{ stats?.totalOrders || 0 }} đơn</h4>
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-danger">
                  <span class="text-muted small fw-semibold">Đơn Chờ Xác Nhận</span>
                  <h4 class="fw-bold text-danger mb-0 mt-1">{{ stats?.pendingOrders || 0 }} đơn</h4>
                </div>
              </div>
              <div class="col-6 col-md-3">
                <div class="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-success">
                  <span class="text-muted small fw-semibold">Bé Thú Cưng Sẵn Sàng</span>
                  <h4 class="fw-bold text-success mb-0 mt-1">{{ stats?.availablePets || 0 }} / {{ stats?.totalPets || 0 }}</h4>
                </div>
              </div>
            </div>

            <!-- Recent Orders in Dashboard -->
            <div class="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <h5 class="fw-bold mb-3 text-dark">Đơn Hàng Mới Nhất</h5>
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0 small">
                  <thead class="bg-light text-muted">
                    <tr>
                      <th>Mã Đơn</th>
                      <th>Khách Hàng</th>
                      <th>SĐT</th>
                      <th>Tổng Tiền</th>
                      <th>Thanh Toán</th>
                      <th>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let order of stats?.recentOrders">
                      <td><strong>{{ order.orderCode }}</strong></td>
                      <td>{{ order.customerName }}</td>
                      <td>{{ order.phoneNumber }}</td>
                      <td class="fw-bold text-danger">{{ order.totalAmount | number:'1.0-0' }} đ</td>
                      <td><span class="badge bg-light text-dark border">{{ order.paymentMethod }}</span></td>
                      <td><span class="badge" [ngClass]="getStatusBadge(order.status)">{{ getStatusText(order.status) }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- 2. ORDERS MANAGEMENT TAB -->
          <div *ngIf="activeTab === 'orders'" class="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-bold mb-0 text-dark">Quản Lý Đơn Hàng Khách Đặt</h5>
              <button (click)="loadOrders()" class="btn btn-outline-secondary btn-sm rounded-pill">
                <i class="fa-solid fa-arrows-rotate me-1"></i> Làm mới
              </button>
            </div>

            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0 small">
                <thead class="bg-light text-muted">
                  <tr>
                    <th>Mã Đơn</th>
                    <th>Ngày Tạo</th>
                    <th>Khách Hàng</th>
                    <th>Số ĐT</th>
                    <th>Tổng Tiền</th>
                    <th>Trạng Thái</th>
                    <th class="text-end">Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let order of allOrders">
                    <td><strong>{{ order.orderCode }}</strong></td>
                    <td>{{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td>{{ order.customerName }}</td>
                    <td>{{ order.phoneNumber }}</td>
                    <td class="fw-bold text-danger">{{ order.totalAmount | number:'1.0-0' }} đ</td>
                    <td><span class="badge" [ngClass]="getStatusBadge(order.status)">{{ getStatusText(order.status) }}</span></td>
                    <td class="text-end">
                      <div class="btn-group btn-group-sm">
                        <button *ngIf="order.status === 'Pending'" (click)="updateOrderStatus(order.id, 'Shipping')" class="btn btn-outline-primary" title="Xác nhận & Giao hàng">
                          <i class="fa-solid fa-truck"></i> Giao hàng
                        </button>
                        <button *ngIf="order.status === 'Shipping'" (click)="updateOrderStatus(order.id, 'Completed')" class="btn btn-outline-success" title="Hoàn tất đơn">
                          <i class="fa-solid fa-check"></i> Hoàn tất
                        </button>
                        <button *ngIf="order.status !== 'Completed' && order.status !== 'Cancelled'" (click)="updateOrderStatus(order.id, 'Cancelled')" class="btn btn-outline-danger" title="Hủy đơn">
                          <i class="fa-solid fa-xmark"></i> Hủy
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 3. PETS MANAGEMENT TAB -->
          <div *ngIf="activeTab === 'pets'" class="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-bold mb-0 text-dark">Quản Lý Danh Sách Thú Cưng</h5>
              <button (click)="openPetModal()" class="btn btn-warning btn-sm rounded-pill fw-bold text-dark">
                <i class="fa-solid fa-plus me-1"></i> Thêm Thú Cưng Mới
              </button>
            </div>

            <!-- Pet Form Modal / Inline Box -->
            <div *ngIf="showPetForm" class="bg-light p-3 rounded-4 mb-4 border">
              <h6 class="fw-bold text-dark mb-3">{{ editingPetId ? 'Chỉnh Sửa Thú Cưng' : 'Thêm Bé Thú Cưng Mới' }}</h6>
              <div class="row g-2 small">
                <div class="col-md-4">
                  <label class="form-label fw-bold">Tên Bé</label>
                  <input type="text" [(ngModel)]="petForm.name" class="form-control form-control-sm" placeholder="VD: Corgi Mông To">
                </div>
                <div class="col-md-3">
                  <label class="form-label fw-bold">Loài</label>
                  <select [(ngModel)]="petForm.species" class="form-select form-select-sm">
                    <option value="Chó">Chó</option>
                    <option value="Mèo">Mèo</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label fw-bold">Giống</label>
                  <input type="text" [(ngModel)]="petForm.breed" class="form-control form-control-sm" placeholder="VD: Corgi Pembroke">
                </div>
                <div class="col-md-2">
                  <label class="form-label fw-bold">Giới Tính</label>
                  <select [(ngModel)]="petForm.gender" class="form-select form-select-sm">
                    <option value="Đực">Đực</option>
                    <option value="Cái">Cái</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label fw-bold">Giá Bán (VNĐ)</label>
                  <input type="number" [(ngModel)]="petForm.price" class="form-control form-control-sm">
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-bold">Link Ảnh (URL)</label>
                  <input type="text" [(ngModel)]="petForm.imageUrl" class="form-control form-control-sm" placeholder="https://images.unsplash.com/...">
                </div>
                <div class="col-md-3 d-flex align-items-end gap-2">
                  <button (click)="savePet()" class="btn btn-primary btn-sm flex-grow-1">Lưu</button>
                  <button (click)="showPetForm = false" class="btn btn-secondary btn-sm">Hủy</button>
                </div>
              </div>
            </div>

            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0 small">
                <thead class="bg-light text-muted">
                  <tr>
                    <th>Bé Thú Cưng</th>
                    <th>Loài / Giống</th>
                    <th>Giới Tính</th>
                    <th>Giá Bán</th>
                    <th>Tình Trạng</th>
                    <th class="text-end">Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let pet of allPets">
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <img [src]="pet.imageUrl" class="rounded border" style="width: 45px; height: 45px; object-fit: cover;">
                        <strong>{{ pet.name }}</strong>
                      </div>
                    </td>
                    <td>{{ pet.species }} - {{ pet.breed }}</td>
                    <td>{{ pet.gender }}</td>
                    <td class="fw-bold text-danger">{{ pet.price | number:'1.0-0' }} đ</td>
                    <td>
                      <select [ngModel]="pet.status" (ngModelChange)="changePetStatus(pet.id, $event)" class="form-select form-select-sm" style="width: 140px;">
                        <option value="Available">Available (Có sẵn)</option>
                        <option value="Reserved">Reserved (Đã cọc)</option>
                        <option value="Sold">Sold (Đã bán)</option>
                      </select>
                    </td>
                    <td class="text-end">
                      <button (click)="deletePet(pet.id)" class="btn btn-outline-danger btn-sm rounded-circle" title="Xóa">
                        <i class="fa-regular fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 4. PRODUCTS MANAGEMENT TAB -->
          <div *ngIf="activeTab === 'products'" class="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-bold mb-0 text-dark">Quản Lý Danh Sách Đồ Dùng & Phụ Kiện</h5>
              <button (click)="openProductModal()" class="btn btn-primary btn-sm rounded-pill fw-bold">
                <i class="fa-solid fa-plus me-1"></i> Thêm Sản Phẩm Mới
              </button>
            </div>

            <!-- Product Form Modal / Inline Box -->
            <div *ngIf="showProductForm" class="bg-light p-3 rounded-4 mb-4 border">
              <h6 class="fw-bold text-dark mb-3">Thêm Sản Phẩm Mới</h6>
              <div class="row g-2 small">
                <div class="col-md-4">
                  <label class="form-label fw-bold">Tên Sản Phẩm</label>
                  <input type="text" [(ngModel)]="prodForm.name" class="form-control form-control-sm" placeholder="VD: Hạt Royal Canin Puppy">
                </div>
                <div class="col-md-3">
                  <label class="form-label fw-bold">Thương Hiệu</label>
                  <input type="text" [(ngModel)]="prodForm.brand" class="form-control form-control-sm" placeholder="VD: Royal Canin">
                </div>
                <div class="col-md-3">
                  <label class="form-label fw-bold">Giá Bán (VNĐ)</label>
                  <input type="number" [(ngModel)]="prodForm.price" class="form-control form-control-sm">
                </div>
                <div class="col-md-2">
                  <label class="form-label fw-bold">Kho Tồn</label>
                  <input type="number" [(ngModel)]="prodForm.stock" class="form-control form-control-sm">
                </div>
                <div class="col-md-8">
                  <label class="form-label fw-bold">Link Ảnh (URL)</label>
                  <input type="text" [(ngModel)]="prodForm.imageUrl" class="form-control form-control-sm" placeholder="https://images.unsplash.com/...">
                </div>
                <div class="col-md-4 d-flex align-items-end gap-2">
                  <button (click)="saveProduct()" class="btn btn-primary btn-sm flex-grow-1">Lưu</button>
                  <button (click)="showProductForm = false" class="btn btn-secondary btn-sm">Hủy</button>
                </div>
              </div>
            </div>

            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0 small">
                <thead class="bg-light text-muted">
                  <tr>
                    <th>Sản Phẩm</th>
                    <th>Thương Hiệu</th>
                    <th>Giá Bán</th>
                    <th>Kho Tồn</th>
                    <th>Đã Bán</th>
                    <th class="text-end">Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let p of allProducts">
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <img [src]="p.imageUrl" class="rounded border" style="width: 45px; height: 45px; object-fit: cover;">
                        <strong class="text-truncate" style="max-width: 250px;">{{ p.name }}</strong>
                      </div>
                    </td>
                    <td>{{ p.brand }}</td>
                    <td class="fw-bold text-danger">{{ p.price | number:'1.0-0' }} đ</td>
                    <td>
                      <span class="badge" [ngClass]="p.stock > 10 ? 'bg-success' : 'bg-danger'">{{ p.stock }} món</span>
                    </td>
                    <td>{{ p.soldQuantity }}</td>
                    <td class="text-end">
                      <button (click)="deleteProduct(p.id)" class="btn btn-outline-danger btn-sm rounded-circle" title="Xóa">
                        <i class="fa-regular fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .list-group-item.active {
      background-color: #ff5722;
      border-color: #ff5722;
      color: #fff;
    }
  `]
})
export class AdminComponent implements OnInit {
  activeTab: 'dashboard' | 'orders' | 'pets' | 'products' = 'dashboard';
  stats: any = null;
  allOrders: OrderList[] = [];
  allPets: Pet[] = [];
  allProducts: Product[] = [];

  showPetForm = false;
  editingPetId: number | null = null;
  petForm: any = {
    name: '',
    species: 'Chó',
    breed: '',
    gender: 'Đực',
    price: 5000000,
    imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
    description: 'Bé khỏe mạnh, ăn uống tốt.'
  };

  showProductForm = false;
  prodForm: any = {
    name: '',
    brand: 'Chính hãng',
    categoryId: 3,
    price: 150000,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=800&q=80',
    description: 'Sản phẩm chất lượng cao cho thú cưng.'
  };

  constructor(
    private orderService: OrderService,
    private petService: PetService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.orderService.getDashboardStats().subscribe(res => {
      this.stats = res;
    });
  }

  loadOrders(): void {
    this.orderService.getAllOrders(1, 50).subscribe(res => {
      this.allOrders = res.items;
    });
  }

  loadPets(): void {
    this.petService.getPets({ pageNumber: 1, pageSize: 50 }).subscribe(res => {
      this.allPets = res.items;
    });
  }

  loadProducts(): void {
    this.productService.getProducts({ pageNumber: 1, pageSize: 50 }).subscribe(res => {
      this.allProducts = res.items;
    });
  }

  updateOrderStatus(orderId: number, status: string): void {
    this.orderService.updateOrderStatus(orderId, status).subscribe(() => {
      this.loadOrders();
      this.loadStats();
    });
  }

  changePetStatus(petId: number, status: string): void {
    this.petService.updateStatus(petId, status).subscribe(() => {
      this.loadPets();
      this.loadStats();
    });
  }

  openPetModal(): void {
    this.showPetForm = true;
    this.editingPetId = null;
  }

  savePet(): void {
    if (!this.petForm.name || !this.petForm.breed) {
      alert('Vui lòng điền tên và giống thú cưng.');
      return;
    }

    this.petService.createPet(this.petForm).subscribe(() => {
      this.showPetForm = false;
      this.loadPets();
      this.loadStats();
      alert('Đã thêm thú cưng thành công!');
    });
  }

  deletePet(id: number): void {
    if (confirm('Bạn có chắc muốn xóa thú cưng này?')) {
      this.petService.deletePet(id).subscribe(() => {
        this.loadPets();
        this.loadStats();
      });
    }
  }

  openProductModal(): void {
    this.showProductForm = true;
  }

  saveProduct(): void {
    if (!this.prodForm.name) {
      alert('Vui lòng điền tên sản phẩm.');
      return;
    }

    this.productService.createProduct(this.prodForm).subscribe(() => {
      this.showProductForm = false;
      this.loadProducts();
      this.loadStats();
      alert('Đã thêm sản phẩm thành công!');
    });
  }

  deleteProduct(id: number): void {
    if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      this.productService.deleteProduct(id).subscribe(() => {
        this.loadProducts();
        this.loadStats();
      });
    }
  }

  getStatusBadge(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-success';
      case 'shipping': return 'bg-primary';
      case 'cancelled': return 'bg-danger';
      default: return 'bg-warning text-dark';
    }
  }

  getStatusText(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed': return 'Đã hoàn tất';
      case 'shipping': return 'Đang giao hàng';
      case 'cancelled': return 'Đã hủy';
      default: return 'Chờ xác nhận';
    }
  }
}
