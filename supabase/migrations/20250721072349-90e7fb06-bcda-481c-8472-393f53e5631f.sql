-- Create storage bucket for invoice PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false);

-- Create storage policies for invoice access
CREATE POLICY "Users can view their own invoices" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own invoices" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own invoices" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own invoices" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  project_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  template_type TEXT NOT NULL,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  configuration JSONB NOT NULL,
  pdf_file_path TEXT,
  pdf_file_size BIGINT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  generated_at TIMESTAMP WITH TIME ZONE,
  due_date DATE
);

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for invoices
CREATE POLICY "Users can view their own invoices" 
ON public.invoices 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own invoices" 
ON public.invoices 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own invoices" 
ON public.invoices 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own invoices" 
ON public.invoices 
FOR DELETE 
USING (auth.uid() = created_by);

-- Create invoice comments table
CREATE TABLE public.invoice_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  comment_type TEXT NOT NULL CHECK (comment_type IN ('question', 'clarification', 'correction')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on invoice comments
ALTER TABLE public.invoice_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for invoice comments
CREATE POLICY "Users can view comments on their invoices" 
ON public.invoice_comments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_comments.invoice_id 
    AND invoices.created_by = auth.uid()
  )
);

CREATE POLICY "Users can create comments on their invoices" 
ON public.invoice_comments 
FOR INSERT 
WITH CHECK (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_comments.invoice_id 
    AND invoices.created_by = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_invoices_project_id ON public.invoices(project_id);
CREATE INDEX idx_invoices_account_id ON public.invoices(account_id);
CREATE INDEX idx_invoices_created_by ON public.invoices(created_by);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoice_comments_invoice_id ON public.invoice_comments(invoice_id);