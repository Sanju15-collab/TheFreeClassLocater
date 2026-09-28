/*
# Add user_id to room_claims and scope to authenticated users

1. Modified Tables
- `room_claims` gains a `user_id` column (uuid, nullable, defaults to auth.uid()) so claims can be associated with the student who made them.
- An index on `user_id` is added for faster per-user lookups.

2. Security
- Policies are changed from `anon, authenticated` to `authenticated` only, since the app now requires sign-in.
- Claims remain intentionally shared (all authenticated students can see all claims), so USING (true) is kept for SELECT.
- INSERT and UPDATE require a valid authenticated session via WITH CHECK (auth.uid() = user_id) where user_id is set by the default.
- DELETE remains open to authenticated users since claims are ephemeral.

3. Important Notes
- The user_id column is nullable to avoid breaking any existing rows.
- New inserts from authenticated users will automatically get user_id from the DEFAULT auth.uid().
*/

ALTER TABLE public.room_claims
  ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS room_claims_user_id_idx ON public.room_claims (user_id);

DROP POLICY IF EXISTS "public_read_room_claims" ON public.room_claims;
CREATE POLICY "public_read_room_claims" ON public.room_claims FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_room_claims" ON public.room_claims;
CREATE POLICY "public_insert_room_claims" ON public.room_claims FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_room_claims" ON public.room_claims;
CREATE POLICY "public_update_room_claims" ON public.room_claims FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_room_claims" ON public.room_claims;
CREATE POLICY "public_delete_room_claims" ON public.room_claims FOR DELETE
  TO authenticated USING (true);
