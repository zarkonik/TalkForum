using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TalkForum.Infrastructure;

namespace TalkForum.Api.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;

    public CategoriesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetAll()
    {
        var categories = await _db.Categories
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Slug))
            .ToListAsync();

        return Ok(categories);
    }
}

public record CategoryDto(Guid Id, string Name, string Slug);
