using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InvoiceGenerator.API.Models
{
    public class Invoice
    {
        [Key]
        public int Id { get; set; }
        [Column(TypeName = "nvarchar(max)")]
        public string InvoiceConfigId { get; set; } // Corresponds to InvoiceConfiguration.id
        [Column(TypeName = "nvarchar(max)")]
        public string ProjectId { get; set; }
        [Column(TypeName = "nvarchar(max)")]
        public string AccountId { get; set; }
        [Column(TypeName = "nvarchar(max)")]
        public string Template { get; set; }
        [Column(TypeName = "nvarchar(max)")]
        public string Month { get; set; }
        public int Year { get; set; }
        [Column(TypeName = "nvarchar(max)")]
        public string CommonDataJson { get; set; } // Store InvoiceCommonData as JSON
        [Column(TypeName = "nvarchar(max)")]
        public string TemplateDataJson { get; set; } // Store templateData as JSON
        [Column(TypeName = "nvarchar(max)")]
        public string TotalsJson { get; set; } // Store totals as JSON
        [Column(TypeName = "nvarchar(max)")]
        public string CommentsJson { get; set; } // Store comments as JSON
        [Column(TypeName = "nvarchar(max)")]
        public string Status { get; set; }
        [Column(TypeName = "nvarchar(max)")]
        public string MetadataJson { get; set; } // Store metadata as JSON
        [Column(TypeName = "nvarchar(max)")]
        public string PreviewUrl { get; set; }
        [Column(TypeName = "nvarchar(max)")]
        public string DownloadUrl { get; set; }
        [Column(TypeName = "datetime2")]
        public DateTime CreatedAt { get; set; }
        [Column(TypeName = "datetime2")]
        public DateTime LastModifiedAt { get; set; }
    }
} 