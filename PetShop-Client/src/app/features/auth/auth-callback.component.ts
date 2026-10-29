import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthResponse } from '../../core/models/auth.model';

@Component({
  selector: 'app-auth-callback',
  template: `
    <div class="container my-5 py-5">
      <div class="row justify-content-center">
        <div class="col-12 col-md-6 col-lg-5 text-center">
          <div class="card border-0 shadow-sm rounded-4 p-5 bg-white">
            <div>
              <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <h5 class="fw-bold mb-2">Đang xử lý đăng nhập...</h5>
              <p class="text-muted small">Vui lòng chờ trong giây lát trong khi chúng tôi hoàn tất quá trình xác thực.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const error = params['error'];
      if (error) {
        // Khi xảy ra lỗi hoặc người dùng từ chối, chuyển hướng ngay về trang đăng nhập
        this.router.navigate(['/auth/login'], {
          queryParams: { error: error }
        });
        return;
      }

      const token = params['token'];
      if (token) {
        const authData: AuthResponse = {
          token: token,
          userId: Number(params['userId']) || 0,
          username: params['username'] || '',
          email: params['email'] || '',
          fullName: params['fullName'] || '',
          role: (params['role'] === 'Admin' ? 'Admin' : 'User'),
          expiresAt: params['expiresAt'] || ''
        };

        this.authService.handleExternalLoginCallback(authData);

        const returnUrl = params['returnUrl'];
        setTimeout(() => {
          if (returnUrl && returnUrl !== '/' && !returnUrl.startsWith('http')) {
            this.router.navigateByUrl(returnUrl);
          } else if (authData.role === 'Admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/']);
          }
        }, 500);
      } else {
        // Không có token hợp lệ -> điều hướng về trang đăng nhập kèm lỗi
        this.router.navigate(['/auth/login'], {
          queryParams: { error: 'Không tìm thấy thông tin xác thực từ máy chủ hoặc bạn đã hủy đăng nhập.' }
        });
      }
    });
  }
}
