-- 008: Add missing payment method values to the enum
-- The app uses 'kpay' and 'card' but these were missing from the original enum

ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'kpay';
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'card';
