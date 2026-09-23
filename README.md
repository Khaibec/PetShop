# 🐾 PetShop - Nền Tảng Thương Mại Điện Tử Thú Cưng & Đồ Dùng Thú Cưng

Hệ thống website thương mại điện tử chuyên nghiệp theo phong cách **Shopee / Lazada**, được xây dựng trên nền tảng công nghệ hiện đại: **.NET 10 Web API**, **Angular 12 SPA**, và cơ sở dữ liệu **SQL Server (PetShopDb)**.

---

## 🌟 Tính Năng Nổi Bật

### 1. Phân Tách 2 Tab Chuyên Biệt Nổi Bật:
- **🐶 Tab 1: Thú Cưng (Pets)**:
  - Danh sách các bé cún & mèo thuần chủng (Corgi, Poodle, Golden, Aln, Ragdoll, Scottish Fold, v.v.).
  - Bộ lọc đa năng: Loài (Chó/Mèo), Giới tính (Đực/Cái), Khoảng giá, Tình trạng (Sẵn sàng đón, Đã cọc, Đã bán).
  - Chi tiết thú cưng: Album ảnh đa góc, tháng tuổi, cân nặng, sổ tiêm chủng 2 mũi, bảo hành sức khỏe Care/Parvo 30 ngày.
  - Tính năng "Đón Bé Ngay" (Đặt cọc giữ chỗ qua giỏ hàng).
- **🛒 Tab 2: Đồ Dùng & Phụ Kiện (Supplies)**:
  - Danh mục đa dạng: Thức ăn dinh dưỡng, Đồ chơi, Chuồng nệm, Vệ sinh & Spa.
  - Bộ lọc theo Danh mục, Thương hiệu (Royal Canin, Whiskas, Orijen, KONG, Furminator, SOS,...), Khoảng giá, Còn hàng.
  - Chi tiết sản phẩm: Đánh giá sao, số lượng đã bán, tồn kho, chọn số lượng mua, mô tả chi tiết.

### 2. Trải Nghiệm Mua Sắm Chuẩn Thương Mại Điện Tử (Shopee/Lazada):
- **Trang chủ sống động**:
  - Banner Carousel chuyển động mượt mà với các chương trình khuyến mãi.
  - Danh mục nhanh hình tròn bắt mắt.
  - Dual Showcase: Box thú cưng mới về & Box phụ kiện bán chạy.
  - Tìm kiếm thời gian thực với các gợi ý từ khóa hot.
- **Giỏ Hàng (Cart)**:
  - Quản lý giỏ hàng thông minh (phân biệt Thú cưng là cá thể độc nhất số lượng 1, Phụ kiện tăng giảm số lượng theo tồn kho).
  - Đồng bộ tự động với `localStorage`.
  - Áp dụng mã giảm giá voucher (`PETSHOP50K` giảm 50.000đ, `FREESHIP` miễn phí ship 30.000đ).
- **Quy Trình Đặt Hàng (Checkout Flow)**:
  - Điền thông tin nhận hàng với form validation chuẩn chỉnh.
  - Chọn phương thức thanh toán: **COD (Nhận hàng thanh toán)** hoặc **Chuyển khoản ngân hàng (VietQR)**.
  - Màn hình thông báo đặt hàng thành công chi tiết kèm mã vận đơn.
- **Lịch Sử & Theo Dõi Đơn Hàng (Orders Tracking)**:
  - Tabs trạng thái Shopee: Tất cả, Chờ xác nhận, Đang giao hàng, Hoàn tất, Đã hủy.
  - Xem chi tiết từng đơn hàng, danh sách món và địa chỉ giao hàng.

### 3. Xác Thực & Phân Quyền Người Dùng:
- Đăng nhập & Đăng ký bảo mật với JWT Bearer Token và mã hóa mật khẩu BCrypt.
- Có sẵn nút **Đăng nhập nhanh 1-Click** cho tài khoản mẫu:
  - 👑 **Admin**: `admin@petshop.com` / `Admin@123`
  - 👤 **Khách hàng**: `user@petshop.com` / `User@123`

### 4. Phân Hệ Quản Trị Hoàn Chỉnh (Admin Portal):
- **Dashboard**: Thống kê tổng doanh thu, tổng số đơn, đơn chờ duyệt, số thú cưng sẵn sàng, 5 đơn hàng mới nhất.
- **Quản lý Đơn hàng**: Chuyển trạng thái đơn (Xác nhận, Giao hàng, Hoàn tất, Hủy đơn).
- **Quản lý Thú cưng**: Thêm bé mới, cập nhật tình trạng (Available, Reserved, Sold), xóa thú cưng.
- **Quản lý Sản phẩm**: Thêm sản phẩm mới, cập nhật tồn kho, xóa sản phẩm.

