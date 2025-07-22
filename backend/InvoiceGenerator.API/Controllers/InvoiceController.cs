using Microsoft.AspNetCore.Mvc;
using InvoiceGenerator.API.Data;
using InvoiceGenerator.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Threading.Tasks;
using System.Linq;
using System;
using InvoiceGenerator.API.Models;

namespace InvoiceGenerator.API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class InvoiceController : ControllerBase
    {
        private readonly AppDbContext _context;
        public InvoiceController(AppDbContext context) { _context = context; }

        // POST /invoice - Save/Generate Invoice
        [HttpPost]
        public async Task<IActionResult> GenerateInvoice([FromBody] InvoiceGenerationRequest request)
        {
            if (request?.Configuration == null)
                return BadRequest("Invalid invoice configuration.");

            var config = request.Configuration;
            var now = DateTime.UtcNow;

            var invoice = new Invoice
            {
                InvoiceConfigId = config.Id,
                ProjectId = config.ProjectId,
                AccountId = config.AccountId,
                Template = config.Template,
                Month = config.Month,
                Year = config.Year,
                CommonDataJson = JsonSerializer.Serialize(config.CommonData),
                TemplateDataJson = JsonSerializer.Serialize(config.TemplateData),
                TotalsJson = JsonSerializer.Serialize(config.Totals),
                CommentsJson = JsonSerializer.Serialize(config.Comments),
                Status = config.Status,
                MetadataJson = JsonSerializer.Serialize(config.Metadata),
                PreviewUrl = $"/invoice/{config.Id}/preview", // You can adjust this as needed
                DownloadUrl = $"/invoice/{config.Id}/download", // Placeholder
                CreatedAt = now,
                LastModifiedAt = now
            };

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            return Ok(new {
                success = true,
                invoiceId = invoice.InvoiceConfigId,
                previewUrl = invoice.PreviewUrl,
                downloadUrl = invoice.DownloadUrl
            });
        }

        // GET /invoice/{id} - Preview Invoice by config id
        [HttpGet("{id}")]
        public async Task<IActionResult> GetInvoice(string id)
        {
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceConfigId == id);
            if (invoice == null)
                return NotFound();

            // Return the full configuration for preview
            return Ok(new {
                configuration = new {
                    id = invoice.InvoiceConfigId,
                    projectId = invoice.ProjectId,
                    accountId = invoice.AccountId,
                    template = invoice.Template,
                    month = invoice.Month,
                    year = invoice.Year,
                    commonData = JsonSerializer.Deserialize<object>(invoice.CommonDataJson),
                    templateData = JsonSerializer.Deserialize<object>(invoice.TemplateDataJson),
                    totals = JsonSerializer.Deserialize<object>(invoice.TotalsJson),
                    comments = JsonSerializer.Deserialize<object>(invoice.CommentsJson),
                    status = invoice.Status,
                    metadata = JsonSerializer.Deserialize<object>(invoice.MetadataJson)
                },
                previewUrl = invoice.PreviewUrl,
                downloadUrl = invoice.DownloadUrl
            });
        }

        // GET /invoice - List all invoices
        [HttpGet]
        public IActionResult GetAll()
        {
            var invoices = _context.Invoices.ToList();
            return Ok(invoices);
        }

        // GET /invoice/exists?projectId=...&month=...&year=...
        [HttpGet("exists")]
        public IActionResult CheckInvoiceExists([FromQuery] string projectId, [FromQuery] string month, [FromQuery] int year)
        {
            var invoice = _context.Invoices.FirstOrDefault(i => i.ProjectId == projectId && i.Month == month && i.Year == year);
            if (invoice != null)
            {
                return Ok(new {
                    exists = true,
                    invoiceId = invoice.InvoiceConfigId,
                    previewUrl = invoice.PreviewUrl,
                    status = invoice.Status
                });
            }
            return Ok(new { exists = false });
        }

        // GET /invoice/{id}/download
        [HttpGet("{id}/download")]
        public IActionResult DownloadInvoice(string id)
        {
            // Placeholder: In a real app, return the PDF file or a download URL
            return NotFound("PDF download not implemented yet.");
        }

        // PUT /invoice/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateInvoiceStatus(string id, [FromBody] UpdateInvoiceStatusRequest request)
        {
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceConfigId == id);
            if (invoice == null)
                return NotFound();
            invoice.Status = request.Status;
            invoice.LastModifiedAt = DateTime.UtcNow;
            // Optionally, update comments/history in CommentsJson
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        // DELETE /invoice/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInvoice(string id)
        {
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceConfigId == id);
            if (invoice == null)
                return NotFound();
            _context.Invoices.Remove(invoice);
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }
    }
} 