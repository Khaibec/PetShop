import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ExternalAccount, User } from '../../core/models/auth.model';

interface ProviderInfo {
  id: 'Google' | 'Facebook' | 'GitHub';
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  btnClass: string;
  description: string;
}

@Component({
  selector: 'app-profile-settings',
  template: `
    <div class="container my-5">
      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-4">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><a routerLink="/" class="text-decoration-none text-muted">Trang chủ</a></li>
          <li class="breadcrumb-item active text-dark fw-semibold" aria-current="page">Cài đặt tài khoản</li>
        </ol>
      </nav>

      <!-- Page Header -->
      <div class="d-flex align-items-center mb-4">
        <div class="logo-box bg-warning-subtle text-warning rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 50px; height: 50px;">
          <i class="fa-solid fa-user-gear fs-4"></i>
        </div>
        <div>
          <h3 class="fw-bold mb-1">Cài Đặt Tài Khoản</h3>
          <p class="text-muted small mb-0">Quản lý thông tin cá nhân và các tài khoản mạng xã hội liên kết</p>
        </div>
      </div>

      <!-- Alerts -->
      <div *ngIf="successMessage" class="alert alert-success alert-dismissible fade show rounded-3 shadow-sm mb-4" role="alert">
        <i class="fa-solid fa-circle-check me-2"></i> {{ successMessage }}
        <button type="button" class="btn-close" (click)="successMessage = ''" aria-label="Close"></button>
      </div>

      <div *ngIf="errorMessage" class="alert alert-danger alert-dismissible fade show rounded-3 shadow-sm mb-4" role="alert">
        <i class="fa-solid fa-circle-exclamation me-2"></i> {{ errorMessage }}
        <button type="button" class="btn-close" (click)="errorMessage = ''" aria-label="Close"></button>
      </div>

      <div class="row g-4">
        <!-- Profile Overview Card -->
        <div class="col-12 col-lg-5 col-xl-4">
          <div class="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
            <div class="text-center mb-4">
              <div class="position-relative d-inline-block">
                <img *ngIf="user?.avatarUrl; else defaultAvatar"
                     [src]="user?.avatarUrl"
                     alt="Avatar"
                     class="rounded-circle shadow-sm border border-3 border-warning"
                     style="width: 100px; height: 100px; object-fit: cover;">
                <ng-template #defaultAvatar>
                  <div class="bg-light text-secondary rounded-circle d-inline-flex align-items-center justify-content-center border" style="width: 100px; height: 100px;">
                    <i class="fa-solid fa-user fs-1 text-muted"></i>
                  </div>
                </ng-template>
              </div>

              <h5 class="fw-bold mt-3 mb-1 text-dark">{{ user?.fullName || user?.username || 'Người dùng' }}</h5>
              <span class="badge" [ngClass]="user?.role === 'Admin' ? 'bg-danger' : 'bg-primary'">
                <i class="fa-solid" [ngClass]="user?.role === 'Admin' ? 'fa-shield-halved' : 'fa-circle-user'"></i>
                {{ user?.role === 'Admin' ? 'Quản Trị Viên' : 'Khách Hàng' }}
              </span>
            </div>

            <hr class="text-muted opacity-25 my-3">

            <div class="user-details">
              <div class="d-flex align-items-center mb-3">
                <i class="fa-regular fa-envelope text-muted me-3" style="width: 20px;"></i>
                <div>
                  <small class="text-muted d-block">Địa chỉ Email</small>
                  <span class="fw-semibold text-dark">{{ user?.email || 'Chưa cập nhật' }}</span>
                </div>
              </div>

              <div class="d-flex align-items-center mb-3">
                <i class="fa-regular fa-id-badge text-muted me-3" style="width: 20px;"></i>
                <div>
                  <small class="text-muted d-block">Tên đăng nhập</small>
                  <span class="fw-semibold text-dark">{{ user?.username }}</span>
                </div>
              </div>

              <div class="d-flex align-items-center mb-3">
                <i class="fa-solid fa-phone text-muted me-3" style="width: 20px;"></i>
                <div>
                  <small class="text-muted d-block">Số điện thoại</small>
                  <span class="fw-semibold text-dark">{{ user?.phoneNumber || 'Chưa cập nhật' }}</span>
                </div>
              </div>

              <div class="d-flex align-items-center">
                <i class="fa-solid fa-location-dot text-muted me-3" style="width: 20px;"></i>
                <div>
                  <small class="text-muted d-block">Địa chỉ nhận hàng</small>
                  <span class="fw-semibold text-dark">{{ user?.address || 'Chưa cập nhật' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- External Linked Accounts Card -->
        <div class="col-12 col-lg-7 col-xl-8">
          <div class="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white h-100">
            <div class="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h5 class="fw-bold mb-1 text-dark">
                  <i class="fa-solid fa-link text-warning me-2"></i>Liên kết tài khoản
                </h5>
                <p class="text-muted small mb-0">
                  Liên kết tài khoản Google, Facebook, hoặc GitHub.
                </p>
              </div>
              <button (click)="loadExternalAccounts()" class="btn btn-outline-secondary btn-sm rounded-pill" title="Làm mới">
                <i class="fa-solid fa-rotate-right" [class.fa-spin]="isLoadingAccounts"></i>
              </button>
            </div>

            <!-- Provider List -->
            <div class="providers-list d-flex flex-column gap-3">
              <div *ngFor="let p of providers"
                   class="provider-item p-3 rounded-4 border transition-all"
                   [class.bg-light-subtle]="isLinked(p.id)"
                   [class.border-success-subtle]="isLinked(p.id)">
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <!-- Provider Info -->
                  <div class="d-flex align-items-center">
                    <div class="provider-icon rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm"
                         [style.background-color]="p.bgColor"
                         [style.color]="p.color"
                         style="width: 46px; height: 46px;">
                      <i [class]="p.icon" class="fs-4"></i>
                    </div>
                    <div>
                      <h6 class="fw-bold mb-0 text-dark">{{ p.name }}</h6>
                      <div *ngIf="isLinked(p.id); else unlinkedInfo">
                        <small class="text-success fw-semibold">
                          <i class="fa-solid fa-circle-check me-1"></i>Đã liên kết
                        </small>
                        <small *ngIf="getLinkedAccount(p.id)?.providerEmail" class="text-muted ms-2">
                          ({{ getLinkedAccount(p.id)?.providerEmail }})
                        </small>
                      </div>
                      <ng-template #unlinkedInfo>
                        <small class="text-muted">{{ p.description }}</small>
                      </ng-template>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div>
                    <button *ngIf="isLinked(p.id)"
                            type="button"
                            (click)="unlinkAccount(p.id, p.name)"
                            [disabled]="isActionLoading[p.id]"
                            class="btn btn-outline-danger btn-sm rounded-pill px-3 fw-semibold">
                      <span *ngIf="isActionLoading[p.id]" class="spinner-border spinner-border-sm me-1"></span>
                      <i *ngIf="!isActionLoading[p.id]" class="fa-solid fa-link-slash me-1"></i>
                      Hủy liên kết
                    </button>

                    <button *ngIf="!isLinked(p.id)"
                            type="button"
                            (click)="linkAccount(p.id)"
                            [disabled]="isActionLoading[p.id]"
                            [class]="p.btnClass"
                            class="btn btn-sm rounded-pill px-3 fw-semibold shadow-sm">
                      <span *ngIf="isActionLoading[p.id]" class="spinner-border spinner-border-sm me-1"></span>
                      <i *ngIf="!isActionLoading[p.id]" class="fa-solid fa-plus me-1"></i>
                      Liên kết ngay
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Security Note -->
            <div class="alert alert-light border rounded-3 mt-4 mb-0 small text-muted">
              <i class="fa-solid fa-shield-halved text-primary me-2"></i>
              <strong>Bảo mật:</strong> PetShop chỉ sử dụng quyền xác thực cơ bản (email và tên hiển thị). Chúng tôi không bao giờ đăng bài hoặc can thiệp vào tài khoản cá nhân của bạn.
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .provider-item {
      transition: all 0.2s ease-in-out;
    }
    .provider-item:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border-color: #dee2e6;
    }
    .border-success-subtle {
      border-color: #badbcc !important;
    }
  `]
})
export class ProfileSettingsComponent implements OnInit {
  user: User | null = null;
  linkedAccounts: ExternalAccount[] = [];
  isLoadingAccounts = false;
  successMessage = '';
  errorMessage = '';

