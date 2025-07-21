import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get invoice ID from URL params
    const url = new URL(req.url)
    const invoiceId = url.searchParams.get('invoiceId')
    const action = url.searchParams.get('action') // 'preview' or 'download'
    
    if (!invoiceId) {
      return new Response('Invoice ID is required', { status: 400, headers: corsHeaders })
    }

    console.log(`Getting invoice PDF: ${invoiceId}, action: ${action}`)

    // Get invoice from database
    const { data: invoice, error: dbError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(`Invoice not found: ${dbError.message}`, { 
        status: 404, 
        headers: corsHeaders 
      })
    }

    if (!invoice.pdf_file_path) {
      return new Response('PDF file not found for this invoice', { 
        status: 404, 
        headers: corsHeaders 
      })
    }

    // Get signed URL for the PDF
    const expiryTime = action === 'download' ? 300 : 3600 // 5 minutes for download, 1 hour for preview
    const { data: signedUrlData, error: storageError } = await supabase.storage
      .from('invoices')
      .createSignedUrl(invoice.pdf_file_path, expiryTime)

    if (storageError) {
      console.error('Storage error:', storageError)
      return new Response(`Storage error: ${storageError.message}`, { 
        status: 500, 
        headers: corsHeaders 
      })
    }

    // For preview, return the signed URL
    if (action === 'preview') {
      return new Response(JSON.stringify({
        success: true,
        previewUrl: signedUrlData.signedUrl,
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoice_number,
          projectId: invoice.project_id,
          status: invoice.status,
          totalAmount: invoice.total_amount,
          createdAt: invoice.created_at,
          configuration: invoice.configuration
        }
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      })
    }

    // For download, return the signed URL with download disposition
    if (action === 'download') {
      return new Response(JSON.stringify({
        success: true,
        downloadUrl: signedUrlData.signedUrl,
        fileName: `Invoice_${invoice.invoice_number}.pdf`
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      })
    }

    // Default response
    return new Response(JSON.stringify({
      success: true,
      signedUrl: signedUrlData.signedUrl,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        projectId: invoice.project_id,
        status: invoice.status,
        totalAmount: invoice.total_amount,
        createdAt: invoice.created_at
      }
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    })

  } catch (error) {
    console.error('Error getting invoice PDF:', error)
    return new Response(`Error: ${error.message}`, { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})