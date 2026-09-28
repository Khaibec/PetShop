using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetShop.Api.DTOs;
using PetShop.Api.Services;

namespace PetShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        int? userId = null;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int parsedId))
        {
            userId = parsedId;
        }

        try
        {
            var order = await _orderService.CreateOrderAsync(dto, userId);
            return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Lỗi khi xử lý tạo đơn hàng: " + ex.Message });
        }
    }

    [Authorize]
    [HttpGet("my-orders")]
    public async Task<IActionResult> GetMyOrders()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized();
        }

        var orders = await _orderService.GetUserOrdersAsync(userId);
        return Ok(orders);
    }

    [Authorize]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        int? userId = null;
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int parsedId))
        {
            userId = parsedId;
        }

        bool isAdmin = User.IsInRole("Admin");

        var order = await _orderService.GetOrderByIdAsync(id, userId, isAdmin);
        if (order == null)
        {
            return NotFound(new { message = $"Không tìm thấy đơn hàng mã {id}" });
        }

        return Ok(order);
    }

    [AllowAnonymous]
    [HttpGet("track/{code}")]
    public async Task<IActionResult> TrackOrderByCode(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            return BadRequest(new { message = "Vui lòng nhập mã đơn hàng" });
        }

        var order = await _orderService.GetOrderByCodeAsync(code);
        if (order == null)
        {
            return NotFound(new { message = $"Không tìm thấy thông tin đơn hàng với mã '{code.Trim()}'" });
        }

        return Ok(order);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAllOrders([FromQuery] PaginationParams pagination, [FromQuery] string? status)
    {
        var orders = await _orderService.GetAllOrdersAsync(pagination, status);
        return Ok(orders);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var updated = await _orderService.UpdateOrderStatusAsync(id, dto);
        if (updated == null)
        {
            return NotFound(new { message = $"Không tìm thấy đơn hàng mã {id}" });
        }

        return Ok(updated);
    }
}
