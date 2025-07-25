using System;
using System.IO;
using InvoiceGenerator.API.Models;
using DinkToPdf;
using DinkToPdf.Contracts;

namespace InvoiceGenerator.API.Services
{
    public class PdfService
    {
        private readonly IConverter _converter;
        public PdfService(IConverter converter)
        {
            _converter = converter;
        }

        // Generate PDF from HTML string
        public byte[] GenerateInvoicePdfFromHtml(string html)
        {
            // Print the HTML safely for debugging
            Console.WriteLine("=== GENERATED HTML ===");
            Console.WriteLine(html);
            Console.WriteLine("======================");
            var doc = new HtmlToPdfDocument()
            {
                GlobalSettings = { PaperSize = PaperKind.A4 },
                Objects = { new ObjectSettings { HtmlContent = html } }
            };
            return _converter.Convert(doc);
        }

        public void SaveInvoicePdf(string invoiceId, byte[] pdfBytes)
        {
            var dir = Path.Combine(Directory.GetCurrentDirectory(), "Invoices");
            if (!Directory.Exists(dir))
                Directory.CreateDirectory(dir);
            var filePath = Path.Combine(dir, $"{invoiceId}.pdf");
            File.WriteAllBytes(filePath, pdfBytes);
        }

        public string GetInvoicePdfPath(string invoiceId)
        {
            var dir = Path.Combine(Directory.GetCurrentDirectory(), "Invoices");
            return Path.Combine(dir, $"{invoiceId}.pdf");
        }
    }
} 