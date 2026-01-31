-- Migration: Add Balance Payment Support to Card Packages
-- Date: 2026-01-31
-- Description: Adds profit margin field for balance payment method

-- Add profit margin for balance payment
ALTER TABLE public.card_packages 
ADD COLUMN IF NOT EXISTS "profitMarginBalance" NUMERIC DEFAULT 0;

-- Update existing packages with default value
UPDATE public.card_packages 
SET "profitMarginBalance" = 0 
WHERE "profitMarginBalance" IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.card_packages."profitMarginBalance" IS 'Profit margin percentage for balance payment method';
