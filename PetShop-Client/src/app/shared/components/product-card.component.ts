import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-product-card',
  template: `
    <div class="card product-card h-100 position-relative">
      <!-- Discount Badge -->
      <span *ngIf="discountPercent > 0" class="position-absolute top-0 end-0 m-2 badge bg-danger fw-bold shadow-sm z-1">
        -{{ discountPercent }}%
      </span>

      <!-- Image with Native Lazy Loading -->
      <a [routerLink]="['/products', product.id]" class="position-relative overflow-hidden d-block">
        <div class="ratio ratio-1x1 bg-light">
          <img [src]="product.imageUrl" 
               [alt]="product.name" 
               loading="lazy" 
               class="card-img-top object-fit-cover w-100 h-100 product-img"
               (error)="onImageError($event)">
        </div>
        <span class="position-absolute bottom-0 start-0 m-2 badge badge-freeship z-1">
          <i class="fa-solid fa-bolt me-1"></i> Freeship Xtra
        </span>
      </a>

      <!-- Body -->
      <div class="card-body p-3 d-flex flex-column justify-content-between">
        <div>
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="badge bg-light text-secondary border small">{{ product.brand || 'Chính hãng' }}</span>
            <span class="badge bg-light text-muted small" *ngIf="product.categoryName">{{ product.categoryName }}</span>
          </div>

          <a [routerLink]="['/products', product.id]" class="text-dark fw-bold text-decoration-none title-link" [title]="product.name">
            <h6 class="card-title text-truncate-2 mb-2 fs-6 lh-base">{{ product.name }}</h6>
          </a>
        </div>

        <div>
          <!-- Price -->
          <div class="d-flex align-items-baseline mb-2">
            <span class="price-current">
              {{ product.price | number:'1.0-0' }} <span class="currency">đ</span>
            </span>
            <span *ngIf="product.originalPrice && product.originalPrice > product.price" class="price-original">
              {{ product.originalPrice | number:'1.0-0' }} đ
            </span>
          </div>

          <!-- Rating & Sold -->
          <div class="d-flex justify-content-between align-items-center small mb-3">
            <app-rating-stars [rating]="product.rating"></app-rating-stars>
            <span class="text-muted">Đã bán {{ product.soldQuantity }}</span>
          </div>

          <!-- Add to Cart Button -->
          <button (click)="onAddToCart($event)" 
                  class="btn btn-outline-danger btn-sm w-100 fw-semibold rounded-pill py-1 d-flex align-items-center justify-content-center">
            <i class="fa-solid fa-cart-plus me-2"></i> Thêm vào giỏ
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-truncate-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 2.7rem;
    }
    .product-img {
      transition: transform 0.3s ease;
    }
    .product-card:hover .product-img {
      transform: scale(1.05);
    }
    .title-link:hover h6 {
      color: #ee4d2d !important;
    }
    .btn-outline-danger {
      border-color: #ff5722;
      color: #ff5722;
      &:hover {
        background-color: #ff5722;
        color: #fff;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Output() addToCart = new EventEmitter<Product>();

  get discountPercent(): number {
    if (this.product.originalPrice && this.product.originalPrice > this.product.price) {
      return Math.round(((this.product.originalPrice - this.product.price) / this.product.originalPrice) * 100);
    }
    return 0;
  }

  onAddToCart(event: Event): void {
    event.stopPropagation();
    this.addToCart.emit(this.product);
  }

  onImageError(event: any): void {
    event.target.src = 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=400&q=80';
  }
}
