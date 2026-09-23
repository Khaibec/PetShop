import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Pet } from '../../core/models/pet.model';

@Component({
  selector: 'app-pet-card',
  template: `
    <div class="card pet-card h-100 position-relative shadow-sm">
      <!-- Status Badge -->
      <span *ngIf="pet.status === 'Available'" class="position-absolute top-0 start-0 m-2 badge bg-success z-1">
        <i class="fa-solid fa-heart me-1"></i> Sẵn sàng đón
      </span>
      <span *ngIf="pet.status === 'Reserved'" class="position-absolute top-0 start-0 m-2 badge bg-warning text-dark z-1">
        Đang giữ chỗ
      </span>
      <span *ngIf="pet.status === 'Sold'" class="position-absolute top-0 start-0 m-2 badge bg-secondary z-1">
        Đã về nhà mới
      </span>

      <!-- Discount % if any -->
      <span *ngIf="discountPercent > 0" class="position-absolute top-0 end-0 m-2 badge bg-danger fw-bold z-1">
        -{{ discountPercent }}%
      </span>

      <!-- Image with Native Lazy Loading -->
      <a [routerLink]="['/pets', pet.id]" class="position-relative overflow-hidden d-block">
        <div class="ratio ratio-4x3 bg-light">
          <img [src]="pet.imageUrl" 
               [alt]="pet.name" 
               loading="lazy" 
               class="card-img-top object-fit-cover w-100 h-100 pet-img"
               (error)="onImageError($event)">
        </div>
        <span class="position-absolute bottom-0 start-0 m-2 badge badge-breed z-1">
          {{ pet.breed }}
        </span>
      </a>

      <!-- Body -->
      <div class="card-body p-3 d-flex flex-column justify-content-between">
        <div>
          <!-- Title -->
          <a [routerLink]="['/pets', pet.id]" class="text-dark fw-bold text-decoration-none title-link" [title]="pet.name">
            <h6 class="card-title text-truncate-2 mb-2 fs-6 lh-base">{{ pet.name }}</h6>
          </a>

          <!-- Attributes (Gender, Age, Color) -->
          <div class="d-flex flex-wrap gap-1 align-items-center mb-2 small">
            <span class="badge" [ngClass]="pet.gender === 'Đực' ? 'bg-primary-subtle text-primary border' : 'bg-danger-subtle text-danger border'">
              <i class="fa-solid" [ngClass]="pet.gender === 'Đực' ? 'fa-mars' : 'fa-venus'"></i> {{ pet.gender }}
            </span>
            <span class="badge bg-light text-dark border">
              <i class="fa-regular fa-calendar me-1"></i> {{ pet.ageMonths }} tháng tuổi
            </span>
            <span class="badge bg-light text-muted border text-truncate" style="max-width: 110px;">
              {{ pet.color }}
            </span>
          </div>

          <!-- Vaccination info -->
          <div class="d-flex align-items-center text-success small mb-3">
            <i class="fa-solid fa-circle-check me-1"></i>
            <span>Đã tiêm chủng & tẩy giun</span>
          </div>
        </div>

        <div>
          <!-- Price -->
          <div class="d-flex align-items-baseline mb-3">
            <span class="price-current text-primary-pet">
              {{ pet.price | number:'1.0-0' }} <span class="currency">đ</span>
            </span>
            <span *ngIf="pet.originalPrice && pet.originalPrice > pet.price" class="price-original">
              {{ pet.originalPrice | number:'1.0-0' }} đ
            </span>
          </div>

          <!-- Button -->
          <div class="d-flex gap-2">
            <a [routerLink]="['/pets', pet.id]" class="btn btn-outline-secondary btn-sm flex-grow-1 rounded-pill">
              Chi tiết
            </a>
            <button *ngIf="pet.status === 'Available'" 
                    (click)="onAdopt($event)" 
                    class="btn btn-primary-pet btn-sm flex-grow-1 rounded-pill fw-semibold shadow-sm">
              <i class="fa-solid fa-paw me-1"></i> Đón bé
            </button>
            <button *ngIf="pet.status !== 'Available'" disabled class="btn btn-secondary btn-sm flex-grow-1 rounded-pill">
              Đã bán
            </button>
          </div>
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
    .pet-img {
      transition: transform 0.3s ease;
    }
    .pet-card:hover .pet-img {
      transform: scale(1.05);
    }
    .title-link:hover h6 {
      color: #ff7a00 !important;
    }
    .text-primary-pet {
      color: #ff7a00;
    }
    .btn-primary-pet {
      background-color: #ff7a00;
      color: #fff;
      border: none;
      &:hover {
        background-color: #e66a00;
        color: #fff;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PetCardComponent {
  @Input() pet!: Pet;
  @Output() adopt = new EventEmitter<Pet>();

  get discountPercent(): number {
    if (this.pet.originalPrice && this.pet.originalPrice > this.pet.price) {
      return Math.round(((this.pet.originalPrice - this.pet.price) / this.pet.originalPrice) * 100);
    }
    return 0;
  }

  onAdopt(event: Event): void {
    event.stopPropagation();
    this.adopt.emit(this.pet);
  }

  onImageError(event: any): void {
    event.target.src = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80';
  }
}
