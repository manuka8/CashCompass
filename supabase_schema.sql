-- =======================================================
-- CashCompass Supabase Database Schema Migration
-- Run this in your Supabase Dashboard -> SQL Editor
-- =======================================================

-- 1. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Income', 'Expense', 'Transfer')),
    category TEXT NOT NULL,
    sub_category TEXT NOT NULL,
    note TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast user transactions lookup by date
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Transactions RLS Policies
CREATE POLICY "Users can view their own transactions" 
ON public.transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" 
ON public.transactions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" 
ON public.transactions FOR DELETE 
USING (auth.uid() = user_id);


-- 2. Create Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('Expense', 'Income', 'Category')),
    period TEXT NOT NULL CHECK (period IN ('Daily', 'Weekly', 'Monthly', 'Yearly', 'Specified Date')),
    category TEXT,
    min_amount NUMERIC(12, 2),
    max_amount NUMERIC(12, 2),
    start_date TEXT,
    end_date TEXT,
    is_blocking BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budgets_user ON public.budgets(user_id);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Budgets RLS Policies
CREATE POLICY "Users can view their own budgets" 
ON public.budgets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets" 
ON public.budgets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets" 
ON public.budgets FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets" 
ON public.budgets FOR DELETE 
USING (auth.uid() = user_id);


-- 3. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'Budget Warning',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications RLS Policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications FOR DELETE 
USING (auth.uid() = user_id);

