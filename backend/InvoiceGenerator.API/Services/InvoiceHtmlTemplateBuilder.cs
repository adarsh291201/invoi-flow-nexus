using InvoiceGenerator.API.Models;
using System.Text;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace InvoiceGenerator.API.Services
{
    public static class InvoiceHtmlTemplateBuilder
    {
        public static string Build(JObject invoiceJson, string svgLogo = null)
        {
            var sb = new StringBuilder();

            // Helper to get field from root or commonData
            string GetField(string field)
            {
                var val = invoiceJson[field]?.ToString();
                if (!string.IsNullOrEmpty(val)) return val;
                var common = invoiceJson["commonData"] as JObject;
                if (common != null && common[field] != null)
                    return common[field]?.ToString();
                return "";
            }

            // Extract all fields
            var companyName = GetField("companyName");
            if (string.IsNullOrEmpty(companyName)) companyName = GetField("CompanyName");
            var companyAddress = GetField("companyAddress");
            if (string.IsNullOrEmpty(companyAddress)) companyAddress = GetField("CompanyAddress");
            var phoneNumber = GetField("phoneNumber");
            if (string.IsNullOrEmpty(phoneNumber)) phoneNumber = GetField("PhoneNumber");
            var billTo = GetField("billTo");
            if (string.IsNullOrEmpty(billTo)) billTo = GetField("BillTo");
            var invoiceDate = GetField("invoiceDate");
            if (string.IsNullOrEmpty(invoiceDate)) invoiceDate = GetField("InvoiceDate");
            var invoiceNumber = GetField("invoiceNumber");
            if (string.IsNullOrEmpty(invoiceNumber)) invoiceNumber = GetField("InvoiceNumber");
            var paymentTerms = GetField("paymentTerms");
            if (string.IsNullOrEmpty(paymentTerms)) paymentTerms = GetField("PaymentTerms");
            var billingPeriod = GetField("billingPeriod");
            if (string.IsNullOrEmpty(billingPeriod)) billingPeriod = GetField("BillingPeriod");

            // Extract templateData
            var templateData = invoiceJson["templateData"] as JObject;
            var templateKey = invoiceJson["template"]?.ToString();

            sb.AppendLine("<html><head><style>");
            sb.AppendLine("body { font-family: Arial, sans-serif; font-size: 12px; color: #222; }");
            sb.AppendLine(".header { background: #003366; color: #fff; padding: 20px; position: relative; }");
            sb.AppendLine(".logo { position: absolute; top: 10px; right: 30px; width: 200px; text-align: right; }");
            sb.AppendLine(".meta-table { border-collapse: collapse; width: 100%; margin-top: 20px; }");
            sb.AppendLine(".meta-table th, .meta-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }");
            sb.AppendLine(".meta-table th { background: #f4a460; color: #222; }");
            sb.AppendLine(".totals { font-weight: bold; background: #003366; color: #fff; }");
            sb.AppendLine(".invoice-table { border-collapse: collapse; width: 100%; margin-top: 20px; }");
            sb.AppendLine(".invoice-table th, .invoice-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }");
            sb.AppendLine(".invoice-table th { background: #f4a460; color: #222; }");
            sb.AppendLine(".footer { margin-top: 20px; font-size: 11px; color: #333; }");
            sb.AppendLine("</style></head><body>");

            // Header with logo
            sb.AppendLine("<div class='header'>");
            sb.AppendLine($"<div style='float:left'><h2>{companyName}</h2><div>{companyAddress}</div><div>{phoneNumber}</div></div>");
            sb.AppendLine($"<div class='logo'>{(svgLogo ?? "<b>LOGO</b>")}</div>");
            sb.AppendLine("<div style='clear:both'></div></div>");

            // Invoice meta
            sb.AppendLine("<table class='meta-table'><tr>");
            sb.AppendLine($"<th>Invoice Date:</th><td>{invoiceDate}</td>");
            sb.AppendLine($"<th>Payment Terms:</th><td>{paymentTerms}</td>");
            sb.AppendLine($"<th>Invoice #:</th><td>{invoiceNumber}</td>");
            sb.AppendLine("</tr></table>");

            // Bill To and Billing Period
            sb.AppendLine($"<div style='margin-top:10px;'><b>Bill To:</b><br/>{(billTo ?? "").Replace("\n", "<br/>")}</div>");
            sb.AppendLine($"<div style='margin-top:10px;'><b>Billing Period:</b> {billingPeriod}</div>");

            // Dynamic Table
            if (templateData != null && templateKey != null && templateData[templateKey] is JArray tableArray && tableArray.Count > 0)
            {
                var firstRow = tableArray[0] as JObject;
                var columns = firstRow?.Properties().Select(p => p.Name).ToList();
                if (columns != null)
                {
                    sb.AppendLine("<table class='invoice-table'><tr>");
                    foreach (var col in columns)
                        sb.AppendLine($"<th>{col}</th>");
                    sb.AppendLine("</tr>");
                    foreach (JObject row in tableArray)
                    {
                        sb.AppendLine("<tr>");
                        foreach (var col in columns)
                            sb.AppendLine($"<td>{row[col]}</td>");
                        sb.AppendLine("</tr>");
                    }
                    sb.AppendLine("</table>");
                }
            }

            // Totals
            if (templateData != null && templateData["totals"] is JObject totals)
            {
                sb.AppendLine("<table style='margin-top:10px; float:right; width: 300px;'><tr>");
                foreach (var prop in totals.Properties())
                {
                    sb.AppendLine($"<tr><td class='totals'>{prop.Name}</td><td class='totals'>{prop.Value}</td></tr>");
                }
                sb.AppendLine("</tr></table>");
            }

            // Footer
            sb.AppendLine("<div class='footer'>Email to invoice@pal.tech in case of any queries</div>");
            sb.AppendLine("</body></html>");
            return sb.ToString();
        }
    }
} 