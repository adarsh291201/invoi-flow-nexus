import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvoiceConfiguration {
  id: string;
  projectId: string;
  accountId: string;
  template: string;
  month: string;
  year: number;
  commonData: {
    companyName: string;
    companyAddress: string;
    billTo: string;
    invoiceNumber: string;
    invoiceDate: string;
    paymentTerms: string;
    phoneNumber: string;
    billingPeriod: string;
  };
  templateData: any;
  totals: {
    subtotal: number;
    tax: number;
    total: number;
  };
  comments: any[];
  status: string;
  metadata: {
    createdBy: string;
    createdAt: string;
    lastModifiedBy: string;
    lastModifiedAt: string;
  };
}

function generateHTMLContent(config: InvoiceConfiguration): string {
  const { commonData, templateData, totals } = config;
  
  // Get template data based on template type
  let tableRows = '';
  let headers = ['S.No.', 'Name', 'Project', 'Role', 'Rate', 'Hours', 'Amount'];
  
  switch (config.template) {
    case 'template1':
      headers = ['S.No.', 'Name', 'Project', 'Role', 'Rate', 'Hours', 'Amount'];
      if (templateData.template1) {
        tableRows = templateData.template1.map((item: any, index: number) => `
          <tr>
            <td>${item.sNo}</td>
            <td>${item.name}</td>
            <td>${item.project}</td>
            <td>${item.role}</td>
            <td>$${item.rate}</td>
            <td>${item.hrsWorked}</td>
            <td>$${item.amount.toLocaleString()}</td>
          </tr>
        `).join('');
      }
      break;
    case 'template2':
      headers = ['S.No.', 'Name', 'Role', 'Rate', 'Hours', 'Amount'];
      if (templateData.template2) {
        tableRows = templateData.template2.map((item: any) => `
          <tr>
            <td>${item.sNo}</td>
            <td>${item.name}</td>
            <td>${item.role}</td>
            <td>$${item.rate}</td>
            <td>${item.hrsWorked}</td>
            <td>$${item.amount.toLocaleString()}</td>
          </tr>
        `).join('');
      }
      break;
    case 'template3':
      headers = ['S.No.', 'Description', 'Amount'];
      if (templateData.template3) {
        tableRows = templateData.template3.map((item: any) => `
          <tr>
            <td>${item.sNo}</td>
            <td>${item.description}</td>
            <td>$${item.amount.toLocaleString()}</td>
          </tr>
        `).join('');
      }
      break;
    // Add more template cases as needed
  }

  const headerRow = headers.map(header => `<th>${header}</th>`).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${commonData.invoiceNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }
        .header {
          background: linear-gradient(90deg, #fbb040 0%, #fbb040 40%, #0a2c5a 40%, #0a2c5a 100%);
          padding: 20px;
          color: white;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
        }
        .content {
          padding: 30px;
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .company-info h1 {
          font-size: 20px;
          font-weight: bold;
          margin: 0 0 10px 0;
        }
        .company-info p {
          margin: 2px 0;
          font-size: 14px;
        }
        .invoice-details {
          text-align: right;
        }
        .invoice-number {
          background: #0a2c5a;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: bold;
          margin-bottom: 10px;
          display: inline-block;
        }
        .invoice-meta {
          display: flex;
          justify-content: space-between;
          margin: 20px 0;
          font-size: 14px;
        }
        .meta-item strong {
          color: #fbb040;
        }
        .billing-period {
          color: #fbb040;
          font-weight: bold;
          margin: 20px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background: #fbb040;
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-weight: bold;
          border: 1px solid #ddd;
        }
        td {
          padding: 12px 8px;
          border: 1px solid #ddd;
        }
        tr:nth-child(even) {
          background: #f9f9f9;
        }
        .total-section {
          text-align: right;
          margin-top: 20px;
        }
        .total-amount {
          background: #0a2c5a;
          color: white;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 18px;
          display: inline-block;
        }
        .footer {
          text-align: right;
          font-size: 12px;
          color: #0a2c5a;
          margin-top: 20px;
        }
        .bill-to {
          margin: 20px 0;
        }
        .bill-to strong {
          color: #0a2c5a;
          display: block;
          margin-bottom: 5px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="header">
          <div class="company-name">paltech</div>
        </div>
        
        <div class="content">
          <div class="invoice-header">
            <div class="company-info">
              <h1>${commonData.companyName}</h1>
              <p>${commonData.companyAddress.split(',')[0]}</p>
              <p>${commonData.companyAddress.split(',').slice(1).join(',')}</p>
              
              <div class="bill-to">
                <strong>Bill To:</strong>
                <div>${commonData.billTo.replace(/\n/g, '<br>')}</div>
              </div>
            </div>
            
            <div class="invoice-details">
              <div class="invoice-number">
                INVOICE<br>
                <span style="font-weight: normal; font-size: 12px;">${commonData.invoiceNumber}</span>
              </div>
            </div>
          </div>
          
          <div class="invoice-meta">
            <div class="meta-item">
              <strong>Invoice Date</strong><br>
              ${commonData.invoiceDate}
            </div>
            <div class="meta-item">
              <strong>Payment Terms</strong><br>
              ${commonData.paymentTerms}
            </div>
            <div class="meta-item">
              <strong>Phone</strong><br>
              ${commonData.phoneNumber}
            </div>
          </div>
          
          <div class="billing-period">
            Billing Period: <span style="color: #333;">${commonData.billingPeriod}</span>
          </div>
          
          <table>
            <thead>
              <tr>${headerRow}</tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          
          <div class="total-section">
            <div style="margin-bottom: 10px;">
              <strong>Subtotal: $${totals.subtotal.toLocaleString()}</strong>
            </div>
            <div style="margin-bottom: 10px;">
              <strong>Tax: $${totals.tax.toLocaleString()}</strong>
            </div>
            <div class="total-amount">
              Total: $${totals.total.toLocaleString()}
            </div>
          </div>
          
          <div class="footer">
            Email to invoice@pal.tech in case of any queries
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function generatePDFFromHTML(html: string): Promise<Uint8Array> {
  // For demonstration, we'll return a simple PDF placeholder
  // In production, you would use a service like Puppeteer or similar
  const encoder = new TextEncoder();
  return encoder.encode(`PDF Content for Invoice - ${Date.now()}`);
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = 'https://fxnpnmvvyktljkmukkei.supabase.co'
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // Parse request body
    const { configuration } = await req.json()
    
    if (!configuration) {
      return new Response('Configuration is required', { status: 400, headers: corsHeaders })
    }

    console.log('Generating PDF for invoice:', configuration.id)

    // Generate HTML content
    const htmlContent = generateHTMLContent(configuration)
    
    // Generate PDF (placeholder - in production use actual PDF generation)
    const pdfBuffer = await generatePDFFromHTML(htmlContent)
    
    // Create file path for storage
    const userId = 'demo-user' // In production, extract from JWT
    const fileName = `${configuration.id}_${Date.now()}.pdf`
    const filePath = `${userId}/${fileName}`
    
    // Upload PDF to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return new Response(`Storage error: ${uploadError.message}`, { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    // Save invoice record to database
    const { data: invoiceData, error: dbError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: configuration.commonData.invoiceNumber,
        project_id: configuration.projectId,
        account_id: configuration.accountId,
        template_type: configuration.template,
        month: configuration.month,
        year: configuration.year,
        status: 'generated',
        total_amount: configuration.totals.total,
        configuration: configuration,
        pdf_file_path: filePath,
        pdf_file_size: pdfBuffer.length,
        generated_at: new Date().toISOString(),
        created_by: userId // In production, extract from JWT
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('invoices').remove([filePath])
      return new Response(`Database error: ${dbError.message}`, { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    // Get signed URL for the PDF
    const { data: signedUrlData } = await supabase.storage
      .from('invoices')
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    console.log('Invoice PDF generated successfully:', invoiceData.id)

    return new Response(JSON.stringify({
      success: true,
      invoiceId: invoiceData.id,
      downloadUrl: signedUrlData?.signedUrl,
      previewUrl: signedUrlData?.signedUrl,
      filePath: filePath
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    })

  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return new Response(`Error: ${error.message}`, { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})