# Fix Foreign Key Constraint Error - Resume Reviews

## Problem
Error: `insert or update on table "resume_reviews" violates foreign key constraint "resume_reviews_user_id_fkey"`

यह error तब आता है जब `resume_reviews` table में `user_id` insert करते समय वह `users` table में exist नहीं करता।

## Solutions

### Solution 1: Verify और Fix Foreign Key Constraint (Recommended)

1. **Supabase Dashboard में जाएं:**
   - Supabase project खोलें
   - SQL Editor में जाएं

2. **SQL Script Run करें:**
   - `fix_resume_reviews_foreign_key.sql` file को Supabase SQL Editor में open करें
   - पूरा script run करें
   - यह foreign key constraint को verify और recreate करेगा

3. **Verify करें:**
   - Script run करने के बाद, कोई error नहीं आनी चाहिए
   - Foreign key constraint properly set हो जाएगा

### Solution 2: Manual Fix (अगर Solution 1 काम नहीं करे)

1. **Supabase SQL Editor में यह run करें:**

```sql
-- Drop existing constraint (if exists)
ALTER TABLE resume_reviews 
DROP CONSTRAINT IF EXISTS resume_reviews_user_id_fkey;

-- Recreate the foreign key constraint
ALTER TABLE resume_reviews 
ADD CONSTRAINT resume_reviews_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;
```

2. **Verify करें:**
```sql
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
```

### Solution 3: Check for Orphaned Records

अगर आपके पास orphaned records हैं (reviews जिनका user_id users table में नहीं है):

```sql
-- Check for orphaned records
SELECT rr.id, rr.user_id, rr.created_at
FROM resume_reviews rr
LEFT JOIN users u ON rr.user_id = u.id
WHERE u.id IS NULL;
```

**Orphaned records को fix करने के लिए:**

```sql
-- Option A: Delete orphaned records
DELETE FROM resume_reviews 
WHERE user_id NOT IN (SELECT id FROM users);

-- Option B: Update to a valid user_id (if you know which user should own them)
-- UPDATE resume_reviews 
-- SET user_id = 'valid-user-uuid-here' 
-- WHERE user_id NOT IN (SELECT id FROM users);
```

### Solution 4: User Account Issue

अगर error अभी भी आ रहा है, तो:

1. **User ID Verify करें:**
   - Check करें कि logged-in user का ID `users` table में exist करता है
   - Browser console में `user.id` check करें

2. **Re-login करें:**
   - Log out करें
   - फिर से log in करें
   - यह user data को refresh करेगा

3. **User Account Check करें:**
```sql
-- Check if your user exists
SELECT id, email, full_name, is_active 
FROM users 
WHERE id = 'your-user-id-here';
```

## Code Changes Made

1. **API में User Verification Added:**
   - `src/app/api/resume/review/route.ts` में user existence check add किया गया है
   - Better error messages add किए गए हैं

2. **Frontend Error Handling Improved:**
   - Foreign key errors के लिए specific messages add किए गए हैं
   - User को clear instructions दिए जाते हैं

## Testing

1. **Test करें:**
   - Resume paste करें
   - Analyze करें
   - Save button click करें
   - अब error नहीं आना चाहिए

2. **अगर अभी भी error आता है:**
   - Browser console check करें
   - Network tab में API response देखें
   - Supabase logs check करें

## Prevention

1. **Always verify user exists before insert:**
   - Code में already add किया गया है

2. **Use proper error handling:**
   - Frontend में better error messages हैं

3. **Regular database maintenance:**
   - Orphaned records को periodically clean करें

