-- Migration Patch v1: Harmonize Leave Balances Schema
-- Adds missing timestamp columns to the leave_balances table

DO $$ 
BEGIN 
    -- 1. Add created_at if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='leave_balances' AND column_name='created_at') THEN
        ALTER TABLE leave_balances ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- 2. Add updated_at if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='leave_balances' AND column_name='updated_at') THEN
        ALTER TABLE leave_balances ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- 3. Update existing rows to have timestamps if they were NULL (though default NOW() handles this for new columns)
    UPDATE leave_balances SET created_at = NOW() WHERE created_at IS NULL;
    UPDATE leave_balances SET updated_at = NOW() WHERE updated_at IS NULL;

END $$;
