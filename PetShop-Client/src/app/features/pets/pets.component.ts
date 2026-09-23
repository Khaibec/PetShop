import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PetService } from '../../core/services/pet.service';
import { CartService } from '../../core/services/cart.service';
import { Pet, PetFilter } from '../../core/models/pet.model';
import { PagedResult } from '../../core/models/paged-result.model';

@Component({
  selector: 'app-pets',
  template: `
    <div class="container my-4">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-3 small">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a routerLink="/" class="text-muted"><i class="fa-solid fa-house"></i> Trang chủ</a></li>
          <li class="breadcrumb-item active fw-bold text-orange" aria-current="page">🐶 Tab 1: Thú Cưng</li>
        </ol>
      </nav>

      <!-- Banner header -->
      <div class="pet-header-banner rounded-4 p-4 text-white mb-4 shadow-sm d-flex justify-content-between align-items-center">
        <div>
          <span class="badge bg-warning text-dark px-3 py-1 rounded-pill fw-bold mb-2">🐾 BẢO HÀNH THUẦN CHỦNG TRỌN ĐỜI</span>
          <h2 class="fw-bold mb-1 brand-font">Các Bé Cún & Mèo Đáng Yêu Chờ Về Nhà Mới</h2>
          <p class="small text-white-50 mb-0">Đầy đủ sổ tiêm chủng 2 mũi, bảo hành bệnh Care/Parvo 30 ngày, tặng kèm gói phụ kiện trị giá 500.000đ</p>
        </div>
        <div class="d-none d-md-block text-end">
          <div class="display-6 fw-bold text-warning">{{ totalCount }}</div>
          <small class="text-white-50 text-uppercase fw-semibold">Bé Cưng Sẵn Sàng</small>
        </div>
      </div>

      <div class="row g-4">
        <!-- Sidebar Filter (Shopee Style) -->
        <div class="col-12 col-lg-3">
          <div class="card border-0 shadow-sm rounded-4 p-3 filter-card">
            <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h6 class="fw-bold mb-0 text-dark">
                <i class="fa-solid fa-filter text-orange me-2"></i> BỘ LỌC TÌM KIẾM
              </h6>
              <button (click)="resetFilters()" class="btn btn-link btn-sm text-muted p-0 text-decoration-none">
                Thiết lập lại
              </button>
            </div>

            <!-- Species Filter -->
            <div class="filter-group mb-3">
              <label class="fw-bold small mb-2 text-dark">Loài Thú Cưng</label>
              <div class="d-flex gap-2">
                <button (click)="setSpecies('')" 
                        [class.active-filter]="!filter.species"
                        class="btn btn-outline-secondary btn-sm flex-grow-1 rounded-pill">
                  Tất cả
                </button>
                <button (click)="setSpecies('Chó')" 
                        [class.active-filter]="filter.species === 'Chó'"
                        class="btn btn-outline-secondary btn-sm flex-grow-1 rounded-pill">
                  🐶 Chó
                </button>
                <button (click)="setSpecies('Mèo')" 
                        [class.active-filter]="filter.species === 'Mèo'"
                        class="btn btn-outline-secondary btn-sm flex-grow-1 rounded-pill">
                  🐱 Mèo
                </button>
              </div>
            </div>

            <!-- Gender Filter -->
            <div class="filter-group mb-3">
              <label class="fw-bold small mb-2 text-dark">Giới Tính</label>
              <div class="d-flex gap-2">
                <button (click)="setGender('')" 
                        [class.active-filter]="!filter.gender"
                        class="btn btn-outline-secondary btn-sm flex-grow-1 rounded-pill">
                  Tất cả
                </button>
                <button (click)="setGender('Đực')" 
                        [class.active-filter]="filter.gender === 'Đực'"
                        class="btn btn-outline-secondary btn-sm flex-grow-1 rounded-pill">
                  ♂ Đực
                </button>
                <button (click)="setGender('Cái')" 
                        [class.active-filter]="filter.gender === 'Cái'"
                        class="btn btn-outline-secondary btn-sm flex-grow-1 rounded-pill">
                  ♀ Cái
                </button>
              </div>
            </div>

            <!-- Price Range -->
            <div class="filter-group mb-3">
              <label class="fw-bold small mb-2 text-dark">Khoảng Giá (VNĐ)</label>
              <div class="d-flex flex-column gap-2 small">
                <button (click)="setPriceRange(undefined, 7000000)" 
                        [class.active-filter]="filter.maxPrice === 7000000"
                        class="btn btn-outline-secondary btn-sm text-start rounded-pill px-3">
                  Dưới 7.000.000đ
                </button>
                <button (click)="setPriceRange(7000000, 12000000)" 
                        [class.active-filter]="filter.minPrice === 7000000 && filter.maxPrice === 12000000"
                        class="btn btn-outline-secondary btn-sm text-start rounded-pill px-3">
                  7.000.000đ - 12.000.000đ
                </button>
                <button (click)="setPriceRange(12000000, undefined)" 
                        [class.active-filter]="filter.minPrice === 12000000 && !filter.maxPrice"
                        class="btn btn-outline-secondary btn-sm text-start rounded-pill px-3">
                  Trên 12.000.000đ
                </button>
              </div>
            </div>

            <!-- Status Filter -->
            <div class="filter-group mb-2">
              <label class="fw-bold small mb-2 text-dark">Tình Trạng</label>
              <select [(ngModel)]="filter.status" (change)="loadPets()" class="form-select form-select-sm rounded-pill">
                <option value="">Tất cả trạng thái</option>
                <option value="Available">Sẵn sàng đón bé</option>
                <option value="Reserved">Đang giữ chỗ</option>
                <option value="Sold">Đã về nhà mới</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Main Pet List Content -->
        <div class="col-12 col-lg-9">
          <!-- Top Sort Bar (Shopee Style) -->
          <div class="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div class="d-flex align-items-center gap-2 small">
                <span class="text-muted fw-bold">Sắp xếp theo:</span>
                <button (click)="setSort('newest')" 
                        [class.btn-warning]="filter.sortBy === 'newest'"
                        [class.btn-outline-secondary]="filter.sortBy !== 'newest'"
                        class="btn btn-sm rounded-pill fw-semibold">
                  Mới Nhất
                </button>
                <button (click)="setSort('price_asc')" 
                        [class.btn-warning]="filter.sortBy === 'price_asc'"
                        [class.btn-outline-secondary]="filter.sortBy !== 'price_asc'"
                        class="btn btn-sm rounded-pill fw-semibold">
                  Giá: Thấp đến Cao
                </button>
                <button (click)="setSort('price_desc')" 
                        [class.btn-warning]="filter.sortBy === 'price_desc'"
                        [class.btn-outline-secondary]="filter.sortBy !== 'price_desc'"
                        class="btn btn-sm rounded-pill fw-semibold">
                  Giá: Cao đến Thấp
                </button>
              </div>
              <span class="small text-muted">Hiển thị <strong>{{ pets.length }}</strong> / {{ totalCount }} bé</span>
            </div>
          </div>

          <!-- Loading Spinner -->
          <div *ngIf="isLoading" class="text-center py-5">
            <div class="spinner-border text-warning" role="status">
              <span class="visually-hidden">Đang tải...</span>
            </div>
            <p class="text-muted small mt-2">Đang tìm các bé cưng...</p>
          </div>

          <!-- Empty State -->
          <div *ngIf="!isLoading && pets.length === 0" class="text-center py-5 bg-white rounded-4 shadow-sm p-4">
            <i class="fa-solid fa-dog fs-1 text-muted mb-3 d-block"></i>
            <h5 class="fw-bold text-dark">Chưa tìm thấy bé thú cưng phù hợp</h5>
            <p class="text-muted small mb-3">Vui lòng thử điều chỉnh lại bộ lọc hoặc khoảng giá.</p>
            <button (click)="resetFilters()" class="btn btn-warning rounded-pill px-4 fw-bold">
              Xóa bộ lọc
            </button>
          </div>

          <!-- Pets Grid -->
          <div *ngIf="!isLoading && pets.length > 0" class="row g-3">
            <div *ngFor="let pet of pets; trackBy: trackById" class="col-6 col-md-4">
              <app-pet-card [pet]="pet" (adopt)="onAdoptPet($event)"></app-pet-card>
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
    .text-orange {
      color: #ff7a00;
    }
    .pet-header-banner {
      background: linear-gradient(135deg, #ff7a00 0%, #ff5722 100%);
    }
    .active-filter {
      background-color: #ff7a00 !important;
      border-color: #ff7a00 !important;
      color: #fff !important;
    }
    .filter-card {
      background: #fff;
    }
  `]
})
export class PetsComponent implements OnInit {
  pets: Pet[] = [];
  totalCount = 0;
  totalPages = 1;
  isLoading = true;

