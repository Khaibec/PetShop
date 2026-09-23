namespace PetShop.Api.DTOs;

public class DashboardSummaryDto
{
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
    public int PendingOrders { get; set; }
    public int ShippingOrders { get; set; }
    public int CompletedOrders { get; set; }
    public int TotalProducts { get; set; }
    public int TotalPets { get; set; }
    public int AvailablePets { get; set; }
    public int TotalUsers { get; set; }
    public List<OrderListDto> RecentOrders { get; set; } = new();
}
