using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;
using System.IO;
using InvoiceGenerator.API.Models;

namespace InvoiceGenerator.API.Services
{
    public class PdfService
    {
        public byte[] GenerateInvoicePdf(InvoiceConfiguration config)
        {
            // Example: create a simple PDF with invoice number and client
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(30);
                    page.Content()
                        .Column(col =>
                        {
                            col.Item().Text($"Invoice Number: {config.Id}").FontSize(20).Bold();
                            col.Item().Text($"Project: {config.ProjectId}");
                            col.Item().Text($"Account: {config.AccountId}");
                            col.Item().Text($"Month: {config.Month} {config.Year}");
                            col.Item().Text($"Status: {config.Status}");
                            col.Item().Text($"Generated: {DateTime.UtcNow}");
                            // You can add more fields and layout as needed
                        });
                });
            });

            return document.GeneratePdf();
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