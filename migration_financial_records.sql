-- Migration Script: Financial Records Enhancement
-- Created: 2026-01-31
-- Description: Adds account type classification for creditors, transaction system for temporary users,
--              and separate exchange rates for cards and products

-- ============================================
-- 1. Add accountType to External Debts
-- ============================================
ALTER TABLE public.externalDebts_v4 
ADD COLUMN IF NOT EXISTS "accountType" TEXT DEFAULT 'cash';

COMMENT ON COLUMN public.externalDebts_v4."accountType" IS 'Type of account: cash, bank, or usd';

-- ============================================
-- 2. Create Temporary User Transactions Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.temp_user_transactions_v4 (
    id TEXT PRIMARY KEY,
    "tempOrderId" TEXT,
    "subOrderId" TEXT,
    "customerName" TEXT,
    amount NUMERIC,
    date TEXT,
    type TEXT, -- 'invoice' or 'payment'
    "accountType" TEXT, -- 'cash' or 'bank'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.temp_user_transactions_v4 ENABLE ROW LEVEL SECURITY;

-- Create Policy
CREATE POLICY "Enable all access for all users" ON public.temp_user_transactions_v4 
FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE public.temp_user_transactions_v4 IS 'Financial transactions for temporary users';

-- ============================================
-- 3. Add Separate Exchange Rates to Settings
-- ============================================

-- Cards exchange rates
ALTER TABLE public.settings_v4 
ADD COLUMN IF NOT EXISTS "cardsExchangeRateCash" NUMERIC DEFAULT 1;

ALTER TABLE public.settings_v4 
ADD COLUMN IF NOT EXISTS "cardsExchangeRateBank" NUMERIC DEFAULT 1;

ALTER TABLE public.settings_v4 
ADD COLUMN IF NOT EXISTS "cardsExchangeRateBalance" NUMERIC DEFAULT 1;

-- Products exchange rates
ALTER TABLE public.settings_v4 
ADD COLUMN IF NOT EXISTS "productsExchangeRateCash" NUMERIC DEFAULT 1;

ALTER TABLE public.settings_v4 
ADD COLUMN IF NOT EXISTS "productsExchangeRateBank" NUMERIC DEFAULT 1;

ALTER TABLE public.settings_v4 
ADD COLUMN IF NOT EXISTS "productsExchangeRateBalance" NUMERIC DEFAULT 1;

-- Add comments
COMMENT ON COLUMN public.settings_v4."cardsExchangeRateCash" IS 'Exchange rate for cards purchased with cash';
COMMENT ON COLUMN public.settings_v4."cardsExchangeRateBank" IS 'Exchange rate for cards purchased via bank';
COMMENT ON COLUMN public.settings_v4."cardsExchangeRateBalance" IS 'Exchange rate for cards purchased with wallet balance';
COMMENT ON COLUMN public.settings_v4."productsExchangeRateCash" IS 'Exchange rate for products purchased with cash';
COMMENT ON COLUMN public.settings_v4."productsExchangeRateBank" IS 'Exchange rate for products purchased via bank';
COMMENT ON COLUMN public.settings_v4."productsExchangeRateBalance" IS 'Exchange rate for products purchased with wallet balance';

-- ============================================
-- 4. Initialize default values for existing settings
-- ============================================
-- Copy the current exchangeRate to all new fields as default
UPDATE public.settings_v4 
SET 
    "cardsExchangeRateCash" = COALESCE("exchangeRate", 1),
    "cardsExchangeRateBank" = COALESCE("exchangeRate", 1),
    "cardsExchangeRateBalance" = COALESCE("exchangeRate", 1),
    "productsExchangeRateCash" = COALESCE("exchangeRate", 1),
    "productsExchangeRateBank" = COALESCE("exchangeRate", 1),
    "productsExchangeRateBalance" = COALESCE("exchangeRate", 1)
WHERE "cardsExchangeRateCash" IS NULL 
   OR "cardsExchangeRateBank" IS NULL 
   OR "cardsExchangeRateBalance" IS NULL
   OR "productsExchangeRateCash" IS NULL
   OR "productsExchangeRateBank" IS NULL
   OR "productsExchangeRateBalance" IS NULL;

-- ============================================
-- Migration Complete
-- ============================================
