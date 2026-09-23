using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetShop.Api.DTOs;
using PetShop.Api.Services;

namespace PetShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PetsController : ControllerBase
{
    private readonly IPetService _petService;

    public PetsController(IPetService petService)
    {
        _petService = petService;
    }

    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] PetFilterParams filter)
    {
        var result = await _petService.GetPagedPetsAsync(filter);
        return Ok(result);
    }

    [HttpGet("featured")]
    public async Task<IActionResult> GetFeatured([FromQuery] int count = 8)
    {
        var result = await _petService.GetFeaturedPetsAsync(count);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var pet = await _petService.GetPetByIdAsync(id);
        if (pet == null)
        {
            return NotFound(new { message = $"Không tìm thấy bé thú cưng mã {id}" });
        }
        return Ok(pet);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePetDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var created = await _petService.CreatePetAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePetDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var updated = await _petService.UpdatePetAsync(id, dto);
        if (updated == null)
        {
            return NotFound(new { message = $"Không tìm thấy bé thú cưng mã {id}" });
        }

        return Ok(updated);
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
    {
        var success = await _petService.UpdatePetStatusAsync(id, status);
        if (!success)
        {
            return NotFound(new { message = $"Không tìm thấy bé thú cưng mã {id}" });
        }

        return Ok(new { message = "Cập nhật trạng thái thành công" });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _petService.DeletePetAsync(id);
        if (!success)
        {
            return NotFound(new { message = $"Không tìm thấy bé thú cưng mã {id}" });
        }

        return NoContent();
    }
}