---

## ⚡ Các Kỹ Thuật Tối Ưu Tốc Độ Tải Trang Đã Áp Dụng

1. **Lazy Loading**: Chia toàn bộ ứng dụng Angular thành các feature module độc lập (`PetsModule`, `ProductsModule`, `HomeModule`, `CartModule`, `CheckoutModule`, `OrdersModule`, `AuthModule`, `AdminModule`), chỉ tải mã nguồn khi người dùng mở trang.
2. **Code Splitting & Bundle Optimization**: Initial bundle của Angular chỉ nặng **~359 kB**, tải cực nhanh trong tích tắc.
3. **Preloading Strategy**: Cấu hình `PreloadAllModules` tải ngầm các route sau khi trang chủ đã hiển thị xong.
4. **ChangeDetectionStrategy.OnPush**: Áp dụng cho các card hiển thị danh sách (`PetCardComponent`, `ProductCardComponent`, `RatingStarsComponent`) giúp loại bỏ hoàn toàn các chu kỳ re-render DOM thừa.
5. **trackBy function in `*ngFor`**: Dùng `trackById` trên mọi vòng lặp danh sách.
6. **Native Image Lazy Loading**: Thẻ `<img>` tích hợp `loading="lazy"` tự động hoãn tải ảnh ngoài màn hình nhìn thấy.
7. **EF Core Optimization**:
   - Dùng `AsNoTracking()` cho 100% truy vấn đọc dữ liệu.
   - Dùng Projections (`Select`) lấy đúng các trường cần thiết, không dư thừa byte truyền qua mạng.
   - Ngăn ngừa N+1 queries bằng `Include()`.
8. **Database Indexing**: Tạo indexes trên SQL Server `PetShopDb` cho các cột hay lọc/sắp xếp (`CategoryId`, `Price`, `Brand`, `Species`, `Breed`, `Status`, `CreatedAt`).
9. **API Response Compression**: Bật đồng thời `Brotli` và `Gzip` nén dữ liệu API phản hồi từ máy chủ.
10. **Memory Caching**: Tích hợp `IMemoryCache` lưu đệm danh mục và danh sách sản phẩm/thú cưng nổi bật.
11. **API Parallelization**: Sử dụng RxJS `forkJoin` gọi đồng thời các API độc lập khi tải trang chủ.

---

## 🚀 Hướng Dẫn Khởi Chạy Dự Án

### Yêu Cầu Môi Trường:
- **.NET SDK**: 10.0 (hoặc 8.0+)
- **Node.js**: v14+ (khuyến nghị Node 14 cho Angular 12)
- **SQL Server**: Đang chạy với Database `PetShopDb`

### Cách 1: Khởi Chạy Nhanh (Click đúp chuột)
- Chạy file `run-backend.cmd` để bật Backend API trên cổng `http://localhost:5109`.
- Chạy file `run-frontend.cmd` để bật Frontend Angular trên cổng `http://localhost:4200`.

### Cách 2: Khởi Chạy Bằng Dòng Lệnh Terminal

#### 1. Khởi động Backend API:
```bash
cd PetShop.Api
dotnet run
```
API sẽ khởi chạy tại: `http://localhost:5109`
Tài liệu Swagger API: `http://localhost:5109/swagger`

#### 2. Khởi động Frontend Client:
```bash
cd PetShop-Client
npm start
```
Truy cập ứng dụng tại trình duyệt: `http://localhost:4200`

---

## 📂 Dữ Liệu Mẫu (Seed Data Đã Tạo)
- **Categories**: 6 danh mục (Chó cảnh, Mèo cảnh, Thức ăn & Dinh dưỡng, Đồ chơi, Chuồng nệm, Chăm sóc vệ sinh).
- **Products**: 36 sản phẩm chính hãng thực tế (Royal Canin, Pedigree, Whiskas, Orijen, Me-O, KONG, Furminator, Cature, SOS,...).
- **Pets**: 16 bé cún & mèo thuần chủng đáng yêu kèm ảnh HD và giấy kiểm định sức khỏe.
- **Tài khoản**:
  - Admin: `admin@petshop.com` / `Admin@123`
  - User: `user@petshop.com` / `User@123`
