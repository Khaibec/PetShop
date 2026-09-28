using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using PetShop.Api.Data;
using PetShop.Api.DTOs;
using PetShop.Api.Models;

namespace PetShop.Api.Services;

public interface IOrderService
{
    Task<OrderDetailDto> CreateOrderAsync(CreateOrderDto dto, int? userId = null);
    Task<OrderDetailDto?> GetOrderByIdAsync(int id, int? requestingUserId = null, bool isAdmin = false);
    Task<OrderDetailDto?> GetOrderByCodeAsync(string orderCode);
    Task<IEnumerable<OrderListDto>> GetUserOrdersAsync(int userId);
    Task<PagedResult<OrderListDto>> GetAllOrdersAsync(PaginationParams pagination, string? status = null);
    Task<OrderDetailDto?> UpdateOrderStatusAsync(int id, UpdateOrderStatusDto dto);
    Task<DashboardSummaryDto> GetDashboardSummaryAsync();
}

public class OrderService : IOrderService
{
    private readonly PetShopDbContext _context;

    public OrderService(PetShopDbContext context)
    {
        _context = context;
    }

    public async Task<OrderDetailDto> CreateOrderAsync(CreateOrderDto dto, int? userId = null)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            string orderCode;
            do
            {
                var randomSuffix = RandomNumberGenerator.GetHexString(6).ToUpperInvariant();
                orderCode = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{randomSuffix}";
            } while (await _context.Orders.AnyAsync(o => o.OrderCode == orderCode));

            var order = new Order
            {
                OrderCode = orderCode,
                UserId = userId,
                CustomerName = dto.CustomerName.Trim(),
                PhoneNumber = dto.PhoneNumber.Trim(),
                Email = dto.Email?.Trim() ?? string.Empty,
                ShippingAddress = dto.ShippingAddress.Trim(),
                Note = dto.Note?.Trim() ?? string.Empty,
                PaymentMethod = dto.PaymentMethod,
                PaymentStatus = "Pending",
                Status = "Pending",
                ShippingFee = 30000m,
                CreatedAt = DateTime.UtcNow
            };

            decimal subTotal = 0m;
            var orderItems = new List<OrderItem>();

            foreach (var itemDto in dto.Items)
            {
                if (itemDto.ItemType == "Pet" && itemDto.PetId.HasValue)
                {
                    var pet = await _context.Pets.FindAsync(itemDto.PetId.Value);
                    if (pet == null)
                    {
                        throw new InvalidOperationException($"Thú cưng mã {itemDto.PetId.Value} không tồn tại.");
                    }
                    if (pet.Status != "Available")
                    {
                        throw new InvalidOperationException($"Bé thú cưng {pet.Name} hiện đã được đặt hoặc đã bán.");
                    }

                    var itemPrice = pet.Price;
                    subTotal += itemPrice;

                    orderItems.Add(new OrderItem
                    {
                        ItemType = "Pet",
                        PetId = pet.Id,
                        ItemName = pet.Name,
                        ItemImageUrl = pet.ImageUrl,
                        UnitPrice = itemPrice,
                        Quantity = 1,
                        TotalPrice = itemPrice
                    });

                    // Cập nhật trạng thái thú cưng sang Reserved
                    pet.Status = "Reserved";
                }
                else if (itemDto.ProductId.HasValue)
                {
                    var product = await _context.Products.FindAsync(itemDto.ProductId.Value);
                    if (product == null)
                    {
                        throw new InvalidOperationException($"Sản phẩm mã {itemDto.ProductId.Value} không tồn tại.");
                    }
                    if (product.Stock < itemDto.Quantity)
                    {
                        throw new InvalidOperationException($"Sản phẩm '{product.Name}' chỉ còn {product.Stock} sản phẩm trong kho.");
                    }

                    var itemTotalPrice = product.Price * itemDto.Quantity;
                    subTotal += itemTotalPrice;

                    orderItems.Add(new OrderItem
                    {
                        ItemType = "Product",
                        ProductId = product.Id,
                        ItemName = product.Name,
                        ItemImageUrl = product.ImageUrl,
                        UnitPrice = product.Price,
                        Quantity = itemDto.Quantity,
                        TotalPrice = itemTotalPrice
                    });

                    // Cập nhật kho và số lượng đã bán
                    product.Stock -= itemDto.Quantity;
                    product.SoldQuantity += itemDto.Quantity;
                }
            }

