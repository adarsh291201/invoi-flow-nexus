using Microsoft.AspNetCore.Mvc;
using InvoiceGenerator.API.Data;
using InvoiceGenerator.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace InvoiceGenerator.API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class RateMatrixController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<RateMatrixController> _logger;
        public RateMatrixController(AppDbContext context, ILogger<RateMatrixController> logger) { _context = context; _logger = logger; }

        // GET /ratematrix?projectId=...
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RateMatrix>>> Get([FromQuery] string projectId)
        {
            var matrices = await _context.RateMatrices.Where(r => r.ProjectId == projectId).ToListAsync();
            return Ok(matrices);
        }

        // POST /ratematrix (create one or many)
        [HttpPost]
        public async Task<ActionResult> Create([FromBody] List<RateMatrix> matrices)
        {
            _logger.LogInformation("POST /ratematrix called. Payload count: {Count}", matrices?.Count ?? 0);
            if (matrices != null)
            {
                foreach (var m in matrices)
                {
                    _logger.LogInformation("Payload: {@Matrix}", m);
                }
            }
            if (matrices == null || matrices.Count == 0) return BadRequest("No data provided");
            await _context.RateMatrices.AddRangeAsync(matrices);
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        // PUT /ratematrix/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, [FromBody] RateMatrix matrix)
        {
            var existing = await _context.RateMatrices.FindAsync(id);
            if (existing == null) return NotFound();
            // Update fields
            existing.ProjectId = matrix.ProjectId;
            existing.ProjectName = matrix.ProjectName;
            existing.AccountId = matrix.AccountId;
            existing.AccountName = matrix.AccountName;
            existing.ResourceId = matrix.ResourceId;
            existing.ResourceName = matrix.ResourceName;
            existing.StartDate = matrix.StartDate;
            existing.EndDate = matrix.EndDate;
            existing.StandardRate = matrix.StandardRate;
            existing.WeekendRate = matrix.WeekendRate;
            existing.OTRate = matrix.OTRate;
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        // DELETE /ratematrix/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var existing = await _context.RateMatrices.FindAsync(id);
            if (existing == null) return NotFound();
            _context.RateMatrices.Remove(existing);
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }
    }
}