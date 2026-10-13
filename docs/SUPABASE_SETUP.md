# Supabase & Google OAuth Setup Guide

## 1. Supabase Project Setup

1. Log into your [Supabase Console](https://database.new) and create a project named `college-event-system`.
2. Retrieve the following credentials from **Project Settings > API**:
   - `Project URL` (`SUPABASE_URL`)
   - `anon` public key (`SUPABASE_ANON_KEY`)
   - `service_role` secret key (`SUPABASE_SERVICE_ROLE_KEY`)
   - `JWT Secret` (`SUPABASE_JWT_SECRET`)

## 2. Apply Schema & Seed Migrations

In the Supabase Dashboard, open the **SQL Editor**:
1. Run the migration script in [supabase/migrations/00001_initial_schema.sql](../supabase/migrations/00001_initial_schema.sql).
2. Run the seed script in [supabase/seed.sql](../supabase/seed.sql) to populate standard venues and categories.

## 3. Configure Google OAuth 2.0

1. Go to the [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID**:
   - Application Type: **Web application**
   - Authorized JavaScript origins: `http://localhost:3000`, `https://your-domain.com`
   - Authorized redirect URIs: `https://<YOUR-SUPABASE-PROJECT-REF>.supabase.co/auth/v1/callback`
3. In the Supabase Dashboard:
   - Navigate to **Authentication > Providers > Google**.
   - Toggle **Enable Google provider**.
   - Enter your Google Client ID and Google Client Secret.
   - Save changes.