  isActionLoading: { [key: string]: boolean } = {
    Google: false,
    Facebook: false,
    GitHub: false
  };

  providers: ProviderInfo[] = [
    {
      id: 'Google',
      name: 'Google',
      icon: 'fa-brands fa-google',
      color: '#DB4437',
      bgColor: '#feebe8',
      btnClass: 'btn-outline-danger',
      description: 'Đăng nhập nhanh với tài khoản Google'
    },
    {
      id: 'Facebook',
      name: 'Facebook',
      icon: 'fa-brands fa-facebook',
      color: '#1877F2',
      bgColor: '#e7f0fd',
      btnClass: 'btn-outline-primary',
      description: 'Kết nối bằng tài khoản Facebook'
    },
    {
      id: 'GitHub',
      name: 'GitHub',
      icon: 'fa-brands fa-github',
      color: '#24292e',
      bgColor: '#f0f1f2',
      btnClass: 'btn-outline-dark',
      description: 'Dành cho lập trình viên và nhà phát triển'
    }
  ];

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const errorParam = params['error'];
      if (errorParam) {
        this.errorMessage = decodeURIComponent(errorParam);
      }
      const successParam = params['success'];
      if (successParam) {
        this.successMessage = decodeURIComponent(successParam);
      }
    });

    this.loadUserProfile();
    this.loadExternalAccounts();
  }

  loadUserProfile(): void {
    this.authService.getCurrentUser().subscribe({
      next: data => {
        this.user = data;
      },
      error: () => {
        // Fallback from localStorage
        const local = this.authService.currentUserValue;
        if (local) {
          this.user = {
            id: local.userId,
            username: local.username,
            email: local.email,
            fullName: local.fullName,
            role: local.role
          };
        }
      }
    });
  }

  loadExternalAccounts(): void {
    this.isLoadingAccounts = true;
    this.authService.getExternalAccounts().subscribe({
      next: accounts => {
        this.linkedAccounts = accounts || [];
        this.isLoadingAccounts = false;
      },
      error: () => {
        this.isLoadingAccounts = false;
      }
    });
  }

  isLinked(providerId: string): boolean {
    return this.linkedAccounts.some(a => a.provider.toLowerCase() === providerId.toLowerCase());
  }

  getLinkedAccount(providerId: string): ExternalAccount | undefined {
    return this.linkedAccounts.find(a => a.provider.toLowerCase() === providerId.toLowerCase());
  }

  linkAccount(providerId: 'Google' | 'Facebook' | 'GitHub'): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isActionLoading[providerId] = true;

    this.authService.initiateLinkExternal(providerId).subscribe({
      next: res => {
        if (res && res.redirectUrl) {
          window.location.href = res.redirectUrl;
        } else {
          this.isActionLoading[providerId] = false;
          this.errorMessage = 'Không nhận được đường dẫn liên kết từ máy chủ.';
        }
      },
      error: err => {
        this.isActionLoading[providerId] = false;
        this.errorMessage = err.error?.message || `Không thể khởi tạo liên kết với ${providerId}. Vui lòng thử lại.`;
      }
    });
  }

  unlinkAccount(providerId: string, providerName: string): void {
    this.errorMessage = '';
    this.successMessage = '';

    const confirmed = window.confirm(`Bạn có chắc chắn muốn hủy liên kết tài khoản ${providerName} không?`);
    if (!confirmed) {
      return;
    }

    this.isActionLoading[providerId] = true;
    this.authService.unlinkExternalAccount(providerId).subscribe({
      next: () => {
        this.isActionLoading[providerId] = false;
        this.successMessage = `Đã hủy liên kết tài khoản ${providerName} thành công.`;
        this.loadExternalAccounts();
      },
      error: err => {
        this.isActionLoading[providerId] = false;
        this.errorMessage = err.error?.message || `Hủy liên kết ${providerName} thất bại.`;
      }
    });
  }
}
