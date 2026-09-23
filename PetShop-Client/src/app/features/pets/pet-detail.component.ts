import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PetService } from '../../core/services/pet.service';
import { CartService } from '../../core/services/cart.service';
import { PetDetail, Pet } from '../../core/models/pet.model';

@Component({
  selector: 'app-pet-detail',
  template: `
    <div class="container my-4" *ngIf="pet">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-3 small">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a routerLink="/" class="text-muted">Trang chủ</a></li>
          <li class="breadcrumb-item"><a routerLink="/pets" class="text-muted">Thú Cưng</a></li>
          <li class="breadcrumb-item active text-truncate" style="max-width: 200px;">{{ pet.name }}</li>
        </ol>
      </nav>

      <div class="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div class="row g-4 g-lg-5">
          <!-- Left: Image Gallery -->
          <div class="col-12 col-md-6">
            <div class="main-image-box rounded-4 overflow-hidden shadow-sm ratio ratio-4x3 mb-3 bg-light">
              <img [src]="selectedImage || pet.imageUrl" [alt]="pet.name" class="w-100 h-100 object-fit-cover">
            </div>

            <!-- Thumbnail List -->
            <div class="d-flex gap-2" *ngIf="pet.additionalImages && pet.additionalImages.length > 0">
              <div class="thumb-box rounded-3 overflow-hidden border ratio ratio-1x1 cursor-pointer"
                   [class.active-thumb]="selectedImage === pet.imageUrl"
                   (click)="selectedImage = pet.imageUrl" style="width: 70px;">
                <img [src]="pet.imageUrl" class="w-100 h-100 object-fit-cover">
              </div>
              <div *ngFor="let img of pet.additionalImages" 
                   class="thumb-box rounded-3 overflow-hidden border ratio ratio-1x1 cursor-pointer"
                   [class.active-thumb]="selectedImage === img"
                   (click)="selectedImage = img" style="width: 70px;">
                <img [src]="img" class="w-100 h-100 object-fit-cover">
              </div>
            </div>
          </div>

          <!-- Right: Pet Info & Actions -->
          <div class="col-12 col-md-6 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex align-items-center gap-2 mb-2">
                <span class="badge bg-warning text-dark px-3 py-1 rounded-pill fw-bold">
                  {{ pet.species }} Thuần Chủng
                </span>
                <span class="badge" [ngClass]="pet.status === 'Available' ? 'bg-success' : 'bg-secondary'">
                  {{ pet.status === 'Available' ? 'Sẵn sàng đón bé' : 'Đã giữ chỗ / Đã bán' }}
                </span>
              </div>

              <h2 class="fw-bold mb-3 brand-font text-dark">{{ pet.name }}</h2>

              <!-- Price Box -->
              <div class="bg-light p-3 rounded-4 mb-3 d-flex align-items-baseline gap-3">
                <span class="fs-2 fw-bold text-danger">
                  {{ pet.price | number:'1.0-0' }} <span class="fs-5 text-decoration-underline">đ</span>
                </span>
                <span *ngIf="pet.originalPrice && pet.originalPrice > pet.price" class="text-muted text-decoration-line-through fs-5">
                  {{ pet.originalPrice | number:'1.0-0' }} đ
                </span>
                <span class="badge bg-danger rounded-pill ms-auto" *ngIf="discountPercent > 0">
                  Tiết kiệm {{ discountPercent }}%
                </span>
              </div>

              <!-- Specification Table -->
              <div class="specs-grid bg-white border rounded-4 p-3 mb-4">
                <div class="row g-2 small">
                  <div class="col-6"><span class="text-muted">Giống loài:</span> <strong>{{ pet.breed }}</strong></div>
                  <div class="col-6"><span class="text-muted">Giới tính:</span> <strong>{{ pet.gender }}</strong></div>
                  <div class="col-6"><span class="text-muted">Tháng tuổi:</span> <strong>{{ pet.ageMonths }} tháng</strong></div>
                  <div class="col-6"><span class="text-muted">Cân nặng:</span> <strong>{{ pet.weightKg }} kg</strong></div>
                  <div class="col-6"><span class="text-muted">Màu lông:</span> <strong>{{ pet.color }}</strong></div>
                  <div class="col-6"><span class="text-muted">Tiêm chủng:</span> <strong class="text-success"><i class="fa-solid fa-check"></i> Đủ 2 mũi</strong></div>
                </div>
              </div>

              <!-- Health guarantee -->
              <div class="alert alert-success d-flex align-items-center rounded-3 p-3 mb-3 small" role="alert">
                <i class="fa-solid fa-shield-virus fs-3 me-3 text-success"></i>
                <div>
                  <strong>Bảo hành sức khỏe & Y tế:</strong><br>
                  {{ pet.healthCertificate }}
                </div>
              </div>
            </div>

            <!-- CTA Buttons -->
            <div>
              <div class="d-flex gap-3 mb-3">
                <button *ngIf="pet.status === 'Available'" 
                        (click)="onAdoptNow()" 
                        class="btn btn-warning btn-lg flex-grow-1 rounded-pill fw-bold shadow-sm text-dark">
                  <i class="fa-solid fa-paw me-2"></i> Đón Bé Ngay (Đặt Cọc)
                </button>
                <button *ngIf="pet.status !== 'Available'" disabled class="btn btn-secondary btn-lg flex-grow-1 rounded-pill">
                  Bé đã được nhận nuôi
                </button>
              </div>
              <p class="text-center text-muted small mb-0">
                <i class="fa-solid fa-phone me-1"></i> Cần hỗ trợ trực tiếp? Gọi Hotline <strong>1900 8888</strong>
              </p>
            </div>
          </div>
        </div>

        <hr class="my-4">

        <!-- Description Section -->
        <div>
          <h4 class="fw-bold brand-font mb-3">Đặc Điểm & Tính Cách Bé Cưng</h4>
          <p class="text-secondary lh-lg mb-0" style="white-space: pre-line;">{{ pet.description }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cursor-pointer {
      cursor: pointer;
    }
    .active-thumb {
      border: 2px solid #ff7a00 !important;
    }
    .thumb-box:hover {
      opacity: 0.8;
    }
  `]
})
export class PetDetailComponent implements OnInit {
  pet: PetDetail | null = null;
  selectedImage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private petService: PetService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id) {
        this.petService.getPet(id).subscribe(res => {
          this.pet = res;
          this.selectedImage = res.imageUrl;
        });
      }
    });
  }

  get discountPercent(): number {
    if (this.pet?.originalPrice && this.pet.originalPrice > this.pet.price) {
      return Math.round(((this.pet.originalPrice - this.pet.price) / this.pet.originalPrice) * 100);
    }
    return 0;
  }

  onAdoptNow(): void {
    if (!this.pet) return;
    this.cartService.addToCart({
      id: `pet-${this.pet.id}`,
      itemType: 'Pet',
      petId: this.pet.id,
      name: this.pet.name,
      imageUrl: this.pet.imageUrl,
      price: this.pet.price,
      originalPrice: this.pet.originalPrice,
      quantity: 1,
      breed: this.pet.breed
    });
    this.router.navigate(['/cart']);
  }
}
