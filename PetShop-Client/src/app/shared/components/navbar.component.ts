import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CategoryService } from '../../core/services/category.service';
import { Category } from '../../core/models/category.model';

@Component({
  selector: 'app-navbar',
  template: `
    <nav class="nav-tabs-wrapper border-top bg-white">
      <div class="container">
        <div class="d-flex justify-content-between align-items-center">
          <!-- 2 Main Tabs -->
          <div class="nav nav-pills main-tabs py-2 gap-2" role="tablist">
            <!-- TAB 1: THÚ CƯNG -->
            <a routerLink="/pets" 
               routerLinkActive="active-pet-tab" 
               [routerLinkActiveOptions]="{ exact: false }"
               class="nav-link main-tab-btn d-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-bold">
              <span class="tab-icon-badge bg-orange text-white rounded-circle">
                <i class="fa-solid fa-dog"></i>
              </span>
              <span>THÚ CƯNG</span>
              <span class="badge bg-warning text-dark pill-hot small">Hot</span>
            </a>

            <!-- TAB 2: ĐỒ DÙNG THÚ CƯNG -->
            <a routerLink="/products" 
               routerLinkActive="active-supply-tab" 
               [routerLinkActiveOptions]="{ exact: false }"
               class="nav-link main-tab-btn d-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-bold">
              <span class="tab-icon-badge bg-blue text-white rounded-circle">
                <i class="fa-solid fa-bone"></i>
              </span>
              <span>ĐỒ DÙNG & PHỤ KIỆN</span>
              <span class="badge bg-danger text-white pill-hot small">Sale</span>
            </a>
          </div>

          <!-- Quick Benefits / Guarantees -->
          <div class="d-none d-lg-flex align-items-center gap-4 small text-muted">
            <span class="d-flex align-items-center gap-1">
              <i class="fa-solid fa-shield-heart text-success"></i> Bảo hành thuần chủng 100%
            </span>
            <span class="d-flex align-items-center gap-1">
              <i class="fa-solid fa-stethoscope text-primary"></i> Đã tiêm ngừa 2 mũi
            </span>
            <span class="d-flex align-items-center gap-1">
              <i class="fa-solid fa-repeat text-warning"></i> Đổi trả hàng lỗi 7 ngày
            </span>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .nav-tabs-wrapper {
      box-shadow: inset 0 -1px 0 rgba(0,0,0,0.05);
    }
    .main-tab-btn {
      color: #495057;
      background-color: #f8f9fa;
      border: 1px solid #e9ecef;
      font-size: 0.95rem;
      transition: all 0.25s ease;

      &:hover {
        background-color: #f1f3f5;
        transform: translateY(-1px);
      }
    }
    .active-pet-tab {
      background: linear-gradient(135deg, #ff7a00 0%, #ff5722 100%) !important;
      color: #fff !important;
      border-color: #ff5722 !important;
      box-shadow: 0 4px 12px rgba(255, 122, 0, 0.35);

      .tab-icon-badge {
        background-color: rgba(255, 255, 255, 0.25) !important;
      }
    }
    .active-supply-tab {
      background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%) !important;
      color: #fff !important;
      border-color: #0d6efd !important;
      box-shadow: 0 4px 12px rgba(13, 110, 253, 0.35);

      .tab-icon-badge {
        background-color: rgba(255, 255, 255, 0.25) !important;
      }
    }
    .tab-icon-badge {
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
    }
    .bg-orange {
      background-color: #ff7a00;
    }
    .bg-blue {
      background-color: #0d6efd;
    }
    .pill-hot {
      font-size: 0.65rem;
      padding: 2px 5px;
    }
  `]
})
export class NavbarComponent implements OnInit {
  categories: Category[] = [];

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe(res => {
      this.categories = res;
    });
  }
}
