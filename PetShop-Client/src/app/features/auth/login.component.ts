import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoginRequest, RegisterRequest } from '../../core/models/auth.model';

@Component({
  selector: 'app-login',
  template: `
    <div class="container my-5">
      <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-6 col-xl-5">
          <div class="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
            <!-- Brand Logo -->
            <div class="text-center mb-4">
              <div class="logo-box bg-warning-subtle text-warning rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style="width: 55px; height: 55px;">
                <i class="fa-solid fa-paw fs-3"></i>
              </div>
              <h4 class="fw-bold brand-font text-dark mb-1">Chào mừng đến với PetShop</h4>
              <p class="text-muted small">Đăng nhập để trải nghiệm mua sắm và quản lý đơn hàng</p>
            </div>

            <!-- Tab Switch (Login / Register) -->
            <ul class="nav nav-pills nav-fill bg-light rounded-pill p-1 mb-4">
              <li class="nav-item">
                <button class="nav-link rounded-pill py-2 fw-semibold" [class.active]="activeTab === 'login'" (click)="activeTab = 'login'">
                  Đăng Nhập
                </button>
              </li>
              <li class="nav-item">
                <button class="nav-link rounded-pill py-2 fw-semibold" [class.active]="activeTab === 'register'" (click)="activeTab = 'register'">
                  Đăng Ký
                </button>
              </li>
            </ul>

            <!-- Quick Demo Accounts Button Strip -->
            <div *ngIf="activeTab === 'login'" class="bg-light-subtle border rounded-3 p-3 mb-4">
              <small class="fw-bold text-muted d-block mb-2"><i class="fa-solid fa-bolt text-warning me-1"></i> Tài khoản mẫu dùng thử ngay:</small>
              <div class="d-flex gap-2">
                <button (click)="fillAdminAccount()" type="button" class="btn btn-outline-warning btn-sm flex-grow-1 text-dark fw-semibold rounded-pill">
                  👑 Tài khoản Admin
                </button>
                <button (click)="fillUserAccount()" type="button" class="btn btn-outline-primary btn-sm flex-grow-1 fw-semibold rounded-pill">
                  👤 Tài khoản Khách
                </button>
              </div>
            </div>

            <!-- Error message alert -->
            <div *ngIf="errorMessage" class="alert alert-danger py-2 small mb-3">
              {{ errorMessage }}
            </div>

            <!-- LOGIN FORM -->
            <form *ngIf="activeTab === 'login'" (ngSubmit)="onLogin()">
              <div class="mb-3">
                <label class="form-label small fw-bold text-dark">Email hoặc Tên tài khoản</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0"><i class="fa-regular fa-envelope text-muted"></i></span>
                  <input type="text" [(ngModel)]="loginData.usernameOrEmail" name="usernameOrEmail" required
                         class="form-control border-start-0" placeholder="admin@petshop.com hoặc user">
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label small fw-bold text-dark">Mật khẩu</label>
                <div class="input-group">
                  <span class="input-group-text bg-light border-end-0"><i class="fa-solid fa-lock text-muted"></i></span>
                  <input type="password" [(ngModel)]="loginData.password" name="password" required
                         class="form-control border-start-0" placeholder="Nhập mật khẩu">
                </div>
              </div>

              <button type="submit" [disabled]="isLoading" class="btn btn-danger btn-lg w-100 rounded-pill fw-bold shadow-sm mt-3">
                <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                Đăng Nhập
              </button>
            </form>

            <!-- REGISTER FORM -->
            <form *ngIf="activeTab === 'register'" (ngSubmit)="onRegister()">
              <div class="mb-3">
                <label class="form-label small fw-bold text-dark">Họ và Tên</label>
                <input type="text" [(ngModel)]="registerData.fullName" name="fullName" required
                       class="form-control" placeholder="Ví dụ: Lê Thị Hoa">
              </div>

              <div class="mb-3">
                <label class="form-label small fw-bold text-dark">Tên tài khoản</label>
                <input type="text" [(ngModel)]="registerData.username" name="username" required
                       class="form-control" placeholder="Ví dụ: hoale123">
              </div>

              <div class="mb-3">
                <label class="form-label small fw-bold text-dark">Email</label>
                <input type="email" [(ngModel)]="registerData.email" name="email" required
                       class="form-control" placeholder="Ví dụ: hoale@gmail.com">
              </div>

              <div class="mb-3">
                <label class="form-label small fw-bold text-dark">Mật khẩu</label>
                <input type="password" [(ngModel)]="registerData.password" name="password" required
                       class="form-control" placeholder="Tối thiểu 6 ký tự">
              </div>

              <div class="mb-3">
                <label class="form-label small fw-bold text-dark">Số điện thoại</label>
                <input type="tel" [(ngModel)]="registerData.phoneNumber" name="phoneNumber"
                       class="form-control" placeholder="Số điện thoại nhận hàng">
              </div>

              <button type="submit" [disabled]="isLoading" class="btn btn-primary btn-lg w-100 rounded-pill fw-bold shadow-sm mt-3">
                <span *ngIf="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                Tạo Tài Khoản
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .nav-pills .nav-link.active {
      background-color: #ff5722;
      color: #fff;
    }
  `]
})
export class LoginComponent implements OnInit {
  activeTab: 'login' | 'register' = 'login';
  isLoading = false;
  errorMessage = '';
  returnUrl = '/';

  loginData: LoginRequest = {
    usernameOrEmail: '',
    password: ''
  };

  registerData: RegisterRequest = {
    username: '',
    email: '',
    password: '',
    fullName: '',
    phoneNumber: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    if (this.router.url.includes('register')) {
      this.activeTab = 'register';
    }
  }

  fillAdminAccount(): void {
    this.loginData.usernameOrEmail = 'admin@petshop.com';
    this.loginData.password = 'Admin@123';
  }

  fillUserAccount(): void {
    this.loginData.usernameOrEmail = 'user@petshop.com';
    this.loginData.password = 'User@123';
  }

  onLogin(): void {
    this.errorMessage = '';
    if (!this.loginData.usernameOrEmail || !this.loginData.password) {
      this.errorMessage = 'Vui lòng điền đầy đủ tài khoản và mật khẩu.';
      return;
    }

    this.isLoading = true;
    this.authService.login(this.loginData).subscribe({
      next: user => {
        this.isLoading = false;
        if (user.role === 'Admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigateByUrl(this.returnUrl);
        }
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản và mật khẩu.';
      }
    });
  }

  onRegister(): void {
    this.errorMessage = '';
    if (!this.registerData.username || !this.registerData.email || !this.registerData.password) {
      this.errorMessage = 'Vui lòng điền các trường bắt buộc.';
      return;
    }

    this.isLoading = true;
    this.authService.register(this.registerData).subscribe({
      next: () => {
        this.isLoading = false;
        alert('Đăng ký tài khoản thành công!');
        this.router.navigateByUrl(this.returnUrl);
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Đăng ký không thành công. Email hoặc username có thể đã được sử dụng.';
      }
    });
  }
}
