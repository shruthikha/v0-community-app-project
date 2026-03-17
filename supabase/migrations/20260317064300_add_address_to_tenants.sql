-- Migration: Add address column to tenants table
-- Description: Adds an optional address column to the tenants table to store community addresses.

ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS address text;
