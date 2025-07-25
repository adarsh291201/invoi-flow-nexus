using Microsoft.AspNetCore.Mvc;
using InvoiceGenerator.API.Data;
using InvoiceGenerator.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Threading.Tasks;
using System.Linq;
using System;
using InvoiceGenerator.API.Models;
using InvoiceGenerator.API.Services;
using System.IO;
using Newtonsoft.Json.Linq;
using RazorLight;
using System.Dynamic;
using System.Collections.Generic;

namespace InvoiceGenerator.API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class InvoiceController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly PdfService _pdfService;
        public InvoiceController(AppDbContext context, PdfService pdfService) { _context = context; _pdfService = pdfService; }

        // POST /invoice - Save/Generate Invoice
        [HttpPost]
        public async Task<IActionResult> GenerateOrUpdateInvoice([FromBody] InvoiceGenerationRequest request)
        {
            // Debug: Log the raw incoming payload
            Console.WriteLine("=== RAW INCOMING INVOICE PAYLOAD ===");
            Console.WriteLine(System.Text.Json.JsonSerializer.Serialize(request.Configuration));
            Console.WriteLine("====================================");

            if (request?.Configuration == null)
                return BadRequest("Invalid invoice configuration.");

            var config = request.Configuration;
            var now = DateTime.UtcNow;

            // Try to find existing invoice by business ID
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceConfigId == config.Id);

            if (invoice == null)
            {
                // Insert new
                invoice = new Invoice
                {
                    InvoiceConfigId = config.Id,
                    CreatedAt = now,
                    Status = "L1 Pending" // Always set for new invoices
                };
                _context.Invoices.Add(invoice);
            }

            // Update all fields
            invoice.ProjectId = config.ProjectId;
            invoice.AccountId = config.AccountId;
            invoice.Template = config.Template;
            invoice.Month = config.Month;
            invoice.Year = config.Year;
            invoice.CommonDataJson = JsonSerializer.Serialize(config.CommonData);
            invoice.TemplateDataJson = JsonSerializer.Serialize(config.TemplateData);
            invoice.TotalsJson = JsonSerializer.Serialize(config.Totals);
            invoice.CommentsJson = JsonSerializer.Serialize(config.Comments);
            // Only allow status update from frontend for existing invoices
            if (invoice.Id != 0 && !string.IsNullOrEmpty(config.Status))
            {
                invoice.Status = config.Status;
            }
            invoice.MetadataJson = JsonSerializer.Serialize(config.Metadata);
            invoice.PreviewUrl = $"/invoice/{config.Id}/preview";
            invoice.DownloadUrl = $"/invoice/{config.Id}/download";
            invoice.LastModifiedAt = now;

            await _context.SaveChangesAsync();

            // Generate HTML and PDF using RazorLight
            var templateDir = Path.Combine(AppContext.BaseDirectory, "Templates");
            var engine = new RazorLightEngineBuilder()
                .UseFileSystemProject(templateDir)
                .UseMemoryCachingProvider()
                .Build();
            dynamic model = new ExpandoObject();
            model.Id = config.Id;
            model.ProjectId = config.ProjectId;
            model.AccountId = config.AccountId;
            model.Template = config.Template;
            model.Month = config.Month;
            model.Year = config.Year;
            model.CommonData = ToExpando(config.CommonData);
            model.TemplateData = RecursivelyToExpando(config.TemplateData);
            model.Totals = ToExpando(config.Totals);
            model.Comments = config.Comments;
            model.Status = config.Status;
            model.Metadata = ToExpando(config.Metadata);
            // Debug: Log the TemplateData structure
            Console.WriteLine("=== TEMPLATE DATA STRUCTURE ===");
            Console.WriteLine(JsonSerializer.Serialize(model.TemplateData));
            Console.WriteLine("===============================");
            string html = await engine.CompileRenderAsync("InvoiceTemplate.cshtml", model);
            // Debug: Log the generated HTML
            Console.WriteLine("=== GENERATED HTML FROM RAZOR ===");
            Console.WriteLine(html);
            Console.WriteLine("=================================");
            var pdfBytes = _pdfService.GenerateInvoicePdfFromHtml(html);
            _pdfService.SaveInvoicePdf(config.Id, pdfBytes);

            return Ok(new {
                success = true,
                invoiceId = invoice.InvoiceConfigId,
                previewUrl = invoice.PreviewUrl,
                downloadUrl = invoice.DownloadUrl
            });
        }

        // GET /invoice/project/{projectId} - Get all invoices for a specific project
        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetInvoicesByProject(string projectId)
        {
            var invoices = await _context.Invoices
                .Where(i => i.ProjectId == projectId)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            return Ok(invoices);
        }

        [HttpGet]
        public IActionResult GetAll()
        {
            var invoices = _context.Invoices.ToList();
            return Ok(invoices);
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
            // PDF files are saved in the 'Invoices' directory with the invoiceId as filename
            var pdfPath = _pdfService.GetInvoicePdfPath(id);
            if (!System.IO.File.Exists(pdfPath))
                return NotFound("PDF not found.");
            var fileBytes = System.IO.File.ReadAllBytes(pdfPath);
            return File(fileBytes, "application/pdf", $"{id}.pdf");
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

        // PUT /invoice/{id} - Update all invoice fields
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInvoice(string id, [FromBody] InvoiceConfiguration config)
        {
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceConfigId == id);
            if (invoice == null)
                return NotFound();

            invoice.ProjectId = config.ProjectId;
            invoice.AccountId = config.AccountId;
            invoice.Template = config.Template;
            invoice.Month = config.Month;
            invoice.Year = config.Year;
            invoice.CommonDataJson = JsonSerializer.Serialize(config.CommonData);
            invoice.TemplateDataJson = JsonSerializer.Serialize(config.TemplateData);
            invoice.TotalsJson = JsonSerializer.Serialize(config.Totals);
            invoice.CommentsJson = JsonSerializer.Serialize(config.Comments);
            invoice.Status = config.Status;
            invoice.MetadataJson = JsonSerializer.Serialize(config.Metadata);
            invoice.LastModifiedAt = DateTime.UtcNow;
            // Optionally update PreviewUrl/DownloadUrl if template/id changes
            invoice.PreviewUrl = $"/invoice/{invoice.InvoiceConfigId}/preview";
            invoice.DownloadUrl = $"/invoice/{invoice.InvoiceConfigId}/download";

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

        // POST /invoice/{id}/comment - Add a comment to an invoice
        [HttpPost("{id}/comment")]
        public async Task<IActionResult> AddComment(string id, [FromBody] AddCommentRequest request)
        {
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceConfigId == id);
            if (invoice == null)
                return NotFound();
            var comments = new List<Comment>();
            if (!string.IsNullOrEmpty(invoice.CommentsJson))
            {
                try { comments = JsonSerializer.Deserialize<List<Comment>>(invoice.CommentsJson) ?? new List<Comment>(); } catch { }
            }
            var newComment = new Comment
            {
                CommentText = request.Comment,
                UserName = request.UserName,
                UserRole = request.UserRole,
                UserId = request.UserId,
                Date = DateTime.UtcNow
            };
            comments.Add(newComment);
            invoice.CommentsJson = JsonSerializer.Serialize(comments);
            invoice.LastModifiedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        // GET /invoice/{id}/comments - Get all comments for an invoice
        [HttpGet("{id}/comments")]
        public async Task<IActionResult> GetComments(string id)
        {
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceConfigId == id);
            if (invoice == null)
                return NotFound();
            var comments = new List<Comment>();
            if (!string.IsNullOrEmpty(invoice.CommentsJson))
            {
                try { comments = JsonSerializer.Deserialize<List<Comment>>(invoice.CommentsJson) ?? new List<Comment>(); } catch { }
            }
            // Return most recent first
            comments = comments.OrderByDescending(c => c.Date).ToList();
            return Ok(comments);
        }

        // PUT /invoice/{id}/approve - Approve invoice at current stage
        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApproveInvoice(string id, [FromBody] ApprovalRequest request)
        {
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceConfigId == id);
            if (invoice == null)
                return NotFound();
            var currentStatus = invoice.Status;
            string newStatus = currentStatus;
            if (currentStatus == "L1 Pending" && request.UserRole == "L1")
                newStatus = "L2 Pending";
            else if (currentStatus == "L2 Pending" && request.UserRole == "L2")
                newStatus = "L3 Pending";
            else if (currentStatus == "L3 Pending" && request.UserRole == "L3")
                newStatus = "Ready for Dispatch";
            else if (currentStatus == "PM Pending" && request.UserRole == "PM")
                newStatus = "L1 Pending";
            else
                return BadRequest("Invalid approval action for current status/user role.");
            invoice.Status = newStatus;
            invoice.LastModifiedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { success = true, status = newStatus });
        }

        // PUT /invoice/{id}/reject - Reject invoice at current stage
        [HttpPut("{id}/reject")]
        public async Task<IActionResult> RejectInvoice(string id, [FromBody] ApprovalRequest request)
        {
            // if (string.IsNullOrWhiteSpace(request.Reason))
            //     return BadRequest("Reason is required for rejection.");
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceConfigId == id);
            if (invoice == null)
                return NotFound();
            var currentStatus = invoice.Status;
            string newStatus = currentStatus;
            if (currentStatus == "L2 Pending" && request.UserRole == "L2")
                newStatus = "L1 Pending";
            else if (currentStatus == "L3 Pending" && request.UserRole == "L3")
                newStatus = "L2 Pending";
            else
                return BadRequest("Invalid reject action for current status/user role.");
            invoice.Status = newStatus;
            invoice.LastModifiedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { success = true, status = newStatus });
        }

        // PUT /invoice/{id}/pm-request - L1 requests PM intervention
        [HttpPut("{id}/pm-request")]
        public async Task<IActionResult> PMRequestInvoice(string id, [FromBody] ApprovalRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Reason))
                return BadRequest("Reason is required for PM request.");
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceConfigId == id);
            if (invoice == null)
                return NotFound();
            if (invoice.Status != "L1 Pending" || request.UserRole != "L1")
                return BadRequest("Only L1 can request PM intervention when status is L1 Pending.");
            invoice.Status = "PM Pending";
            invoice.LastModifiedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { success = true, status = "PM Pending" });
        }

        public class AddCommentRequest
        {
            public string Comment { get; set; }
            public string UserName { get; set; }
            public string UserRole { get; set; }
            public string UserId { get; set; }
        }
        public class Comment
        {
            public string CommentText { get; set; }
            public string UserName { get; set; }
            public string UserRole { get; set; }
            public string UserId { get; set; }
            public DateTime Date { get; set; }
        }

        public class ApprovalRequest
        {
            public string UserId { get; set; }
            public string UserRole { get; set; }
            public string? Reason { get; set; } // No [Required] attribute
        }

        // Helper to convert object to ExpandoObject for RazorLight
        private static ExpandoObject ToExpando(object obj)
        {
            if (obj is ExpandoObject) return (ExpandoObject)obj;
            var json = JsonSerializer.Serialize(obj);
            return JsonSerializer.Deserialize<ExpandoObject>(json);
        }

        // Recursively convert all nested objects to ExpandoObject
        private static object RecursivelyToExpando(object obj)
        {
            if (obj is ExpandoObject) return obj;
            if (obj is string s)
            {
                try { return JsonSerializer.Deserialize<ExpandoObject>(s); } catch { }
            }
            if (obj is System.Text.Json.JsonElement je)
            {
                if (je.ValueKind == System.Text.Json.JsonValueKind.Array)
                {
                    var list = new List<object>();
                    foreach (var item in je.EnumerateArray())
                        list.Add(RecursivelyToExpando(item));
                    return list;
                }
                if (je.ValueKind == System.Text.Json.JsonValueKind.Object)
                {
                    var dict = new Dictionary<string, object>();
                    foreach (var prop in je.EnumerateObject())
                        dict[prop.Name] = RecursivelyToExpando(prop.Value);
                    IDictionary<string, object> expando = new ExpandoObject();
                    foreach (var kv in dict)
                        expando[kv.Key] = kv.Value;
                    return (ExpandoObject)expando;
                }
                if (je.ValueKind == System.Text.Json.JsonValueKind.String)
                    return je.GetString();
                if (je.ValueKind == System.Text.Json.JsonValueKind.Number)
                {
                    if (je.TryGetInt64(out long l)) return l;
                    if (je.TryGetDecimal(out decimal d)) return d;
                    return je.GetDouble();
                }
                if (je.ValueKind == System.Text.Json.JsonValueKind.True)
                    return true;
                if (je.ValueKind == System.Text.Json.JsonValueKind.False)
                    return false;
                if (je.ValueKind == System.Text.Json.JsonValueKind.Null)
                    return null;
            }
            if (obj is IEnumerable<object> listObj)
                return listObj.Select(RecursivelyToExpando).ToList();
            if (obj is IDictionary<string, object> dictObj)
            {
                var expando = new ExpandoObject() as IDictionary<string, object>;
                foreach (var kv in dictObj)
                    expando[kv.Key] = RecursivelyToExpando(kv.Value);
                return expando;
            }
            return obj;
        }
    }
} 