  filter: PetFilter = {
    pageNumber: 1,
    pageSize: 9,
    sortBy: 'newest'
  };

  constructor(
    private petService: PetService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['species']) this.filter.species = params['species'];
      if (params['breed']) this.filter.breed = params['breed'];
      if (params['q']) this.filter.searchTerm = params['q'];
      this.loadPets();
    });
  }

  loadPets(): void {
    this.isLoading = true;
    this.petService.getPets(this.filter).subscribe({
      next: (res: PagedResult<Pet>) => {
        this.pets = res.items;
        this.totalCount = res.totalCount;
        this.totalPages = res.totalPages;
        this.isLoading = false;
      },
      error: err => {
        console.error('Error loading pets:', err);
        this.isLoading = false;
      }
    });
  }

  setSpecies(species: string): void {
    this.filter.species = species || undefined;
    this.filter.pageNumber = 1;
    this.loadPets();
  }

  setGender(gender: string): void {
    this.filter.gender = gender || undefined;
    this.filter.pageNumber = 1;
    this.loadPets();
  }

  setPriceRange(min?: number, max?: number): void {
    this.filter.minPrice = min;
    this.filter.maxPrice = max;
    this.filter.pageNumber = 1;
    this.loadPets();
  }

  setSort(sortBy: string): void {
    this.filter.sortBy = sortBy;
    this.filter.pageNumber = 1;
    this.loadPets();
  }

  resetFilters(): void {
    this.filter = {
      pageNumber: 1,
      pageSize: 9,
      sortBy: 'newest'
    };
    this.loadPets();
  }

  onPageChange(page: number): void {
    this.filter.pageNumber = page;
    this.loadPets();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    alert(`Đã thêm bé "${pet.name}" vào giỏ hàng!`);
  }

  trackById(index: number, item: Pet): number {
    return item.id;
  }
}
