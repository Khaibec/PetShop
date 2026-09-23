using Microsoft.EntityFrameworkCore;
using PetShop.Api.Models;

namespace PetShop.Api.Data;

public class PetShopDbContext : DbContext
{
    public PetShopDbContext(DbContextOptions<PetShopDbContext> options) : base(options)
    {
    }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Pet> Pets => Set<Pet>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Review> Reviews => Set<Review>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Category indexing & configuration
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasIndex(c => c.Type).HasDatabaseName("IX_Categories_Type");
            entity.HasIndex(c => c.Slug).IsUnique().HasDatabaseName("IX_Categories_Slug");
            entity.Property(c => c.Name).HasMaxLength(150).IsRequired();
        });

        // Product indexing & configuration
        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasIndex(p => p.CategoryId).HasDatabaseName("IX_Products_CategoryId");
            entity.HasIndex(p => p.Price).HasDatabaseName("IX_Products_Price");
            entity.HasIndex(p => p.Brand).HasDatabaseName("IX_Products_Brand");
            entity.HasIndex(p => p.IsFeatured).HasDatabaseName("IX_Products_IsFeatured");
            entity.HasIndex(p => p.CreatedAt).HasDatabaseName("IX_Products_CreatedAt");
            
            entity.Property(p => p.Name).HasMaxLength(250).IsRequired();
            entity.Property(p => p.Price).HasPrecision(18, 2);
            entity.Property(p => p.OriginalPrice).HasPrecision(18, 2);

            entity.HasOne(p => p.Category)
                  .WithMany(c => c.Products)
                  .HasForeignKey(p => p.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Pet indexing & configuration
        modelBuilder.Entity<Pet>(entity =>
        {
            entity.HasIndex(p => p.Species).HasDatabaseName("IX_Pets_Species");
            entity.HasIndex(p => p.Breed).HasDatabaseName("IX_Pets_Breed");
            entity.HasIndex(p => p.Status).HasDatabaseName("IX_Pets_Status");
            entity.HasIndex(p => p.Price).HasDatabaseName("IX_Pets_Price");
            entity.HasIndex(p => p.IsFeatured).HasDatabaseName("IX_Pets_IsFeatured");
            entity.HasIndex(p => p.CreatedAt).HasDatabaseName("IX_Pets_CreatedAt");

            entity.Property(p => p.Name).HasMaxLength(150).IsRequired();
            entity.Property(p => p.WeightKg).HasPrecision(18, 2);
            entity.Property(p => p.Price).HasPrecision(18, 2);
            entity.Property(p => p.OriginalPrice).HasPrecision(18, 2);
        });

        // User indexing & configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique().HasDatabaseName("IX_Users_Email");
            entity.HasIndex(u => u.Username).IsUnique().HasDatabaseName("IX_Users_Username");
            entity.Property(u => u.FullName).HasMaxLength(150).IsRequired();
            entity.Property(u => u.Role).HasMaxLength(50).IsRequired();
        });

        // Order indexing & configuration
        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasIndex(o => o.OrderCode).IsUnique().HasDatabaseName("IX_Orders_OrderCode");
            entity.HasIndex(o => o.UserId).HasDatabaseName("IX_Orders_UserId");
            entity.HasIndex(o => o.Status).HasDatabaseName("IX_Orders_Status");
            entity.HasIndex(o => o.CreatedAt).HasDatabaseName("IX_Orders_CreatedAt");

            entity.Property(o => o.SubTotal).HasPrecision(18, 2);
            entity.Property(o => o.ShippingFee).HasPrecision(18, 2);
            entity.Property(o => o.DiscountAmount).HasPrecision(18, 2);
            entity.Property(o => o.TotalAmount).HasPrecision(18, 2);

            entity.HasOne(o => o.User)
                  .WithMany(u => u.Orders)
                  .HasForeignKey(o => o.UserId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // OrderItem configuration
        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.Property(oi => oi.UnitPrice).HasPrecision(18, 2);
            entity.Property(oi => oi.TotalPrice).HasPrecision(18, 2);

            entity.HasOne(oi => oi.Order)
                  .WithMany(o => o.Items)
                  .HasForeignKey(oi => oi.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(oi => oi.Product)
                  .WithMany(p => p.OrderItems)
                  .HasForeignKey(oi => oi.ProductId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(oi => oi.Pet)
                  .WithMany(p => p.OrderItems)
                  .HasForeignKey(oi => oi.PetId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Review configuration
        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasOne(r => r.Product)
                  .WithMany(p => p.Reviews)
                  .HasForeignKey(r => r.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(r => r.User)
                  .WithMany(u => u.Reviews)
                  .HasForeignKey(r => r.UserId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
