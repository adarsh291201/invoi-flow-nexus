namespace InvoiceGenerator.API.Models
{
    public class InvoiceGenerationRequest
    {
        public InvoiceConfiguration Configuration { get; set; }
        public string Format { get; set; }
        public bool IncludeAttachments { get; set; }
    }

    public class InvoiceConfiguration
    {
        public string Id { get; set; }
        public string ProjectId { get; set; }
        public string AccountId { get; set; }
        public string Template { get; set; }
        public string Month { get; set; }
        public int Year { get; set; }
        public object CommonData { get; set; }
        public object TemplateData { get; set; }
        public object Totals { get; set; }
        public object Comments { get; set; }
        public string Status { get; set; }
        public object Metadata { get; set; }
    }

    public class UpdateInvoiceStatusRequest
    {
        public string Status { get; set; }
        public string? Comment { get; set; }
    }

    public class InvoiceCommonData
    {
        public string CompanyName { get; set; }
        public string CompanyAddress { get; set; }
        public string BillTo { get; set; }
        public string InvoiceNumber { get; set; }
        public string InvoiceDate { get; set; }
        public string PaymentTerms { get; set; }
        public string PhoneNumber { get; set; }
        public string BillingPeriod { get; set; }
    }
} 