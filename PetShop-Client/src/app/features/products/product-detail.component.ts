import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { ProductDetail } from '../../core/models/product.model';

@Component({
  selector: 'app-product-detail',
  template: `
    <div class="container my-4" *ngIf="product">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-3 small">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a routerLink="/" class="text-muted">Trang chủ</a></li>
          <li class="breadcrumb-item"><a routerLink="/products" class="text-muted">Đồ Dùng & Phụ Kiện</a></li>
          <li class="breadcrumb-item active text-truncate" style="max-width: 250px;">{{ product.name }}</li>
        </ol>
      </nav>

      <div class="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div class="row g-4 g-lg-5">
          <!-- Left: Image Gallery -->
          <div class="col-12 col-md-5">
            <div class="main-image-box rounded-4 overflow-hidden border ratio ratio-1x1 mb-3 bg-light">
              <img [src]="selectedImage || product.imageUrl" [alt]="product.name" class="w-100 h-100 object-fit-cover">
            </div>

            <!-- Thumbnails -->
            <div class="d-flex gap-2" *ngIf="product.additionalImages && product.additionalImages.length > 0">
              <div class="thumb-box rounded-3 overflow-hidden border ratio ratio-1x1 cursor-pointer"
                   [class.active-thumb]="selectedImage === product.imageUrl"
                   (click)="selectedImage = product.imageUrl" style="width: 70px;">
                <img [src]="product.imageUrl" class="w-100 h-100 object-fit-cover">
              </div>
              <div *ngFor="let img of product.additionalImages" 
                   class="thumb-box rounded-3 overflow-hidden border ratio ratio-1x1 cursor-pointer"
                   [class.active-thumb]="selectedImage === img"
                   (click)="selectedImage = img" style="width: 70px;">
                <img [src]="img" class="w-100 h-100 object-fit-cover">
              </div>
            </div>
          </div>

          <!-- Right: Details & Buying Options -->
          <div class="col-12 col-md-7 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex align-items-center gap-2 mb-2">
                <span class="badge bg-danger">Chính Hãng</span>
                <span class="badge bg-light text-dark border">Thương hiệu: {{ product.brand }}</span>
                <span class="badge bg-light text-muted border">Danh mục: {{ product.categoryName }}</span>
              </div>

              <h2 class="fw-bold mb-2 fs-4 text-dark">{{ product.name }}</h2>

              <!-- Rating & Sold (Shopee Style) -->
              <div class="d-flex align-items-center gap-3 small mb-3 pb-3 border-bottom">
                <div class="d-flex align-items-center gap-1 text-warning">
                  <span class="fw-bold text-decoration-underline text-dark">{{ product.rating | number:'1.1-1' }}</span>
                  <app-rating-stars [rating]="product.rating"></app-rating-stars>
                </div>
                <span class="text-muted">|</span>
                <span class="text-dark"><strong>{{ product.reviewCount }}</strong> Đánh giá</span>
                <span class="text-muted">|</span>
                <span class="text-dark"><strong>{{ product.soldQuantity }}</strong> Đã bán</span>
              </div>

              <!-- Price Box -->
              <div class="bg-light p-3 rounded-4 mb-4 d-flex align-items-baseline gap-3">
                <span class="fs-2 fw-bold text-danger">
                  {{ product.price | number:'1.0-0' }} <span class="fs-5 text-decoration-underline">đ</span>
                </span>
                <span *ngIf="product.originalPrice && product.originalPrice > product.price" class="text-muted text-decoration-line-through fs-5">
                  {{ product.originalPrice | number:'1.0-0' }} đ
                </span>
                <span class="badge bg-danger rounded-pill ms-auto" *ngIf="discountPercent > 0">
                  -{{ discountPercent }}%
                </span>
              </div>

              <!-- Shipping & Guarantee Info -->
              <div class="mb-4 small">
                <div class="d-flex gap-3 mb-2">
                  <span class="text-muted" style="width: 100px;">Vận chuyển:</span>
                  <div>
                    <span class="badge badge-freeship me-1"><i class="fa-solid fa-truck-fast"></i> Miễn phí vận chuyển</span>
                    <span class="text-secondary">cho đơn hàng từ 300.000đ</span>
                  </div>
                </div>
                <div class="d-flex gap-3 mb-2">
                  <span class="text-muted" style="width: 100px;">Bảo hành:</span>
                  <span class="text-secondary">Đổi mới trong 7 ngày nếu lỗi từ nhà sản xuất</span>
                </div>
                <div class="d-flex gap-3">
                  <span class="text-muted" style="width: 100px;">Tồn kho:</span>
                  <span class="fw-semibold text-success">{{ product.stock }} sản phẩm có sẵn</span>
                </div>
              </div>

              <!-- Quantity Selector -->
              <div class="d-flex align-items-center gap-3 mb-4">
                <span class="text-muted small" style="width: 100px;">Số lượng:</span>
                <div class="input-group input-group-sm" style="width: 130px;">
                  <button class="btn btn-outline-secondary" (click)="decreaseQty()" [disabled]="quantity <= 1">-</button>
                  <input type="text" class="form-control text-center bg-white" readonly [value]="quantity">
                  <button class="btn btn-outline-secondary" (click)="increaseQty()" [disabled]="quantity >= product.stock">+</button>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div>
              <div class="d-flex gap-3 mb-3">
                <button (click)="onAddToCart()" class="btn btn-outline-danger btn-lg flex-grow-1 rounded-pill fw-semibold">
                  <i class="fa-solid fa-cart-plus me-2"></i> Thêm Vào Giỏ Hàng
                </button>
                <button (click)="onBuyNow()" class="btn btn-danger btn-lg flex-grow-1 rounded-pill fw-bold shadow">
                  Mua Ngay
                </button>
              </div>
            </div>
          </div>
        </div>

        <hr class="my-4">

        <!-- Tabs: Mô tả chi tiết & Đánh giá -->
        <div>
          <h4 class="fw-bold brand-font mb-3">Mô Tả Sản Phẩm</h4>
          <p class="text-secondary lh-lg mb-0" style="white-space: pre-line;">{{ product.description }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cursor-pointer {
      cursor: pointer;
    }
    .active-thumb {
      border: 2px solid #0d6efd !important;
    }
    .thumb-box:hover {
      opacity: 0.8;
    }
  `]
})
export class ProductDetailComponent implements OnInit {
  product: ProductDetail | null = null;
  selectedImage: string = '';
  quantity: number = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.productService.getProduct(id).subscribe(res => {
          this.product = res;
          this.selectedImage = res.imageUrl;
          this.quantity = 1;
        });
      }
    });
  }

  get discountPercent(): number {
    if (this.product?.originalPrice && this.product.originalPrice > this.product.price) {
      return Math.round(((this.product.originalPrice - this.product.price) / this.product.originalPrice) * 100);
    }
    return 0;
  }

  increaseQty(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decreaseQty(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  onAddToCart(): void {
    if (!this.product) return;
    this.cartService.addToCart({
      id: `product-${this.product.id}`,
      itemType: 'Product',
      productId: this.product.id,
      name: this.product.name,
      imageUrl: this.product.imageUrl,
      price: this.product.price,
      originalPrice: this.product.originalPrice,
      quantity: this.quantity,
      stock: this.product.stock,
      brand: this.product.brand
    });
    alert(`Đã thêm ${this.quantity} "${this.product.name}" vào giỏ hàng!`);
  }

  onBuyNow(): void {
    this.onAddToCart();
    this.router.navigate(['/cart']);
  }
}
