-- Fix Resume Reviews Foreign Key Constraint
-- Run this in Supabase SQL Editor if you're getting foreign key constraint errors

-- Step 1: Check if foreign key constraint exists
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'resume_reviews';

-- Step 2: If foreign key doesn't exist or is incorrect, drop and recreate it
-- First, drop existing constraint if it exists (replace with actual constraint name from Step 1)
-- ALTER TABLE resume_reviews DROP CONSTRAINT IF EXISTS resume_reviews_user_id_fkey;

-- Step 3: Recreate the foreign key constraint
ALTER TABLE resume_reviews 
DROP CONSTRAINT IF EXISTS resume_reviews_user_id_fkey;

ALTER TABLE resume_reviews 
ADD CONSTRAINT resume_reviews_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- Step 4: Verify the constraint was created
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'resume_reviews';

-- Step 5: Check for orphaned records (reviews with user_id that don't exist in users table)
SELECT rr.id, rr.user_id, rr.created_at
FROM resume_reviews rr
LEFT JOIN users u ON rr.user_id = u.id
WHERE u.id IS NULL;

-- If you find orphaned records, you can either:
-- Option A: Delete orphaned records
-- DELETE FROM resume_reviews WHERE user_id NOT IN (SELECT id FROM users);

-- Option B: Update orphaned records to a valid user_id (if you know which user should own them)
-- UPDATE resume_reviews SET user_id = 'valid-user-uuid-here' WHERE user_id NOT IN (SELECT id FROM users);

