using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InvoiceGenerator.API.Models
{
    public class RateMatrix
    {
        [Key]
        public int Id { get; set; }
        [Column(TypeName = "nvarchar(100)")]
        public string ProjectId { get; set; }
        [Column(TypeName = "nvarchar(200)")]
        public string ProjectName { get; set; }
        [Column(TypeName = "nvarchar(100)")]
        public string AccountId { get; set; }
        [Column(TypeName = "nvarchar(200)")]
        public string AccountName { get; set; }
        public int ResourceId { get; set; }
        public string? ResourceName { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal StandardRate { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal WeekendRate { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal OTRate { get; set; }
        [Column(TypeName = "datetime2")]
        public DateTime StartDate { get; set; }
        [Column(TypeName = "datetime2")]
        public DateTime EndDate { get; set; }
    }
}