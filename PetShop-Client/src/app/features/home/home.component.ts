import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { CategoryService } from '../../core/services/category.service';
import { PetService } from '../../core/services/pet.service';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { Category } from '../../core/models/category.model';
import { Pet } from '../../core/models/pet.model';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-home',
  template: `
    <!-- Top Hero Banner / Carousel -->
    <div class="container my-3">
      <div class="row g-3">
        <!-- Main Carousel Banner -->
        <div class="col-12 col-lg-8">
          <div id="heroCarousel" class="carousel slide carousel-fade rounded-4 overflow-hidden shadow-sm h-100" data-bs-ride="carousel">
            <div class="carousel-indicators">
              <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="0" class="active"></button>
              <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="1"></button>
              <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="2"></button>
            </div>
            <div class="carousel-inner h-100">
              <!-- Slide 1 -->
              <div class="carousel-item active h-100" data-bs-interval="4000">
                <div class="banner-slide banner-1 d-flex align-items-center text-white p-4 p-md-5">
                  <div class="col-12 col-md-7">
                    <span class="badge bg-warning text-dark px-3 py-1 rounded-pill fw-bold mb-2">🐾 LỄ HỘI CƯNG NỰNG</span>
                    <h1 class="display-6 fw-bold mb-2">Đón Bé Về Nhà - Ngập Tràn Yêu Thương</h1>
                    <p class="small text-white-50 mb-4">Các bé Corgi, Poodle, Mèo Anh lông ngắn thuần chủng đã tiêm chủng 2 mũi, bảo hành 30 ngày.</p>
                    <a routerLink="/pets" class="btn btn-warning fw-bold px-4 py-2 rounded-pill shadow">
                      Khám Phá Ngay <i class="fa-solid fa-arrow-right ms-1"></i>
                    </a>
                  </div>
                </div>
              </div>
              <!-- Slide 2 -->
              <div class="carousel-item h-100" data-bs-interval="4000">
                <div class="banner-slide banner-2 d-flex align-items-center text-white p-4 p-md-5">
                  <div class="col-12 col-md-7">
                    <span class="badge bg-danger text-white px-3 py-1 rounded-pill fw-bold mb-2">⚡ FLASH SALE 50%</span>
                    <h1 class="display-6 fw-bold mb-2">Hạt Royal Canin & Pate Cao Cấp</h1>
                    <p class="small text-white-50 mb-4">Chính hãng 100%, bổ sung DHA và kháng thể tự nhiên. Tặng kèm đồ chơi gặm.</p>
                    <a routerLink="/products" class="btn btn-danger fw-bold px-4 py-2 rounded-pill shadow">
                      Mua Sắm Ngay <i class="fa-solid fa-arrow-right ms-1"></i>
                    </a>
                  </div>
                </div>
              </div>
              <!-- Slide 3 -->
              <div class="carousel-item h-100" data-bs-interval="4000">
                <div class="banner-slide banner-3 d-flex align-items-center text-white p-4 p-md-5">
                  <div class="col-12 col-md-7">
                    <span class="badge bg-info text-dark px-3 py-1 rounded-pill fw-bold mb-2">🎁 ƯU ĐÃI THÀNH VIÊN</span>
                    <h1 class="display-6 fw-bold mb-2">Miễn Phí Vận Chuyển Toàn Quốc</h1>
                    <p class="small text-white-50 mb-4">Áp dụng cho mọi đơn phụ kiện từ 300.000đ. Giao hỏa tốc 2h nội thành.</p>
                    <a routerLink="/products" class="btn btn-light fw-bold px-4 py-2 rounded-pill shadow">
                      Nhận Mã Freeship <i class="fa-solid fa-tag ms-1"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <button class="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
              <span class="carousel-control-prev-icon"></span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
              <span class="carousel-control-next-icon"></span>
            </button>
          </div>
        </div>

        <!-- 2 Side Sub-Banners -->
        <div class="col-12 col-lg-4 d-flex flex-column gap-3">
          <div class="sub-banner sub-1 rounded-4 p-4 text-white d-flex flex-column justify-content-between flex-grow-1 shadow-sm position-relative overflow-hidden">
            <div>
              <span class="badge bg-white text-dark small fw-bold mb-1">MỚI VỀ</span>
              <h5 class="fw-bold mb-1">Mèo Mắt Xanh Cực Phẩm</h5>
              <p class="small text-white-50 mb-0">Ragdoll, Scottish Fold tai cụp</p>
            </div>
            <a routerLink="/pets" [queryParams]="{ species: 'Mèo' }" class="btn btn-sm btn-outline-light rounded-pill align-self-start mt-2">
              Xem ngay <i class="fa-solid fa-angle-right"></i>
            </a>
          </div>

          <div class="sub-banner sub-2 rounded-4 p-4 text-white d-flex flex-column justify-content-between flex-grow-1 shadow-sm position-relative overflow-hidden">
            <div>
              <span class="badge bg-warning text-dark small fw-bold mb-1">BÁN CHẠY</span>
              <h5 class="fw-bold mb-1">Cát Tofu & Sữa Tắm SOS</h5>
              <p class="small text-white-50 mb-0">Khử mùi tuyệt đối, an toàn cho da</p>
            </div>
            <a routerLink="/products" [queryParams]="{ categoryId: 6 }" class="btn btn-sm btn-warning rounded-pill align-self-start mt-2 text-dark fw-bold">
              Mua ngay <i class="fa-solid fa-angle-right"></i>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Features Strip -->
    <div class="container my-3">
      <div class="bg-white rounded-4 p-3 shadow-sm">
        <div class="row g-3 text-center">
          <div class="col-6 col-md-3 d-flex align-items-center justify-content-center gap-2 border-end-md">
            <i class="fa-solid fa-certificate fs-3 text-warning"></i>
            <div class="text-start">
              <h6 class="mb-0 fw-bold small">Thuần Chủng 100%</h6>
              <small class="text-muted" style="font-size: 0.75rem;">Nguồn gốc & sổ tiêm đủ</small>
            </div>
          </div>
          <div class="col-6 col-md-3 d-flex align-items-center justify-content-center gap-2 border-end-md">
            <i class="fa-solid fa-truck-fast fs-3 text-primary"></i>
            <div class="text-start">
              <h6 class="mb-0 fw-bold small">Giao Hỏa Tốc 2H</h6>
              <small class="text-muted" style="font-size: 0.75rem;">Nội thành & toàn quốc</small>
            </div>
          </div>
          <div class="col-6 col-md-3 d-flex align-items-center justify-content-center gap-2 border-end-md">
            <i class="fa-solid fa-shield-halved fs-3 text-success"></i>
            <div class="text-start">
              <h6 class="mb-0 fw-bold small">Bảo Hành Sức Khỏe</h6>
              <small class="text-muted" style="font-size: 0.75rem;">30 ngày toàn diện</small>
            </div>
          </div>
          <div class="col-6 col-md-3 d-flex align-items-center justify-content-center gap-2">
            <i class="fa-solid fa-user-doctor fs-3 text-danger"></i>
            <div class="text-start">
              <h6 class="mb-0 fw-bold small">Tư Vấn Thú Y 24/7</h6>
              <small class="text-muted" style="font-size: 0.75rem;">Bác sĩ đồng hành nuôi dưỡng</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Category Circle Icons -->
    <div class="container my-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="fw-bold mb-0 brand-font">
          <i class="fa-solid fa-shapes text-brand me-2"></i> Danh Mục Nổi Bật
        </h4>
      </div>
      <div class="row g-2 g-md-3 text-center">
        <div *ngFor="let cat of categories; trackBy: trackById" class="col-4 col-sm-3 col-md-2">
          <a [routerLink]="cat.type === 'Pet' ? ['/pets'] : ['/products']" 
             [queryParams]="cat.type === 'Pet' ? { species: cat.name.includes('Chó') ? 'Chó' : 'Mèo' } : { categoryId: cat.id }"
             class="category-circle-card d-block p-2 p-md-3 rounded-4 bg-white shadow-sm text-decoration-none h-100">
            <div class="cat-img-box rounded-circle mx-auto mb-2 overflow-hidden position-relative">
              <img [src]="cat.imageUrl" [alt]="cat.name" loading="lazy" class="w-100 h-100 object-fit-cover">
            </div>
            <span class="fw-bold small text-dark d-block text-truncate">{{ cat.name }}</span>
            <small class="text-muted" style="font-size: 0.72rem;">{{ cat.productCount }} lựa chọn</small>
          </a>
        </div>
      </div>
    </div>

    <!-- Dual Tab Showcase Section -->
    <div class="container my-5">
      <!-- Section 1: Thú Cưng Mới Về (Tab 1 Showcase) -->
      <div class="d-flex justify-content-between align-items-end mb-3">
        <div>
          <span class="badge bg-orange text-white px-3 py-1 rounded-pill small fw-bold mb-1">
            <i class="fa-solid fa-paw me-1"></i> TAB 1: THÚ CƯNG
          </span>
          <h3 class="fw-bold mb-0 brand-font text-dark">
            Các Bé Cưng Sẵn Sàng Về Nhà Mới
          </h3>
        </div>
        <a routerLink="/pets" class="btn btn-outline-warning btn-sm rounded-pill fw-bold text-dark px-3">
          Xem tất cả thú cưng <i class="fa-solid fa-arrow-right ms-1"></i>
        </a>
      </div>

      <!-- Pets Grid -->
      <div class="row g-3 mb-5">
        <div *ngFor="let pet of featuredPets; trackBy: trackById" class="col-6 col-md-4 col-lg-3">
          <app-pet-card [pet]="pet" (adopt)="onAdoptPet($event)"></app-pet-card>
        </div>
      </div>

      <!-- Section 2: Đồ Dùng & Phụ Kiện Nổi Bật (Tab 2 Showcase) -->
      <div class="d-flex justify-content-between align-items-end mb-3">
        <div>
          <span class="badge bg-primary text-white px-3 py-1 rounded-pill small fw-bold mb-1">
            <i class="fa-solid fa-cart-shopping me-1"></i> TAB 2: ĐỒ DÙNG & PHỤ KIỆN
          </span>
          <h3 class="fw-bold mb-0 brand-font text-dark">
            Thức Ăn & Phụ Kiện Bán Chạy Nhất
          </h3>
        </div>
        <a routerLink="/products" class="btn btn-outline-primary btn-sm rounded-pill fw-bold px-3">
          Xem tất cả đồ dùng <i class="fa-solid fa-arrow-right ms-1"></i>
        </a>
      </div>

      <!-- Products Grid -->
      <div class="row g-3">
        <div *ngFor="let prod of featuredProducts; trackBy: trackById" class="col-6 col-md-4 col-lg-3">
          <app-product-card [product]="prod" (addToCart)="onAddProductToCart($event)"></app-product-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .banner-slide {
      min-height: 340px;
      border-radius: 1rem;
      background-size: cover;
      background-position: center;
    }
    .banner-1 {
      background: linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 100%), url('https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1200&q=80') center/cover;
    }
    .banner-2 {
      background: linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 100%), url('https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=1200&q=80') center/cover;
    }
    .banner-3 {
      background: linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 100%), url('https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=80') center/cover;
    }
    .sub-1 {
      background: linear-gradient(135deg, rgba(255, 122, 0, 0.85) 0%, rgba(255, 87, 34, 0.95) 100%), url('https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&q=80') center/cover;
    }
    .sub-2 {
      background: linear-gradient(135deg, rgba(13, 110, 253, 0.85) 0%, rgba(10, 88, 202, 0.95) 100%), url('https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=600&q=80') center/cover;
    }
    .category-circle-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.08) !important;
        .cat-img-box img {
          transform: scale(1.1);
        }
      }
    }
    .cat-img-box {
      width: 70px;
      height: 70px;
      background-color: #f8f9fa;
      img {
        transition: transform 0.3s ease;
      }
    }
    .border-end-md {
      @media (min-width: 768px) {
        border-right: 1px solid #e9ecef;
      }
    }
    .bg-orange {
      background-color: #ff7a00;
    }
    .text-brand {
      color: #ff5722;
    }
  `]
})
export class HomeComponent implements OnInit {
  categories: Category[] = [];
  featuredPets: Pet[] = [];
  featuredProducts: Product[] = [];
  isLoading = true;

  constructor(
    private categoryService: CategoryService,
    private petService: PetService,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    // API Parallel optimization: gọi song song 3 API bằng forkJoin
    forkJoin({
      categories: this.categoryService.getCategories(),
      pets: this.petService.getFeaturedPets(8),
      products: this.productService.getFeaturedProducts(8)
    }).subscribe({
      next: ({ categories, pets, products }) => {
        this.categories = categories;
        this.featuredPets = pets;
        this.featuredProducts = products;
        this.isLoading = false;
      },
      error: err => {
        console.error('Error fetching home data:', err);
        this.isLoading = false;
      }
    });
  }

  onAddProductToCart(product: Product): void {
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

  onAdoptPet(pet: Pet): void {
    this.cartService.addToCart({
      id: `pet-${pet.id}`,
      itemType: 'Pet',
      petId: pet.id,
      name: pet.name,
      imageUrl: pet.imageUrl,
      price: pet.price,
      originalPrice: pet.originalPrice,
      quantity: 1,
      breed: pet.breed
    });
    alert(`Đã thêm bé "${pet.name}" vào giỏ hàng! Hãy tiến hành đặt cọc để giữ chỗ cho bé nhé.`);
  }

  trackById(index: number, item: any): any {
    return item.id;
  }
}
