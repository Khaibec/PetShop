using Microsoft.AspNetCore.Mvc;
using PetShop.Api.Services;

namespace PetShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpGet]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)]
    public async Task<IActionResult> GetAll([FromQuery] string? type)
    {
        var categories = await _categoryService.GetAllCategoriesAsync(type);
        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var category = await _categoryService.GetCategoryByIdAsync(id);
        if (category == null)
        {
            return NotFound(new { message = $"Không tìm thấy danh mục mã {id}" });
        }
        return Ok(category);
    }
}