            order.SubTotal = subTotal;
            order.TotalAmount = subTotal + order.ShippingFee - order.DiscountAmount;
            order.Items = orderItems;

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return (await GetOrderByIdAsync(order.Id, userId, isAdmin: true))!;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<OrderDetailDto?> GetOrderByIdAsync(int id, int? requestingUserId = null, bool isAdmin = false)
    {
        var query = _context.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .Where(o => o.Id == id);

        // Security Fix (CRIT-03): Disallow anonymous ID enumeration (IDOR protection)
        if (!isAdmin)
        {
            if (!requestingUserId.HasValue)
            {
                return null;
            }
            query = query.Where(o => o.UserId == requestingUserId.Value);
        }

        var order = await query.FirstOrDefaultAsync();
        if (order == null)
        {
            return null;
        }

        return MapToOrderDetailDto(order);
    }

    public async Task<OrderDetailDto?> GetOrderByCodeAsync(string orderCode)
    {
        if (string.IsNullOrWhiteSpace(orderCode))
        {
            return null;
        }

        var normalized = orderCode.Trim().ToUpperInvariant();

        var order = await _context.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.OrderCode.ToUpper() == normalized);

        if (order == null)
        {
            return null;
        }

        return MapToOrderDetailDto(order);
    }

    private static OrderDetailDto MapToOrderDetailDto(Order order)
    {
        return new OrderDetailDto
        {
            Id = order.Id,
            OrderCode = order.OrderCode,
            CustomerName = order.CustomerName,
            PhoneNumber = order.PhoneNumber,
            Email = order.Email,
            ShippingAddress = order.ShippingAddress,
            Note = order.Note,
            PaymentMethod = order.PaymentMethod,
            PaymentStatus = order.PaymentStatus,
            Status = order.Status,
            SubTotal = order.SubTotal,
            ShippingFee = order.ShippingFee,
            DiscountAmount = order.DiscountAmount,
            TotalAmount = order.TotalAmount,
            TrackingCode = order.TrackingCode,
            TotalItems = order.Items.Sum(i => i.Quantity),
            CreatedAt = order.CreatedAt,
            Items = order.Items.Select(i => new OrderItemDto
            {
                Id = i.Id,
                ItemType = i.ItemType,
                ProductId = i.ProductId,
                PetId = i.PetId,
                ItemName = i.ItemName,
                ItemImageUrl = i.ItemImageUrl,
                UnitPrice = i.UnitPrice,
                Quantity = i.Quantity,
                TotalPrice = i.TotalPrice
            }).ToList()
        };
    }

    public async Task<IEnumerable<OrderListDto>> GetUserOrdersAsync(int userId)
    {
        return await _context.Orders
            .AsNoTracking()
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrderListDto
            {
                Id = o.Id,
                OrderCode = o.OrderCode,
                CustomerName = o.CustomerName,
                PhoneNumber = o.PhoneNumber,
                Email = o.Email,
                PaymentMethod = o.PaymentMethod,
                PaymentStatus = o.PaymentStatus,
                Status = o.Status,
                TotalAmount = o.TotalAmount,
                TotalItems = o.Items.Sum(i => i.Quantity),
                CreatedAt = o.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<PagedResult<OrderListDto>> GetAllOrdersAsync(PaginationParams pagination, string? status = null)
    {
        var query = _context.Orders
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(o => o.Status.ToLower() == status.Trim().ToLower());
        }

        if (!string.IsNullOrWhiteSpace(pagination.SearchTerm))
        {
            var term = pagination.SearchTerm.Trim().ToLower();
            query = query.Where(o => o.OrderCode.ToLower().Contains(term)
                                  || o.CustomerName.ToLower().Contains(term)
                                  || o.PhoneNumber.Contains(term));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((pagination.PageNumber - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(o => new OrderListDto
            {
                Id = o.Id,
                OrderCode = o.OrderCode,
                CustomerName = o.CustomerName,
                PhoneNumber = o.PhoneNumber,
                Email = o.Email,
                PaymentMethod = o.PaymentMethod,
                PaymentStatus = o.PaymentStatus,
                Status = o.Status,
                TotalAmount = o.TotalAmount,
                TotalItems = o.Items.Sum(i => i.Quantity),
                CreatedAt = o.CreatedAt
            })
            .ToListAsync();

        return new PagedResult<OrderListDto>(items, totalCount, pagination.PageNumber, pagination.PageSize);
    }

    public async Task<OrderDetailDto?> UpdateOrderStatusAsync(int id, UpdateOrderStatusDto dto)
    {
        var order = await _context.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null)
        {
            return null;
        }

        order.Status = dto.Status;
        if (!string.IsNullOrWhiteSpace(dto.TrackingCode))
        {
            order.TrackingCode = dto.TrackingCode;
        }
        if (!string.IsNullOrWhiteSpace(dto.PaymentStatus))
        {
            order.PaymentStatus = dto.PaymentStatus;
        }

        // If order completed and has pets, mark pets as "Sold"
        if (dto.Status == "Completed")
        {
            order.PaymentStatus = "Paid";
            foreach (var item in order.Items.Where(i => i.ItemType == "Pet" && i.PetId.HasValue))
            {
                var pet = await _context.Pets.FindAsync(item.PetId!.Value);
                if (pet != null)
                {
                    pet.Status = "Sold";
                }
            }
        }
        // If order cancelled, revert pet to "Available"
        else if (dto.Status == "Cancelled")
        {
            foreach (var item in order.Items.Where(i => i.ItemType == "Pet" && i.PetId.HasValue))
            {
                var pet = await _context.Pets.FindAsync(item.PetId!.Value);
                if (pet != null && pet.Status == "Reserved")
                {
                    pet.Status = "Available";
                }
            }
        }

        await _context.SaveChangesAsync();
        return (await GetOrderByIdAsync(order.Id, isAdmin: true))!;
    }

    public async Task<DashboardSummaryDto> GetDashboardSummaryAsync()
    {
        var totalOrders = await _context.Orders.CountAsync();
        var pendingOrders = await _context.Orders.CountAsync(o => o.Status == "Pending");
        var shippingOrders = await _context.Orders.CountAsync(o => o.Status == "Shipping");
        var completedOrders = await _context.Orders.CountAsync(o => o.Status == "Completed");
        var totalRevenue = await _context.Orders
            .Where(o => o.Status == "Completed" || o.PaymentStatus == "Paid")
            .SumAsync(o => (decimal?)o.TotalAmount) ?? 0m;

        var totalProducts = await _context.Products.CountAsync(p => p.IsActive);
        var totalPets = await _context.Pets.CountAsync();
        var availablePets = await _context.Pets.CountAsync(p => p.Status == "Available");
        var totalUsers = await _context.Users.CountAsync(u => u.Role == "User");

        var recentOrders = await _context.Orders
            .AsNoTracking()
            .OrderByDescending(o => o.CreatedAt)
            .Take(5)
            .Select(o => new OrderListDto
            {
                Id = o.Id,
                OrderCode = o.OrderCode,
                CustomerName = o.CustomerName,
                PhoneNumber = o.PhoneNumber,
                Email = o.Email,
                PaymentMethod = o.PaymentMethod,
                PaymentStatus = o.PaymentStatus,
                Status = o.Status,
                TotalAmount = o.TotalAmount,
                TotalItems = o.Items.Sum(i => i.Quantity),
                CreatedAt = o.CreatedAt
            })
            .ToListAsync();

        return new DashboardSummaryDto
        {
            TotalRevenue = totalRevenue,
            TotalOrders = totalOrders,
            PendingOrders = pendingOrders,
            ShippingOrders = shippingOrders,
            CompletedOrders = completedOrders,
            TotalProducts = totalProducts,
            TotalPets = totalPets,
            AvailablePets = availablePets,
            TotalUsers = totalUsers,
            RecentOrders = recentOrders
        };
    }
}
