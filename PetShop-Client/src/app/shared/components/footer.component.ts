import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="bg-dark text-white pt-5 pb-4 mt-5 border-top">
      <div class="container">
        <div class="row g-4 mb-4">
          <!-- Col 1 -->
          <div class="col-12 col-md-4">
            <div class="d-flex align-items-center mb-3">
              <div class="bg-warning text-dark rounded-circle p-2 me-2 d-flex align-items-center justify-content-center" style="width: 38px; height: 38px;">
                <i class="fa-solid fa-paw fs-5"></i>
              </div>
              <h5 class="mb-0 fw-bold brand-font text-white">PetShop.vn</h5>
            </div>
            <p class="text-white-50 small mb-3">
              Hệ thống bán thú cưng thuần chủng và phụ kiện, thức ăn chăm sóc thú cưng uy tín số 1 Việt Nam. Đem lại niềm vui và sự an tâm trọn vẹn cho mọi gia đình yêu thú cưng.
            </p>
            <div class="small text-white-50">
              <p class="mb-1"><i class="fa-solid fa-location-dot me-2 text-danger"></i> 72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP. Hồ Chí Minh</p>
              <p class="mb-1"><i class="fa-solid fa-phone me-2 text-success"></i> Hotline: 1900 8888 (Miễn phí cuộc gọi)</p>
              <p class="mb-0"><i class="fa-solid fa-envelope me-2 text-warning"></i> Email: support&#64;petshop.com</p>
            </div>
          </div>

          <!-- Col 2 -->
          <div class="col-6 col-md-2">
            <h6 class="fw-bold mb-3 text-uppercase small text-white-50">Về Chúng Tôi</h6>
            <ul class="list-unstyled small">
              <li class="mb-2"><a href="#" class="text-white text-decoration-none hover-orange">Giới thiệu PetShop</a></li>
              <li class="mb-2"><a href="#" class="text-white text-decoration-none hover-orange">Quy trình đón bé</a></li>
              <li class="mb-2"><a href="#" class="text-white text-decoration-none hover-orange">Cam kết tiêm chủng</a></li>
              <li class="mb-2"><a href="#" class="text-white text-decoration-none hover-orange">Tuyển dụng</a></li>
              <li class="mb-2"><a href="#" class="text-white text-decoration-none hover-orange">Liên hệ hợp tác</a></li>
            </ul>
          </div>

          <!-- Col 3 -->
          <div class="col-6 col-md-3">
            <h6 class="fw-bold mb-3 text-uppercase small text-white-50">Chính Sách & Hỗ Trợ</h6>
            <ul class="list-unstyled small">
              <li class="mb-2"><a href="#" class="text-white text-decoration-none hover-orange">Chính sách bảo hành 30 ngày</a></li>
              <li class="mb-2"><a href="#" class="text-white text-decoration-none hover-orange">Chính sách vận chuyển</a></li>
              <li class="mb-2"><a href="#" class="text-white text-decoration-none hover-orange">Hướng dẫn mua hàng & COD</a></li>
              <li class="mb-2"><a href="#" class="text-white text-decoration-none hover-orange">Chính sách bảo mật thông tin</a></li>
              <li class="mb-2"><a href="#" class="text-white text-decoration-none hover-orange">Bác sĩ thú y tư vấn 24/7</a></li>
            </ul>
          </div>

          <!-- Col 4 -->
          <div class="col-12 col-md-3">
            <h6 class="fw-bold mb-3 text-uppercase small text-white-50">Phương Thức Thanh Toán</h6>
            <div class="d-flex flex-wrap gap-2 mb-3">
              <span class="badge bg-light text-dark p-2"><i class="fa-solid fa-money-bill-wave me-1 text-success"></i> COD (Nhận hàng)</span>
              <span class="badge bg-light text-dark p-2"><i class="fa-solid fa-building-columns me-1 text-primary"></i> Chuyển khoản</span>
              <span class="badge bg-light text-dark p-2"><i class="fa-solid fa-credit-card me-1 text-warning"></i> Thẻ Visa/Master</span>
            </div>
            <h6 class="fw-bold mb-2 text-uppercase small text-white-50">Kết Nối Với Chúng Tôi</h6>
            <div class="d-flex gap-2">
              <a href="#" class="btn btn-outline-light btn-sm rounded-circle" style="width: 34px; height: 34px;"><i class="fa-brands fa-facebook-f"></i></a>
              <a href="#" class="btn btn-outline-light btn-sm rounded-circle" style="width: 34px; height: 34px;"><i class="fa-brands fa-tiktok"></i></a>
              <a href="#" class="btn btn-outline-light btn-sm rounded-circle" style="width: 34px; height: 34px;"><i class="fa-brands fa-youtube"></i></a>
              <a href="#" class="btn btn-outline-light btn-sm rounded-circle" style="width: 34px; height: 34px;"><i class="fa-brands fa-instagram"></i></a>
            </div>
          </div>
        </div>

        <hr class="border-secondary my-4">

        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-center small text-white-50">
          <p class="mb-0">&copy; 2026 PetShop.vn - Bản quyền thuộc về PetShop E-Commerce System.</p>
          <p class="mb-0">Xây dựng với Angular 12 & .NET 10 & SQL Server</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .hover-orange:hover {
      color: #ff7a00 !important;
      text-decoration: underline !important;
    }
  `]
})
export class FooterComponent {}
