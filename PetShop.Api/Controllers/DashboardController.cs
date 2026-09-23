using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetShop.Api.Services;

namespace PetShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class DashboardController : ControllerBase
{
    private readonly IOrderService _orderService;

    public DashboardController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _orderService.GetDashboardSummaryAsync();
        return Ok(stats);
    }
}
