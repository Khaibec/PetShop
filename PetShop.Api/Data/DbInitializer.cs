using Microsoft.EntityFrameworkCore;
using PetShop.Api.Models;

namespace PetShop.Api.Data;

public static class DbInitializer
{
    public static void Initialize(PetShopDbContext context)
    {
        context.Database.Migrate();

        // 1. Seed tài khoản liên kết OAuth thử nghiệm (idempotent, không tạo duplicate)
        SeedExternalAccounts(context);

        // 2. Seed dữ liệu hội thoại chat mẫu (idempotent)
        SeedChatData(context);

        // 3. Kiểm tra nếu đã có dữ liệu catalog thì không seed lại
        if (context.Categories.Any())
        {
            return;
        }

        // 2. Seed Users
        var adminPasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123");
        var userPasswordHash = BCrypt.Net.BCrypt.HashPassword("User@123");

        var users = new List<User>
        {
            new User
            {
                Username = "admin",
                Email = "admin@petshop.com",
                PasswordHash = adminPasswordHash,
                FullName = "Quản Trị Viên PetShop",
                PhoneNumber = "0988888888",
                Address = "72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP. Hồ Chí Minh",
                Role = "Admin",
                CreatedAt = DateTime.UtcNow
            },
            new User
            {
                Username = "user",
                Email = "user@petshop.com",
                PasswordHash = userPasswordHash,
                FullName = "Nguyễn Văn An",
                PhoneNumber = "0912345678",
                Address = "123 Nguyễn Trãi, Thanh Xuân, Hà Nội",
                Role = "User",
                CreatedAt = DateTime.UtcNow
            }
        };
        context.Users.AddRange(users);
        context.SaveChanges();

        // 3. Seed Categories
        var catCho = new Category
        {
            Name = "Chó Cảnh",
            Slug = "cho-canh",
            Type = "Pet",
            Icon = "fa-dog",
            Description = "Các giống chó cảnh thuần chủng, khỏe mạnh, đã tiêm chủng đầy đủ.",
            ImageUrl = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80",
            DisplayOrder = 1
        };

        var catMeo = new Category
        {
            Name = "Mèo Cảnh",
            Slug = "meo-canh",
            Type = "Pet",
            Icon = "fa-cat",
            Description = "Những bé mèo đáng yêu, tinh nghịch, nguồn gốc rõ ràng, bảo hành sức khỏe.",
            ImageUrl = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80",
            DisplayOrder = 2
        };

        var catThucAn = new Category
        {
            Name = "Thức Ăn & Dinh Dưỡng",
            Slug = "thuc-an-dinh-duong",
            Type = "Supply",
            Icon = "fa-bowl-food",
            Description = "Hạt khô, pate, sữa bột và thức ăn dinh dưỡng từ các thương hiệu hàng đầu thế giới.",
            ImageUrl = "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=600&q=80",
            DisplayOrder = 3
        };

        var catDoChoi = new Category
        {
            Name = "Đồ Chơi Thú Cưng",
            Slug = "do-choi-thu-cung",
            Type = "Supply",
            Icon = "fa-baseball-bat-ball",
            Description = "Đồ chơi gặm, banh ném, trụ cào móng, cần câu mèo giúp thú cưng vận động thông minh.",
            ImageUrl = "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=600&q=80",
            DisplayOrder = 4
        };

        var catPhuKien = new Category
        {
            Name = "Chuồng, Nệm & Phụ Kiện",
            Slug = "chuong-nem-phu-kien",
            Type = "Supply",
            Icon = "fa-bed",
            Description = "Chuồng sắt, nệm êm ái, dây dắt, balo phi hành gia, chén ăn bát uống tự động.",
            ImageUrl = "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=600&q=80",
            DisplayOrder = 5
        };

        var catSucKhoe = new Category
        {
            Name = "Chăm Sóc & Vệ Sinh",
            Slug = "cham-soc-suc-khoe-ve-sinh",
            Type = "Supply",
            Icon = "fa-pump-soap",
            Description = "Sữa tắm chuyên dụng, cát vệ sinh khử mùi, dung dịch nhỏ mắt mũi tai, lược chải lông.",
            ImageUrl = "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=600&q=80",
            DisplayOrder = 6
        };

        var categories = new List<Category> { catCho, catMeo, catThucAn, catDoChoi, catPhuKien, catSucKhoe };
        context.Categories.AddRange(categories);
        context.SaveChanges();

        // 4. Seed Pets (16 bé Chó & Mèo xinh xắn, khỏe mạnh)
        var pets = new List<Pet>
        {
            new Pet
            {
                Name = "Cún Corgi Fluffy Mông Trái Tim",
                Breed = "Corgi Pembroke",
                Species = "Chó",
                AgeMonths = 2,
                Gender = "Đực",
                Color = "Vàng Trắng",
                WeightKg = 2.8m,
                Price = 12500000m,
                OriginalPrice = 14000000m,
                Vaccinated = true,
                Dewormed = true,
                HealthCertificate = "Sổ tiêm 2 mũi Vanguard 7 bệnh, Microchip định danh, Bảo hành Care & Parvo 30 ngày",
                Status = "Available",
                ImageUrl = "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80",
                AdditionalImagesJson = "[\"https://images.unsplash.com/photo-1612940960267-4549a58fb758?auto=format&fit=crop&w=800&q=80\"]",
                Description = "Bé Corgi thuần chủng chân ngắn mông to, tính tình năng động thân thiện, ăn uống cực khỏe, đã tiêm chủng 2 mũi định kỳ.",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Pet
            {
                Name = "Poodle Tiny Trắng Tuyết Baby",
                Breed = "Poodle Tiny",
                Species = "Chó",
                AgeMonths = 3,
                Gender = "Cái",
                Color = "Trắng Tinh Khôi",
                WeightKg = 1.2m,
                Price = 6500000m,
                OriginalPrice = 7500000m,
                Vaccinated = true,
                Dewormed = true,
                HealthCertificate = "Sổ tiêm 2 mũi 5 bệnh Merial (Pháp), tẩy giun 3 lần",
                Status = "Available",
                ImageUrl = "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80",
                Description = "Poodle size Tiny siêu nhỏ nhắn, lông xoăn tít dày mượt, mặt gấu xinh xắn, biết đi vệ sinh đúng khay cát.",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Pet
            {
                Name = "Golden Retriever Đại Sứ Nụ Cười",
                Breed = "Golden Retriever",
                Species = "Chó",
                AgeMonths = 2,
                Gender = "Đực",
                Color = "Vàng Kim",
                WeightKg = 4.5m,
                Price = 9000000m,
                OriginalPrice = 10500000m,
                Vaccinated = true,
                Dewormed = true,
                HealthCertificate = "Sổ tiêm 2 mũi Zoetis, gắn chip định danh quốc tế",
                Status = "Available",
                ImageUrl = "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80",
                Description = "Giống chó gia đình số 1 thế giới, thông minh tuyệt đỉnh, cực kỳ yêu trẻ con và thích làm nũng.",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Pet
            {
                Name = "Shiba Inu Mặt Bánh Bao Nhật Bản",
                Breed = "Shiba Inu",
                Species = "Chó",
                AgeMonths = 3,
                Gender = "Cái",
                Color = "Vàng Đỏ (Red)",
                WeightKg = 3.2m,
                Price = 16000000m,
                OriginalPrice = 18000000m,
                Vaccinated = true,
                Dewormed = true,
                HealthCertificate = "Phả hệ VKA chuẩn, Sổ tiêm đủ 2 mũi, Giấy kiểm định sức khỏe",
                Status = "Available",
                ImageUrl = "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80",
                Description = "Bé Shiba Inu thuần chủng mang nụ cười triệu view của Nhật Bản, tính cách độc lập, ưa sạch sẽ.",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Pet
            {
                Name = "Husky Siberian Mắt Xanh Băng Giá",
                Breed = "Husky Siberian",
                Species = "Chó",
                AgeMonths = 2,
                Gender = "Đực",
                Color = "Xám Trắng",
                WeightKg = 5.0m,
                Price = 8500000m,
                OriginalPrice = 9500000m,
                Vaccinated = true,
                Dewormed = true,
                HealthCertificate = "Tiêm phòng 2 mũi vacxin Mỹ, bảo hành bệnh 45 ngày",
                Status = "Available",
                ImageUrl = "https://images.unsplash.com/photo-1605568427561-40dd23c2acea?auto=format&fit=crop&w=800&q=80",
                Description = "Đôi mắt xanh biếc hút hồn, tính tình hài hước hiếu động, khung xương to chuẩn ngực nở.",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Pet
            {
                Name = "Phốc Sóc Pomeranian Mặt Gấu Siêu Cưng",
                Breed = "Pomeranian (Phốc Sóc)",
                Species = "Chó",
                AgeMonths = 2,
                Gender = "Cái",
                Color = "Vàng Cam (Party)",
                WeightKg = 0.9m,
                Price = 7800000m,
                OriginalPrice = 8800000m,
                Vaccinated = true,
                Dewormed = true,
                HealthCertificate = "Đã tiêm phòng 2 mũi, tẩy giun sạch sẽ, cam kết thuần chủng trọn đời",
                Status = "Available",
                ImageUrl = "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=800&q=80",
                Description = "Phốc sóc mặt gấu cực kỳ đáng yêu, bộ lông 2 lớp bồng bềnh như cục bông gòn di động.",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Pet
            {
                Name = "Samoyed Công Chúa Tuyết Bắc Cực",
                Breed = "Samoyed",
                Species = "Chó",
                AgeMonths = 3,
                Gender = "Cái",
                Color = "Trắng Bông",
                WeightKg = 5.8m,
                Price = 11000000m,
                OriginalPrice = 12500000m,
                Vaccinated = true,
                Dewormed = true,
                HealthCertificate = "Sổ tiêm 2 mũi đầy đủ, xét nghiệm âm tính Care, Parvo",
                Status = "Available",
                ImageUrl = "https://images.unsplash.com/photo-1529429617124-95b109e86bb8?auto=format&fit=crop&w=800&q=80",
                Description = "Bộ lông trắng muốt như tuyết, nụ cười Samoyed trứ danh làm tan chảy mọi trái tim.",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Pet
            {
                Name = "Pug Mặt Xệ Tinh Nghịch",
                Breed = "Pug",
                Species = "Chó",
                AgeMonths = 2,
                Gender = "Đực",
                Color = "Vàng Ánh Nâu (Fawn)",
                WeightKg = 3.0m,
                Price = 5800000m,
                OriginalPrice = 6800000m,
                Vaccinated = true,
                Dewormed = true,
                HealthCertificate = "Sổ tiêm ngừa 2 mũi, sổ theo dõi sức khỏe định kỳ",
                Status = "Available",
                ImageUrl = "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80",
                Description = "Mặt xệ đáng yêu với đôi mắt tròn xoe ngây thơ, tính tình hiền lành, rất quấn chủ.",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            // MÈO CẢNH
            new Pet
            {
                Name = "Mèo Anh Lông Ngắn (Aln) Xám Xanh Classic",
                Breed = "British Shorthair (Aln)",
                Species = "Mèo",
                AgeMonths = 2,
                Gender = "Đực",
                Color = "Xám Xanh (Blue)",
                WeightKg = 1.4m,
                Price = 7500000m,
                OriginalPrice = 8500000m,
                Vaccinated = true,
                Dewormed = true,
                HealthCertificate = "Sổ tiêm 2 mũi 4 bệnh phòng ngừa dại và giảm bạch cầu, tẩy giun đầy đủ",
                Status = "Available",
                ImageUrl = "https://images.unsplash.com/photo-1513360309081-38f07627399e?auto=format&fit=crop&w=800&q=80",
                Description = "Bé Aln má phính tròn xoe, màu xám xanh huyền thoại, mắt màu hổ phách tuyệt đẹp.",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Pet
            {
                Name = "Mèo Ragdoll Mắt Xanh Đại Dương",
                Breed = "Ragdoll",
                Species = "Mèo",
                AgeMonths = 3,
                Gender = "Cái",
                Color = "Seal Point Bicolor",
                WeightKg = 1.8m,
                Price = 18500000m,
                OriginalPrice = 21000000m,
                Vaccinated = true,
                Dewormed = true,
                HealthCertificate = "Gia phả WCF quốc tế, tiêm ngừa 2 mũi vacxin Purevax, xét nghiệm PCR âm tính FPV/FIP",
                Status = "Available",
                ImageUrl = "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=800&q=80",
                Description = "Được mệnh danh là 'cún con đội lốt mèo', Ragdoll cực kỳ ngoan ngoãn, thích được ôm ấp và âu yếm.",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Pet
            {
                Name = "Mèo Scottish Fold Tai Cụp Siêu Đáng Yêu",
                Breed = "Scottish Fold",
                Species = "Mèo",
                AgeMonths = 2,
                Gender = "Cái",
                Color = "Trắng Bạc (Silver Tabby)",
                WeightKg = 1.3m,
                Price = 9200000m,
                OriginalPrice = 10500000m,
                Vaccinated = true,
                Dewormed = true,
                HealthCertificate = "Sổ tiêm chủng 2 mũi, cam kết tai cụp sát đầu, không thoái hóa khớp",
                Status = "Available",
                ImageUrl = "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=800&q=80",
                Description = "Đôi tai cụp sát đầu tròn trịa như quả bóng, tính cách điềm đạm, thích nằm cạnh chủ.",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Pet
            {
                Name = "Mèo Ba Tư Lông Dài Hoàng Gia",
                Breed = "Persian Cat",
                Species = "Mèo",
                AgeMonths = 3,
                Gender = "Đực",
                Color = "Trắng Muốt",
                WeightKg = 1.7m,
                Price = 8000000m,
                OriginalPrice = 9000000m,
                Vaccinated = true,
                Dewormed = true,
                HealthCertificate = "Tiêm đủ 2 mũi vacxin, bảo hành sức khỏe toàn diện 30 ngày",
                Status = "Available",
                ImageUrl = "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=800&q=80",
                Description = "Bộ lông dài quý tộc thướt tha, thần thái sang chảnh nhẹ nhàng, thích không gian yên tĩnh.",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Pet
            {
                Name = "Mèo Munchkin Chân Ngắn Lùn Tịt",
                Breed = "Munchkin",
                Species = "Mèo",
                AgeMonths = 2,
                Gender = "Cái",
                Color = "Golden NY11",
                WeightKg = 1.1m,
                Price = 17000000m,
                OriginalPrice = 19500000m,
                Vaccinated = true,
                Dewormed = true,
                HealthCertificate = "Giấy chứng nhận tiêm phòng 2 mũi, microchip gắn dưới da",
                Status = "Available",
                ImageUrl = "https://images.unsplash.com/photo-1561948955-570b270e7c36?auto=format&fit=crop&w=800&q=80",
                Description = "Đôi chân ngắn tủn mủn bước đi lắc lư cực kỳ ngộ nghĩnh, màu lông vàng ánh kim cực phẩm.",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Pet
            {
                Name = "Mèo Anh Lông Dài (Ald) Bicolor Tinh Anh",
                Breed = "British Longhair (Ald)",
                Species = "Mèo",
                AgeMonths = 3,
                Gender = "Đực",
                Color = "Bicolor Xám Trắng",
                WeightKg = 1.6m,
                Price = 8800000m,
                OriginalPrice = 9800000m,
                Vaccinated = true,
                Dewormed = true,
                HealthCertificate = "Sổ tiêm 2 mũi, kiểm tra sức khỏe tổng quát",
                Status = "Available",
                ImageUrl = "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=800&q=80",
                Description = "Lông dài bồng bềnh, mảng màu cân đối chuẩn chữ V ngược trên trán, ăn khỏe.",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Pet
            {
                Name = "Mèo Bengal Báo Đốm Hoang Dã Nhỏ",
                Breed = "Bengal",
                Species = "Mèo",
                AgeMonths = 3,
                Gender = "Đực",
                Color = "Nâu Báo Đốm (Brown Rosette)",
                WeightKg = 2.0m,
                Price = 15000000m,
                OriginalPrice = 17500000m,
                Vaccinated = true,
                Dewormed = true,
                HealthCertificate = "Sổ tiêm chủng 2 mũi phòng bệnh, cam kết không lai tạp",
                Status = "Available",
                ImageUrl = "https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?auto=format&fit=crop&w=800&q=80",
                Description = "Họa tiết hoa hồng đốm báo tuyệt đẹp, thể lực vượt trội, thích chơi đùa với nước và leo trèo.",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Pet
            {
                Name = "Mèo Xiêm Thái (Siamese) Cổ Điển",
                Breed = "Siamese",
                Species = "Mèo",
                AgeMonths = 2,
                Gender = "Cái",
                Color = "Seal Point",
                WeightKg = 1.2m,
                Price = 4500000m,
                OriginalPrice = 5200000m,
                Vaccinated = true,
                Dewormed = true,
                HealthCertificate = "Tiêm phòng 1 mũi, tẩy giun định kỳ",
                Status = "Available",
                ImageUrl = "https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=800&q=80",
                Description = "Mặt tam giác đen đặc trưng, đôi mắt xanh thẳm huyền bí, rất thông minh và biết gọi chủ.",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            }
        };

        context.Pets.AddRange(pets);
        context.SaveChanges();

        // 5. Seed Products (38 sản phẩm đa dạng gồm Thức ăn, Đồ chơi, Phụ kiện, Chăm sóc)
        var products = new List<Product>
        {
            // --- THỨC ĂN & DINH DƯỠNG (CategoryId = catThucAn.Id) ---
            new Product
            {
                Name = "Thức Ăn Hạt Khô Royal Canin Mini Puppy Cho Chó Con",
                Slug = "thuc-an-hat-royal-canin-mini-puppy",
                Description = "Hạt dinh dưỡng chuyên biệt dành riêng cho chó con giống nhỏ (dưới 10 tháng tuổi). Bổ sung DHA phát triển trí não và phức hợp chống oxy hóa tăng cường hệ miễn dịch non nớt.",
                Price = 320000m,
                OriginalPrice = 360000m,
                Stock = 150,
                Brand = "Royal Canin",
                CategoryId = catThucAn.Id,
                Rating = 4.9,
                ReviewCount = 84,
                SoldQuantity = 520,
                ImageUrl = "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=800&q=80",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Hạt Khô Cho Mèo Royal Canin Kitten Dưới 12 Tháng",
                Slug = "hat-kho-cho-meo-royal-canin-kitten",
                Description = "Dinh dưỡng tối ưu cho mèo con trong giai đoạn phát triển toàn diện, hạt kích thước vừa miệng giúp tiêu hóa dễ dàng và ngăn ngừa búi lông ruột.",
                Price = 345000m,
                OriginalPrice = 390000m,
                Stock = 200,
                Brand = "Royal Canin",
                CategoryId = catThucAn.Id,
                Rating = 4.95,
                ReviewCount = 120,
                SoldQuantity = 910,
                ImageUrl = "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Pate Mèo Whiskas Lon 400g Vị Cá Biển Tươi Ngon",
                Slug = "pate-meo-whiskas-lon-400g-ca-bien",
                Description = "Pate dạng ướt thơm nức mũi chiết xuất từ cá ngừ và cá hồi tươi sống, bổ sung taurine tốt cho mắt và omega 3 làm mượt lông mèo cưng.",
                Price = 52000m,
                OriginalPrice = 60000m,
                Stock = 300,
                Brand = "Whiskas",
                CategoryId = catThucAn.Id,
                Rating = 4.8,
                ReviewCount = 65,
                SoldQuantity = 1420,
                ImageUrl = "https://images.unsplash.com/photo-1615789591457-74a63395c990?auto=format&fit=crop&w=800&q=80",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Thức Ăn Hạt Cao Cấp Orijen Original Cho Mọi Giống Chó 2kg",
                Slug = "thuc-an-hat-orijen-original-2kg",
                Description = "Thức ăn sinh học nguyên bản chứa 85% thịt tươi chất lượng cao (gà tây, cá tuyết, trứng gà nuôi thả). Không chứa ngũ cốc (Grain-Free), thích hợp cho chó dễ dị ứng.",
                Price = 980000m,
                OriginalPrice = 1100000m,
                Stock = 45,
                Brand = "Orijen",
                CategoryId = catThucAn.Id,
                Rating = 5.0,
                ReviewCount = 42,
                SoldQuantity = 180,
                ImageUrl = "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&w=800&q=80",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Sốt Thưởng Ciao Churu Gói 4 Tuýp Cho Mèo (Vị Gà & Cá Hồi)",
                Slug = "sot-thuong-ciao-churu-4-tuyp",
                Description = "Món ăn vặt thần thánh mà bất kỳ chú mèo nào cũng mê mẩn. Cung cấp nước dồi dào, hỗ trợ tiêu hóa và giảm mùi hôi chất thải.",
                Price = 42000m,
                OriginalPrice = 50000m,
                Stock = 500,
                Brand = "Inaba Ciao",
                CategoryId = catThucAn.Id,
                Rating = 4.98,
                ReviewCount = 310,
                SoldQuantity = 3400,
                ImageUrl = "https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?auto=format&fit=crop&w=800&q=80",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Thịt Bò Sấy Thăng Hoa Freeze-Dried Bổ Sung Đạm Cho Chó Mèo",
                Slug = "thit-bo-say-thang-hoa-freeze-dried",
                Description = "100% thịt bò tươi sấy lạnh âm 40 độ C giữ nguyên vẹn 98% dưỡng chất và hương vị tự nhiên. Dùng trộn cơm hạt hoặc làm bánh thưởng huấn luyện.",
                Price = 185000m,
                OriginalPrice = 220000m,
                Stock = 80,
                Brand = "PetSnack",
                CategoryId = catThucAn.Id,
                Rating = 4.9,
                ReviewCount = 56,
                SoldQuantity = 450,
                ImageUrl = "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=800&q=80",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Hạt Cho Mèo Me-O Vị Cá Ngừ Tuna 1.2kg",
                Slug = "hat-cho-meo-me-o-ca-ngu-1-2kg",
                Description = "Dòng hạt bình dân chất lượng cao sản xuất tại Thái Lan, giàu vitamin C và E tăng đề kháng, giá cả phải chăng cho các bạn nuôi nhiều bé.",
                Price = 115000m,
                OriginalPrice = 135000m,
                Stock = 180,
                Brand = "Me-O",
                CategoryId = catThucAn.Id,
                Rating = 4.7,
                ReviewCount = 89,
                SoldQuantity = 1100,
                ImageUrl = "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=800&q=80",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Xương Gặm Sạch Răng Pedigree Dentastix Cho Chó Vừa (Gói 7 Cây)",
                Slug = "xuong-gam-sach-rang-pedigree-dentastix",
                Description = "Thiết kế hình chữ X độc quyền giúp cọ sạch mảng bám tận chân răng tới 80%, giảm vôi răng và mang lại hơi thở thơm mát cho cún cưng.",
                Price = 89000m,
                OriginalPrice = 105000m,
                Stock = 120,
                Brand = "Pedigree",
                CategoryId = catThucAn.Id,
                Rating = 4.85,
                ReviewCount = 78,
                SoldQuantity = 670,
                ImageUrl = "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Sữa Bột Chó Mèo Bio-Milk Thay Thế Sữa Mẹ Gói 100g",
                Slug = "sua-bot-cho-meo-bio-milk-100g",
                Description = "Công thức sữa bột giàu đạm, chất béo và vitamin gần giống sữa mẹ nhất, rất an toàn cho cún mèo sơ sinh, mèo mất mẹ hoặc thú mẹ đang cho con bú.",
                Price = 38000m,
                OriginalPrice = 45000m,
                Stock = 250,
                Brand = "Bio Pharmachemie",
                CategoryId = catThucAn.Id,
                Rating = 4.9,
                ReviewCount = 145,
                SoldQuantity = 2200,
                ImageUrl = "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },

            // --- ĐỒ CHƠI THÚ CƯNG (CategoryId = catDoChoi.Id) ---
            new Product
            {
                Name = "Đồ Chơi Gặm Cao Su KONG Classic Cho Chó Nhét Thức Ăn",
                Slug = "do-choi-gam-cao-su-kong-classic",
                Description = "Chất liệu cao su tự nhiên siêu bền chống cắn phá cực tốt của Mỹ. Có thể nhét bơ đậu phộng hoặc hạt khô vào trong giúp chó giải tỏa stress và không cắn đồ đạc.",
                Price = 280000m,
                OriginalPrice = 320000m,
                Stock = 75,
                Brand = "KONG",
                CategoryId = catDoChoi.Id,
                Rating = 4.95,
                ReviewCount = 63,
                SoldQuantity = 410,
                ImageUrl = "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=800&q=80",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Trụ Cào Móng Bọc Dây Thừng Sisal Tự Nhiên Kèm Chuông Kêu Cho Mèo",
                Slug = "tru-cao-mong-day-thung-sisal",
                Description = "Cột cào móng cao 50cm vững chắc, bọc sợi sisal tự nhiên giúp mèo thỏa mãn bản năng mài móng, bảo vệ sofa và đồ gỗ trong nhà của bạn.",
                Price = 165000m,
                OriginalPrice = 195000m,
                Stock = 90,
                Brand = "PetFamily",
                CategoryId = catDoChoi.Id,
                Rating = 4.88,
                ReviewCount = 52,
                SoldQuantity = 380,
                ImageUrl = "https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&w=800&q=80",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Cần Câu Mèo Lông Vũ Dẻo Dai Có Chuông",
                Slug = "can-cau-meo-long-vu-chuong",
                Description = "Cần câu uốn dẻo đàn hồi cao với chùm lông vũ màu sắc sinh động, kích thích phản xạ săn mồi và vận động nhảy vồ của mèo con.",
                Price = 25000m,
                OriginalPrice = 35000m,
                Stock = 400,
                Brand = "PetFun",
                CategoryId = catDoChoi.Id,
                Rating = 4.75,
                ReviewCount = 112,
                SoldQuantity = 1850,
                ImageUrl = "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Bóng Đồ Chơi Gặm Nhả Thức Ăn Tự Động Xoay 360 Độ Cho Chó",
                Slug = "bong-do-choi-gam-tu-dong-360-do",
                Description = "Quả bóng nhựa ABS an toàn có khoang chứa hạt, khi chó lăn bóng thức ăn sẽ rơi ra từng chút một, giúp cún ăn chậm và kích thích trí não.",
                Price = 95000m,
                OriginalPrice = 120000m,
                Stock = 110,
                Brand = "PetFun",
                CategoryId = catDoChoi.Id,
                Rating = 4.82,
                ReviewCount = 38,
                SoldQuantity = 290,
                ImageUrl = "https://images.unsplash.com/photo-1535294435445-d7249524ef2e?auto=format&fit=crop&w=800&q=80",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Cá Bạc Hà Nhồi Bông Phát Âm Thanh Kèm Cỏ Catnip Cho Mèo",
                Slug = "ca-bac-ha-nhoi-bong-catnip",
                Description = "Cá bông in 3D sống động chứa thảo mộc cỏ mèo (catnip) thiên nhiên giúp mèo hưng phấn, giải tỏa căng thẳng và ôm ngủ say sưa.",
                Price = 45000m,
                OriginalPrice = 60000m,
                Stock = 220,
                Brand = "CatLover",
                CategoryId = catDoChoi.Id,
                Rating = 4.9,
                ReviewCount = 88,
                SoldQuantity = 960,
                ImageUrl = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Banh Dây Thừng Bện 2 Đầu Làm Sạch Răng Cho Cún",
                Slug = "banh-day-thung-ben-2-dau",
                Description = "Sợi cotton 100% tự nhiên xoắn bện chắc chắn, hỗ trợ massage nướu và làm sạch mảng bám chân răng khi cún cưng chơi kéo co.",
                Price = 35000m,
                OriginalPrice = 45000m,
                Stock = 160,
                Brand = "DogLife",
                CategoryId = catDoChoi.Id,
                Rating = 4.8,
                ReviewCount = 44,
                SoldQuantity = 520,
                ImageUrl = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },

            // --- CHUỒNG, NỆM & PHỤ KIỆN (CategoryId = catPhuKien.Id) ---
            new Product
            {
                Name = "Balo Phi Hành Gia Vỏ Trong Suốt Thông Khí Cho Thú Cưng",
                Slug = "balo-phi-hanh-gia-vo-trong-suot",
                Description = "Balo cao cấp có mặt kính trong suốt giúp bé cưng ngắm nhìn thế giới bên ngoài. 9 lỗ thông gió và lưới hai bên thoáng khí tuyệt đối.",
                Price = 240000m,
                OriginalPrice = 290000m,
                Stock = 60,
                Brand = "PetTravel",
                CategoryId = catPhuKien.Id,
                Rating = 4.92,
                ReviewCount = 76,
                SoldQuantity = 640,
                ImageUrl = "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=800&q=80",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Nệm Tròn Nhồi Bông Êm Ái Chống Căng Thẳng Donut Cho Chó Mèo",
                Slug = "nem-tron-nhoi-bong-donut",
                Description = "Nệm lông xù siêu mềm mại như vòng tay mẹ, thiết kế nâng đỡ khớp xương và mang lại giấc ngủ sâu ấm áp trong mùa đông.",
                Price = 195000m,
                OriginalPrice = 240000m,
                Stock = 85,
                Brand = "PetComfort",
                CategoryId = catPhuKien.Id,
                Rating = 4.9,
                ReviewCount = 59,
                SoldQuantity = 480,
                ImageUrl = "https://images.unsplash.com/photo-1591946614720-90a587da4a36?auto=format&fit=crop&w=800&q=80",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Bát Ăn Inox Đôi Kèm Bình Cấp Nước Uống Tự Động Chống Tràn",
                Slug = "bat-an-inox-doi-cap-nuoc-tu-dong",
                Description = "Khay ăn góc nghiêng 15 độ bảo vệ đốt sống cổ của thú cưng, bình nước cơ chế siphon tự động bổ sung nước sạch khi bé uống vơi.",
                Price = 135000m,
                OriginalPrice = 160000m,
                Stock = 130,
                Brand = "PetFeed",
                CategoryId = catPhuKien.Id,
                Rating = 4.86,
                ReviewCount = 47,
                SoldQuantity = 730,
                ImageUrl = "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Dây Dắt Chó Kèm Yếm Ngực Phản Quang Chống Giật Cao Cấp",
                Slug = "day-dat-kem-yem-nguc-phan-quang",
                Description = "Dây vải Oxford chịu lực cao, đệm ngực êm ái không làm nghẹn cổ cún khi kéo mạnh, viền dạ quang phát sáng an toàn khi dạo chơi ban đêm.",
                Price = 145000m,
                OriginalPrice = 175000m,
                Stock = 95,
                Brand = "Truelove",
                CategoryId = catPhuKien.Id,
                Rating = 4.9,
                ReviewCount = 53,
                SoldQuantity = 390,
                ImageUrl = "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Chuồng Sắt Sơn Tĩnh Điện Gấp Gọn Có Bánh Xe Di Chuyển",
                Slug = "chuong-sat-son-tinh-dien-gap-gon",
                Description = "Khung sắt phủ sơn tĩnh điện chống rỉ sét sét bền đẹp, có khay vệ sinh kéo rời dưới đáy và cửa chốt an toàn.",
                Price = 450000m,
                OriginalPrice = 520000m,
                Stock = 40,
                Brand = "PetHome",
                CategoryId = catPhuKien.Id,
                Rating = 4.84,
                ReviewCount = 29,
                SoldQuantity = 190,
                ImageUrl = "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=800&q=80",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Đài Phun Nước Uống Tuần Hoàn Cảm Ứng Thông Minh Cho Mèo 2.5L",
                Slug = "dai-phun-nuoc-uong-tuan-hoan-2-5l",
                Description = "Dòng nước chảy róc rách thu hút mèo uống nhiều nước hơn, ngăn ngừa bệnh sỏi thận và tiết niệu. Bộ lọc than hoạt tính 4 lớp khử độc tinh khiết.",
                Price = 320000m,
                OriginalPrice = 380000m,
                Stock = 55,
                Brand = "Xiaomi Petkit",
                CategoryId = catPhuKien.Id,
                Rating = 4.96,
                ReviewCount = 92,
                SoldQuantity = 510,
                ImageUrl = "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },

            // --- CHĂM SÓC & VỆ SINH (CategoryId = catSucKhoe.Id) ---
            new Product
            {
                Name = "Cát Vệ Sinh Đậu Nành Tofu Cature Khử Mùi Vón Cục Xả Được Bồn Cầu",
                Slug = "cat-ve-sinh-dau-nanh-tofu-cature",
                Description = "Cát hữu cơ 100% từ bã đậu nành thiên nhiên, không bụi 99.9%, an toàn khi mèo liếm phải chân. Vón cục siêu nhanh và có thể tiêu hủy trực tiếp trong bồn cầu.",
                Price = 125000m,
                OriginalPrice = 145000m,
                Stock = 250,
                Brand = "Cature",
                CategoryId = catSucKhoe.Id,
                Rating = 4.94,
                ReviewCount = 180,
                SoldQuantity = 2100,
                ImageUrl = "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Sữa Tắm Trị Ve Rận Bọ Chét SOS Cho Chó Mèo 530ml",
                Slug = "sua-tam-tri-ve-ran-sos-530ml",
                Description = "Dầu tắm cao cấp thơm lâu suốt 7 ngày, tinh chất thảo mộc tiêu diệt ve rận, mạt ngứa, đồng thời giữ ẩm mềm mượt cho da và lông thú cưng.",
                Price = 110000m,
                OriginalPrice = 135000m,
                Stock = 140,
                Brand = "SOS",
                CategoryId = catSucKhoe.Id,
                Rating = 4.87,
                ReviewCount = 95,
                SoldQuantity = 1300,
                ImageUrl = "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Lược Chải Lông Rụng Furminator Chuyên Dụng Giảm 90% Lông Rụng",
                Slug = "luoc-chai-long-furminator-giam-long-rung",
                Description = "Lưỡi thép không gỉ thông minh lách sâu vào lớp lông lót phía dưới để kéo hết sợi lông già chết mà không làm tổn hại đến lớp da nhạy cảm.",
                Price = 185000m,
                OriginalPrice = 220000m,
                Stock = 85,
                Brand = "Furminator",
                CategoryId = catSucKhoe.Id,
                Rating = 4.95,
                ReviewCount = 73,
                SoldQuantity = 590,
                ImageUrl = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Dung Dịch Vệ Sinh Tai Bioline Tai Khử Mùi & Trị Rận Tai 50ml",
                Slug = "dung-dich-ve-sinh-tai-bioline-50ml",
                Description = "Làm mềm và tan ráy tai tích tụ, kháng khuẩn chống viêm tai giữa và tiêu diệt ve rận ký sinh trong ống tai thú cưng.",
                Price = 65000m,
                OriginalPrice = 80000m,
                Stock = 160,
                Brand = "Bioline",
                CategoryId = catSucKhoe.Id,
                Rating = 4.82,
                ReviewCount = 61,
                SoldQuantity = 870,
                ImageUrl = "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=800&q=80",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Xịt Khử Mùi Hôi Chuồng Trại & Diệt Khuẩn Nano Bạc Pet Odor 300ml",
                Slug = "xit-khu-mui-nano-bac-pet-odor",
                Description = "Công nghệ nano bạc tiêu diệt 99.9% vi khuẩn gây mùi từ nước tiểu và phân thú cưng, hương thơm thảo mộc tự nhiên thơm mát dễ chịu.",
                Price = 85000m,
                OriginalPrice = 105000m,
                Stock = 120,
                Brand = "PetFresh",
                CategoryId = catSucKhoe.Id,
                Rating = 4.88,
                ReviewCount = 49,
                SoldQuantity = 760,
                ImageUrl = "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Kìm Bấm Móng Cho Chó Mèo Kèm Dũa Móng Thép Cao Cấp",
                Slug = "kim-bam-mong-cho-meo-kem-dua",
                Description = "Lưỡi cắt thép tôi sắc bén có vách ngăn cản độ sâu an toàn tránh cắt vào tủy móng gây chảy máu cho thú cưng.",
                Price = 55000m,
                OriginalPrice = 70000m,
                Stock = 180,
                Brand = "PetCare",
                CategoryId = catSucKhoe.Id,
                Rating = 4.8,
                ReviewCount = 37,
                SoldQuantity = 640,
                ImageUrl = "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=800&q=80",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Cỏ Tươi Trồng Cho Mèo Tiêu Búi Lông Tự Nhiên Cat Grass",
                Slug = "co-tuoi-trong-cho-meo-tieu-bui-long",
                Description = "Hạt giống mầm lúa mì giàu chất xơ tự nhiên, kích thích hệ tiêu hóa mèo nôn búi lông tồn đọng và bổ sung axit folic cần thiết.",
                Price = 28000m,
                OriginalPrice = 35000m,
                Stock = 300,
                Brand = "GreenPet",
                CategoryId = catSucKhoe.Id,
                Rating = 4.88,
                ReviewCount = 115,
                SoldQuantity = 1920,
                ImageUrl = "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=800&q=80",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Đèn Laser Đồ Chơi Cho Mèo Phát Tia Sáng Vui Nhộn 5 Hình Độc Đáo",
                Slug = "den-laser-do-choi-cho-meo",
                Description = "Đèn laser sạc USB tiện lợi tích hợp 5 họa tiết (chấm đỏ, chuột, xương, chân mèo, mặt cười) kích thích mèo rượt đuổi tập thể dục cực vui.",
                Price = 69000m,
                OriginalPrice = 85000m,
                Stock = 150,
                Brand = "PetFun",
                CategoryId = catDoChoi.Id,
                Rating = 4.9,
                ReviewCount = 89,
                SoldQuantity = 1240,
                ImageUrl = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Nhà Vệ Sinh Cho Mèo Dạng Hộp Kín Chống Bắn Cát Khử Mùi",
                Slug = "nha-ve-sinh-cho-meo-hop-kin",
                Description = "Hộp vệ sinh kích thước lớn 50x40cm có nắp lật một chiều chống cát bay ra sàn nhà, tặng kèm xẻng xúc phân và túi lọc than hoạt tính.",
                Price = 275000m,
                OriginalPrice = 330000m,
                Stock = 65,
                Brand = "PetClean",
                CategoryId = catPhuKien.Id,
                Rating = 4.93,
                ReviewCount = 74,
                SoldQuantity = 430,
                ImageUrl = "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=800&q=80",
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Áo Len Ấm Áp Mùa Đông Họa Tiết Tuần Lộc Cho Chó Mèo",
                Slug = "ao-len-am-ap-mua-dong-tuan-loc",
                Description = "Chất len dệt kim co giãn 4 chiều mềm mịn không kích ứng da, giữ ấm lồng ngực cho các bé trong những ngày đông lạnh giá.",
                Price = 85000m,
                OriginalPrice = 110000m,
                Stock = 120,
                Brand = "PetFashion",
                CategoryId = catPhuKien.Id,
                Rating = 4.85,
                ReviewCount = 42,
                SoldQuantity = 380,
                ImageUrl = "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Xúc Xích Dinh Dưỡng Cho Chó Vị Thịt Bò & Phô Mai (Gói 30 Cây)",
                Slug = "xuc-xich-dinh-duong-cho-cho-30-cay",
                Description = "Món ăn nhẹ tiện lợi, vị thịt bò thật kết hợp phô mai béo ngậy bổ sung canxi và protein, thích hợp mang theo khi đi dã ngoại huấn luyện cún.",
                Price = 95000m,
                OriginalPrice = 120000m,
                Stock = 140,
                Brand = "PetSnack",
                CategoryId = catThucAn.Id,
                Rating = 4.89,
                ReviewCount = 98,
                SoldQuantity = 1530,
                ImageUrl = "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&w=800&q=80",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Găng Tay Massage Tắm & Gom Lông Rụng True Touch Silicon",
                Slug = "gang-tay-massage-tam-gom-long-true-touch",
                Description = "Găng tay silicon 180 đầu gai mềm massage lưu thông máu và gom gọn lông rụng khi tắm hoặc vuốt ve thú cưng chỉ với 1 thao tác bóc ra.",
                Price = 45000m,
                OriginalPrice = 60000m,
                Stock = 210,
                Brand = "True Touch",
                CategoryId = catSucKhoe.Id,
                Rating = 4.79,
                ReviewCount = 83,
                SoldQuantity = 1120,
                ImageUrl = "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Thảm Lót Khay Cát Mèo 2 Lớp Chống Cát Văng Tổ Ong Chống Nước",
                Slug = "tham-lot-khay-cat-meo-2-lop-to-ong",
                Description = "Thiết kế lỗ tổ ong hứng trọn cát dính chân mèo khi bước ra khỏi khay, lớp đáy chống thấm nước tuyệt đối, dễ dàng đổ cát thừa ngược lại vào chậu.",
                Price = 95000m,
                OriginalPrice = 120000m,
                Stock = 130,
                Brand = "PetCare",
                CategoryId = catPhuKien.Id,
                Rating = 4.91,
                ReviewCount = 67,
                SoldQuantity = 780,
                ImageUrl = "https://images.unsplash.com/photo-1591946614720-90a587da4a36?auto=format&fit=crop&w=800&q=80",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Đồ Chơi Tháp Bóng 3 Tầng Vui Nhộn Cho Mèo Con Vận Động",
                Slug = "do-choi-thap-bong-3-tang-cho-meo",
                Description = "Tháp bóng 3 tầng rực rỡ với 3 quả banh lăn tròn không bao giờ văng ra ngoài, giúp mèo cưng tự chơi say mê cả ngày mà không chán.",
                Price = 75000m,
                OriginalPrice = 95000m,
                Stock = 175,
                Brand = "PetFun",
                CategoryId = catDoChoi.Id,
                Rating = 4.86,
                ReviewCount = 58,
                SoldQuantity = 820,
                ImageUrl = "https://images.unsplash.com/photo-1535294435445-d7249524ef2e?auto=format&fit=crop&w=800&q=80",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Súp Thưởng Wanpy Happy 100 Dạng Tuýp Đậm Đà Cho Mèo",
                Slug = "sup-thuong-wanpy-happy-100-dang-tuyp",
                Description = "Súp thưởng thơm bùi kết hợp thịt cá hồi và gà xay nhuyễn, chứa prebiotics tốt cho đường ruột và ngăn ngừa sỏi tiết niệu cho mèo.",
                Price = 39000m,
                OriginalPrice = 48000m,
                Stock = 320,
                Brand = "Wanpy",
                CategoryId = catThucAn.Id,
                Rating = 4.92,
                ReviewCount = 140,
                SoldQuantity = 2450,
                ImageUrl = "https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?auto=format&fit=crop&w=800&q=80",
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            }
        };

        context.Products.AddRange(products);
        context.SaveChanges();
    }

    /// <summary>
    /// Seed tài khoản liên kết OAuth (Google) mẫu cho môi trường development/testing.
    /// Thuộc về user: 'user@petshop.com' (User Id #2).
    /// Đảm bảo tính idempotent: chỉ thêm nếu chưa tồn tại liên kết cho provider tương ứng.
    /// </summary>
    private static void SeedExternalAccounts(PetShopDbContext context)
    {
        var testUser = context.Users.FirstOrDefault(u => u.Email == "user@petshop.com");
        if (testUser == null)
        {
            return;
        }

        // Kiểm tra tránh vi phạm UNIQUE(user_id, provider) và UNIQUE(provider, provider_key)
        const string provider = "Google";
        const string providerKey = "google_user_dev_test_sub_1001"; // Google 'sub' claim format

        bool alreadyLinked = context.UserExternalAccounts.Any(a =>
            (a.UserId == testUser.Id && a.Provider == provider) ||
            (a.Provider == provider && a.ProviderKey == providerKey));

        if (!alreadyLinked)
        {
            context.UserExternalAccounts.Add(new UserExternalAccount
            {
                UserId = testUser.Id,
                Provider = provider,
                ProviderKey = providerKey,
                ProviderEmail = testUser.Email,
                CreatedAt = DateTime.UtcNow
            });
            context.SaveChanges();
        }
    }

    /// <summary>
    /// Seed hội thoại và tin nhắn mẫu giữa khách hàng (user@petshop.com) và Admin.
    /// Idempotent: chỉ tạo nếu chưa có hội thoại nào cho user.
    /// </summary>
    private static void SeedChatData(PetShopDbContext context)
    {
        var customer = context.Users.FirstOrDefault(u => u.Email == "user@petshop.com");
        var admin = context.Users.FirstOrDefault(u => u.Role == "Admin");

        if (customer == null || admin == null)
        {
            return;
        }

        if (!context.Conversations.Any(c => c.CustomerId == customer.Id))
        {
            var now = DateTime.UtcNow;
            var conversation = new Conversation
            {
                CustomerId = customer.Id,
                AdminId = admin.Id,
                Status = "Open",
                CreatedAt = now.AddMinutes(-30),
                UpdatedAt = now.AddMinutes(-5),
                LastMessageAt = now.AddMinutes(-5)
            };

            context.Conversations.Add(conversation);
            context.SaveChanges();

            var messages = new List<Message>
            {
                new Message
                {
                    ConversationId = conversation.Id,
                    SenderId = customer.Id,
                    SenderRole = "Customer",
                    Content = "Chào shop, mình muốn hỏi bé Corgi 2 tháng tuổi đã được tiêm phòng mấy mũi rồi ạ?",
                    CreatedAt = now.AddMinutes(-25),
                    ReadAt = now.AddMinutes(-20),
                    IsDeleted = false
                },
                new Message
                {
                    ConversationId = conversation.Id,
                    SenderId = admin.Id,
                    SenderRole = "Admin",
                    Content = "Dạ chào bạn! Bé Corgi bên mình hiện đã được tiêm đủ 2 mũi vaccine 7 bệnh và sổ giun định kỳ 2 lần, có kèm sổ sức khỏe bảo hành 30 ngày bạn nhé!",
                    CreatedAt = now.AddMinutes(-15),
                    ReadAt = now.AddMinutes(-10),
                    IsDeleted = false
                },
                new Message
                {
                    ConversationId = conversation.Id,
                    SenderId = customer.Id,
                    SenderRole = "Customer",
                    Content = "Tuyệt quá, shop có hỗ trợ ship an toàn về nội thành Hà Nội trong ngày không ạ?",
                    CreatedAt = now.AddMinutes(-5),
                    ReadAt = null, // Tin chưa đọc để test badge unread của Admin
                    IsDeleted = false
                }
            };

            context.Messages.AddRange(messages);
            context.SaveChanges();
        }
    }
}
