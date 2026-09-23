import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CategoryService } from '../../core/services/category.service';
import { CartService } from '../../core/services/cart.service';
import { Product, ProductFilter } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';
import { PagedResult } from '../../core/models/paged-result.model';

@Component({
  selector: 'app-products',
  template: `
    <div class="container my-4">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-3 small">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a routerLink="/" class="text-muted"><i class="fa-solid fa-house"></i> Trang chủ</a></li>
          <li class="breadcrumb-item active fw-bold text-primary" aria-current="page">🛒 Tab 2: Đồ Dùng & Phụ Kiện</li>
        </ol>
      </nav>

      <!-- Banner header -->
      <div class="product-header-banner rounded-4 p-4 text-white mb-4 shadow-sm d-flex justify-content-between align-items-center">
        <div>
          <span class="badge bg-danger text-white px-3 py-1 rounded-pill fw-bold mb-2">⚡ CHÍNH HÃNG 100%</span>
          <h2 class="fw-bold mb-1 brand-font">Thức Ăn, Đồ Chơi & Phụ Kiện Cho Boss</h2>
          <p class="small text-white-50 mb-0">Hơn 500+ sản phẩm dinh dưỡng, phụ kiện chất lượng cao từ các thương hiệu uy tín toàn cầu.</p>
        </div>
        <div class="d-none d-md-block text-end">
          <div class="display-6 fw-bold text-white">{{ totalCount }}</div>
          <small class="text-white-50 text-uppercase fw-semibold">Sản Phẩm Đang Bán</small>
        </div>
      </div>

      <div class="row g-4">
        <!-- Sidebar Filter (Shopee Style) -->
        <div class="col-12 col-lg-3">
          <div class="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h6 class="fw-bold mb-0 text-dark">
                <i class="fa-solid fa-filter text-primary me-2"></i> BỘ LỌC TÌM KIẾM
              </h6>
              <button (click)="resetFilters()" class="btn btn-link btn-sm text-muted p-0 text-decoration-none">
                Thiết lập lại
              </button>
            </div>

            <!-- Categories -->
            <div class="filter-group mb-3">
              <label class="fw-bold small mb-2 text-dark">Danh Mục Sản Phẩm</label>
              <div class="d-flex flex-column gap-1 small">
                <button (click)="setCategory(undefined)" 
                        [class.text-primary]="!filter.categoryId"
                        [class.fw-bold]="!filter.categoryId"
                        class="btn btn-sm text-start text-dark p-1 border-0">
                  <i class="fa-solid fa-angle-right me-1 text-muted"></i> Tất cả danh mục
                </button>
                <button *ngFor="let cat of supplyCategories; trackBy: trackById" 
                        (click)="setCategory(cat.id)"
                        [class.text-primary]="filter.categoryId === cat.id"
                        [class.fw-bold]="filter.categoryId === cat.id"
                        class="btn btn-sm text-start text-dark p-1 border-0">
                  <i class="fa-solid fa-angle-right me-1 text-muted"></i> {{ cat.name }}
                </button>
              </div>
            </div>

            <!-- Brand Filter -->
            <div class="filter-group mb-3">
              <label class="fw-bold small mb-2 text-dark">Thương Hiệu</label>
              <select [(ngModel)]="filter.brand" (change)="loadProducts()" class="form-select form-select-sm rounded-pill">
                <option value="">Tất cả thương hiệu</option>
                <option value="Royal Canin">Royal Canin</option>
                <option value="Whiskas">Whiskas</option>
                <option value="Orijen">Orijen</option>
                <option value="Me-O">Me-O</option>
                <option value="KONG">KONG</option>
                <option value="Furminator">Furminator</option>
                <option value="Cature">Cature</option>
                <option value="SOS">SOS</option>
              </select>
            </div>

            <!-- Price Range -->
            <div class="filter-group mb-3">
              <label class="fw-bold small mb-2 text-dark">Khoảng Giá (VNĐ)</label>
              <div class="d-flex flex-column gap-2 small">
                <button (click)="setPriceRange(undefined, 100000)" 
                        [class.active-filter]="filter.maxPrice === 100000"
                        class="btn btn-outline-secondary btn-sm text-start rounded-pill px-3">
                  Dưới 100.000đ
                </button>
                <button (click)="setPriceRange(100000, 300000)" 
                        [class.active-filter]="filter.minPrice === 100000 && filter.maxPrice === 300000"
                        class="btn btn-outline-secondary btn-sm text-start rounded-pill px-3">
                  100.000đ - 300.000đ
                </button>
                <button (click)="setPriceRange(300000, undefined)" 
                        [class.active-filter]="filter.minPrice === 300000 && !filter.maxPrice"
                        class="btn btn-outline-secondary btn-sm text-start rounded-pill px-3">
                  Trên 300.000đ
                </button>
              </div>
            </div>

            <!-- In stock only -->
            <div class="form-check form-switch mb-2">
              <input class="form-check-input" type="checkbox" id="stockSwitch" [(ngModel)]="filter.inStockOnly" (change)="loadProducts()">
              <label class="form-check-label small fw-semibold" for="stockSwitch">Chỉ hiện sản phẩm còn hàng</label>
            </div>
          </div>
        </div>

        <!-- Main Product List Content -->
        <div class="col-12 col-lg-9">
          <!-- Top Sort Bar (Shopee Style) -->
          <div class="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div class="d-flex align-items-center gap-2 small">
                <span class="text-muted fw-bold">Sắp xếp theo:</span>
                <button (click)="setSort('popular')" 
                        [class.btn-primary]="filter.sortBy === 'popular'"
                        [class.btn-outline-secondary]="filter.sortBy !== 'popular'"
                        class="btn btn-sm rounded-pill fw-semibold">
                  Bán Chạy Nhất
                </button>
                <button (click)="setSort('newest')" 
                        [class.btn-primary]="filter.sortBy === 'newest'"
                        [class.btn-outline-secondary]="filter.sortBy !== 'newest'"
                        class="btn btn-sm rounded-pill fw-semibold">
                  Mới Nhất
                </button>
                <button (click)="setSort('price_asc')" 
                        [class.btn-primary]="filter.sortBy === 'price_asc'"
                        [class.btn-outline-secondary]="filter.sortBy !== 'price_asc'"
                        class="btn btn-sm rounded-pill fw-semibold">
                  Giá: Thấp đến Cao
                </button>
                <button (click)="setSort('price_desc')" 
                        [class.btn-primary]="filter.sortBy === 'price_desc'"
                        [class.btn-outline-secondary]="filter.sortBy !== 'price_desc'"
                        class="btn btn-sm rounded-pill fw-semibold">
                  Giá: Cao đến Thấp
                </button>
              </div>
              <span class="small text-muted">Hiển thị <strong>{{ products.length }}</strong> / {{ totalCount }} sản phẩm</span>
            </div>
          </div>

          <!-- Loading Spinner -->
          <div *ngIf="isLoading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Đang tải...</span>
            </div>
            <p class="text-muted small mt-2">Đang tải sản phẩm...</p>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading && products.length === 0" class="text-center py-5 bg-white rounded-4 shadow-sm p-4">
            <i class="fa-solid fa-box-open fs-1 text-muted mb-3 d-block"></i>
            <h5 class="fw-bold text-dark">Không tìm thấy sản phẩm nào</h5>
            <p class="text-muted small mb-3">Vui lòng thử lại với từ khóa hoặc bộ lọc khác.</p>
            <button (click)="resetFilters()" class="btn btn-primary rounded-pill px-4 fw-bold">
              Xóa bộ lọc
            </button>
          </div>

          <!-- Product Grid -->
          <div *ngIf="!isLoading && products.length > 0" class="row g-3">
            <div *ngFor="let prod of products; trackBy: trackById" class="col-6 col-md-4">
              <app-product-card [product]="prod" (addToCart)="onAddToCart($event)"></app-product-card>
            </div>
          </div>

          <!-- Pagination -->
          <app-pagination [pageNumber]="filter.pageNumber" 
                          [totalPages]="totalPages" 
                          (pageChanged)="onPageChange($event)">
          </app-pagination>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .product-header-banner {
      background: linear-gradient(135deg, #0d6efd 0%, #0099ff 100%);
    }
    .active-filter {
      background-color: #0d6efd !important;
      border-color: #0d6efd !important;
      color: #fff !important;
    }
  `]
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  supplyCategories: Category[] = [];
  totalCount = 0;
  totalPages = 1;
  isLoading = true;

  filter: ProductFilter = {
    pageNumber: 1,
    pageSize: 12,
    sortBy: 'popular'
  };

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.categoryService.getCategories('Supply').subscribe(res => {
      this.supplyCategories = res;
    });

    this.route.queryParams.subscribe(params => {
      if (params['categoryId']) this.filter.categoryId = +params['categoryId'];
      if (params['brand']) this.filter.brand = params['brand'];
      if (params['q']) this.filter.searchTerm = params['q'];
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts(this.filter).subscribe({
      next: (res: PagedResult<Product>) => {
        this.products = res.items;
        this.totalCount = res.totalCount;
        this.totalPages = res.totalPages;
        this.isLoading = false;
      },
      error: err => {
        console.error('Error loading products:', err);
        this.isLoading = false;
      }
    });
  }

  setCategory(categoryId?: number): void {
    this.filter.categoryId = categoryId;
    this.filter.pageNumber = 1;
    this.loadProducts();
  }

  setPriceRange(min?: number, max?: number): void {
    this.filter.minPrice = min;
    this.filter.maxPrice = max;
    this.filter.pageNumber = 1;
    this.loadProducts();
  }

  setSort(sortBy: string): void {
    this.filter.sortBy = sortBy;
    this.filter.pageNumber = 1;
    this.loadProducts();
  }

  resetFilters(): void {
    this.filter = {
      pageNumber: 1,
      pageSize: 12,
      sortBy: 'popular'
    };
    this.loadProducts();
  }

  onPageChange(page: number): void {
    this.filter.pageNumber = page;
    this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onAddToCart(product: Product): void {
    this.cartService.addToCart({
      id: `product-${product.id}`,
      itemType: 'Product',
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      price: product.price,
      originalPrice: product.originalPrice,
      quantity: 1,
      stock: product.stock,
      brand: product.brand
    });
    alert(`Đã thêm "${product.name}" vào giỏ hàng!`);
  }

  trackById(index: number, item: any): any {
    return item.id;
  }
}
