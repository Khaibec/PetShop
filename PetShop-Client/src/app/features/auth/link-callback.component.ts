import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-link-callback',
  template: `
    <div class="container my-5 py-5">
      <div class="row justify-content-center">
        <div class="col-12 col-md-6 col-lg-5 text-center">
          <div class="card border-0 shadow-sm rounded-4 p-5 bg-white">
            <!-- Success State -->
            <div *ngIf="isSuccess">
              <div class="mb-3">
                <i class="fa-solid fa-circle-check text-success" style="font-size: 3.5rem;"></i>
              </div>
              <h4 class="fw-bold text-success mb-2">Liên kết thành công!</h4>
              <p class="text-muted small mb-4">
                Tài khoản <strong>{{ provider }}</strong> đã được liên kết thành công với tài khoản PetShop của bạn.
                Đang chuyển hướng về trang cài đặt...
              </p>
              <button (click)="goToSettings()" class="btn btn-primary rounded-pill px-4">
                Về Cài Đặt Tài Khoản Ngay
              </button>
            </div>

            <!-- Error State -->
            <div *ngIf="!isSuccess">
              <div class="mb-3">
                <i class="fa-solid fa-circle-exclamation text-danger" style="font-size: 3.5rem;"></i>
              </div>
              <h4 class="fw-bold text-danger mb-2">Liên kết thất bại</h4>
              <p class="text-muted small mb-4">
                {{ errorMessage || 'Không thể liên kết tài khoản vào lúc này. Vui lòng thử lại sau.' }}
              </p>
              <button (click)="goToSettings()" class="btn btn-outline-danger rounded-pill px-4">
                Quay lại Cài Đặt Tài Khoản
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LinkCallbackComponent implements OnInit {
  isSuccess = false;
  errorMessage = '';
  provider = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.provider = params['provider'] || '';
      const success = params['success'];
      const error = params['error'];

      if (success === 'true') {
        this.isSuccess = true;
        setTimeout(() => {
          this.goToSettings();
        }, 2200);
      } else {
        this.isSuccess = false;
        this.errorMessage = error ? decodeURIComponent(error) : 'Liên kết tài khoản thất bại.';
      }
    });
  }

  goToSettings(): void {
    this.router.navigate(['/profile/settings']);
  }
}
