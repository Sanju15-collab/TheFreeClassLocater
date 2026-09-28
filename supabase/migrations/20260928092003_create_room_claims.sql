/*
# Create shared room claims

1. New Tables
- `room_claims` stores short-lived room holds visible to the shared campus dashboard.
- `id` uniquely identifies each claim.
- `room` stores the public room label.
- `claimed_until` stores when the hold expires.
- `created_at` stores when the claim was created.

2. Security
- Row level security is enabled.
- This is an intentionally shared, no-sign-in prototype, so anonymous and authenticated visitors may read and create claims.
- Separate CRUD policies keep the access model explicit.

3. Important Notes
- Claims are temporary records and the app only reads active holds.
- No user identity or private student data is stored.
*/

CREATE TABLE IF NOT EXISTS public.room_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room text NOT NULL,
  claimed_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS room_claims_claimed_until_idx ON public.room_claims (claimed_until);

ALTER TABLE public.room_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_room_claims" ON public.room_claims;
CREATE POLICY "public_read_room_claims" ON public.room_claims FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_room_claims" ON public.room_claims;
CREATE POLICY "public_insert_room_claims" ON public.room_claims FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_room_claims" ON public.room_claims;
CREATE POLICY "public_update_room_claims" ON public.room_claims FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_room_claims" ON public.room_claims;
CREATE POLICY "public_delete_room_claims" ON public.room_claims FOR DELETE TO anon, authenticated USING (true);
