using Microsoft.EntityFrameworkCore;
using InvoiceGenerator.API.Models;

namespace InvoiceGenerator.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
        public DbSet<RateMatrix> RateMatrices { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<Project> Projects { get; set; }
    }
}