using Microsoft.AspNetCore.Mvc;
using InvoiceGenerator.API.Data;
using InvoiceGenerator.API.Models;
using InvoiceGenerator.API.Services;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace InvoiceGenerator.API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ProjectController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly PdfService _pdfService;
        public ProjectController(AppDbContext context, PdfService pdfService)
        {
            _context = context;
            _pdfService = pdfService;
        }

        // GET /project/without-invoice?month=...&year=...
        [HttpGet("without-invoice")]
        public IActionResult GetProjectsWithoutInvoice([FromQuery] string month, [FromQuery] int year)
        {
            var allProjects = _context.Projects.ToList();
            var invoices = _context.Invoices.Where(i => i.Month == month && i.Year == year).ToList();
            var projectsWithoutInvoice = allProjects
                .Where(p => !invoices.Any(inv => inv.ProjectId == p.Id))
                .ToList();
            return Ok(projectsWithoutInvoice);
        }

        // POST /project/bulk-generate-invoices
        [HttpPost("bulk-generate-invoices")]
        public async Task<IActionResult> BulkGenerateInvoices([FromBody] BulkInvoiceRequest request)
        {
            var results = new List<object>();
            foreach (var projectId in request.ProjectIds)
            {
                // Build invoice config for each project (customize as needed)
                var config = new InvoiceConfiguration
                {
                    Id = $"invoice-{Guid.NewGuid()}",
                    ProjectId = projectId,
                    AccountId = "", // Fill as needed
                    Template = "template1", // Default or select as needed
                    Month = request.Month,
                    Year = request.Year,
                    CommonData = new {}, // Fill as needed
                    TemplateData = new {}, // Fill as needed
                    Totals = new {}, // Fill as needed
                    Comments = new List<object>(),
                    Status = "draft",
                    Metadata = new {}
                };

                var invoice = new Invoice
                {
                    InvoiceConfigId = config.Id,
                    ProjectId = config.ProjectId,
                    AccountId = config.AccountId,
                    Template = config.Template,
                    Month = config.Month,
                    Year = config.Year,
                    CommonDataJson = System.Text.Json.JsonSerializer.Serialize(config.CommonData),
                    TemplateDataJson = System.Text.Json.JsonSerializer.Serialize(config.TemplateData),
                    TotalsJson = System.Text.Json.JsonSerializer.Serialize(config.Totals),
                    CommentsJson = System.Text.Json.JsonSerializer.Serialize(config.Comments),
                    Status = config.Status,
                    MetadataJson = System.Text.Json.JsonSerializer.Serialize(config.Metadata),
                    PreviewUrl = $"/invoice/{config.Id}/preview",
                    DownloadUrl = $"/invoice/{config.Id}/download",
                    CreatedAt = DateTime.UtcNow,
                    LastModifiedAt = DateTime.UtcNow
                };
                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync();

                // Generate PDF
                var pdfBytes = _pdfService.GenerateInvoicePdf(config);
                _pdfService.SaveInvoicePdf(config.Id, pdfBytes);

                results.Add(new { projectId, success = true });
            }
            return Ok(results);
        }

        public class BulkInvoiceRequest
        {
            public List<string> ProjectIds { get; set; }
            public string Month { get; set; }
            public int Year { get; set; }
        }
    }
} 