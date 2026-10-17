-- Privacy CRM: production schema with row-level security and server-side audit logging.
-- Apply with: supabase db push   (or paste into the SQL editor)

create extension if not exists "pgcrypto";

create type app_role as enum ('admin','sales_manager','account_executive','csm','read_only');
create type opp_stage as enum ('Prospecting','Qualified','Solution Fit','Proposal','Negotiation','Closed Won','Closed Lost');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null, email text not null unique,
  role app_role not null default 'read_only', active boolean not null default true,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(), name text not null unique,
  description text, list_arr numeric(12,2) not null check (list_arr >= 0)
);

create table accounts (
  id uuid primary key default gen_random_uuid(), name text not null, industry text, region text,
  tier text check (tier in ('Strategic','Enterprise','Mid-Market')),
  status text not null default 'Prospect' check (status in ('Prospect','Customer','Churned')),
  owner_id uuid references profiles(id), frameworks text[] not null default '{}',
  employees integer check (employees > 0), created_at timestamptz not null default now()
);
create index on accounts (owner_id); create index on accounts (status);

create table contacts (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references accounts on delete cascade,
  name text not null, title text, email text,
  role text check (role in ('Champion','Economic Buyer','Legal / DPO','Technical','User'))
);
create index on contacts (account_id);

create table opportunities (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references accounts on delete cascade,
  name text not null, stage opp_stage not null default 'Prospecting', amount numeric(12,2) not null check (amount >= 0),
  close_date date not null, owner_id uuid references profiles(id),
  type text not null check (type in ('New','Expansion','Renewal')), product_ids uuid[] not null default '{}',
  lost_reason text, constraint lost_needs_reason check (stage <> 'Closed Lost' or lost_reason is not null)
);
create index on opportunities (account_id); create index on opportunities (stage);

create table subscriptions (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references accounts on delete cascade,
  product_id uuid not null references products, arr numeric(12,2) not null check (arr >= 0),
  start_date date not null, end_date date not null check (end_date > start_date),
  status text not null default 'Active' check (status in ('Active','Pending Renewal','Churned'))
);
create index on subscriptions (account_id); create index on subscriptions (end_date);

create table tasks (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references accounts on delete cascade,
  title text not null, due_date date not null, assignee_id uuid references profiles(id),
  priority text not null default 'Medium' check (priority in ('High','Medium','Low')), done boolean not null default false
);
create table notes (
  id uuid primary key default gen_random_uuid(), account_id uuid not null references accounts on delete cascade,
  author_id uuid references profiles(id), kind text not null check (kind in ('Note','Call','Meeting','Email')),
  body text not null, created_at timestamptz not null default now()
);

create table audit_log (
  id bigint generated always as identity primary key, ts timestamptz not null default now(),
  actor_id uuid, action text not null, entity text not null, entity_id text, summary text, diff jsonb
);

-- Role helpers (security definer so policies can't be bypassed via profiles RLS recursion).
create function current_role_name() returns app_role language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() and active $$;
create function has_role(variadic roles app_role[]) returns boolean language sql stable security definer set search_path = public as
$$ select coalesce(current_role_name() = any(roles), false) $$;

-- Audit trigger: every insert/update/delete is recorded server-side and cannot be skipped by the client.
create function log_change() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into audit_log(actor_id, action, entity, entity_id, summary, diff)
  values (auth.uid(), lower(tg_op), tg_table_name, coalesce((to_jsonb(new)->>'id'), (to_jsonb(old)->>'id')),
          tg_op || ' on ' || tg_table_name,
          case tg_op when 'INSERT' then to_jsonb(new) when 'DELETE' then to_jsonb(old)
            else jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new)) end);
  return coalesce(new, old);
end $$;

do $$ declare t text; begin
  foreach t in array array['accounts','contacts','opportunities','subscriptions','tasks','notes','profiles'] loop
    execute format('create trigger audit_%1$s after insert or update or delete on %1$s for each row execute function log_change()', t);
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;
alter table products enable row level security; alter table audit_log enable row level security;

-- Read: any active member. Write: role-gated. Audit log is append-only via triggers; only admin/sales_manager read it.
create policy read_all on accounts for select using (has_role('admin','sales_manager','account_executive','csm','read_only'));
create policy read_all on contacts for select using (has_role('admin','sales_manager','account_executive','csm','read_only'));
create policy read_all on opportunities for select using (has_role('admin','sales_manager','account_executive','csm','read_only'));
create policy read_all on subscriptions for select using (has_role('admin','sales_manager','account_executive','csm','read_only'));
create policy read_all on tasks for select using (has_role('admin','sales_manager','account_executive','csm','read_only'));
create policy read_all on notes for select using (has_role('admin','sales_manager','account_executive','csm','read_only'));
create policy read_all on products for select using (has_role('admin','sales_manager','account_executive','csm','read_only'));
create policy read_self_or_admin on profiles for select using (id = auth.uid() or has_role('admin'));

create policy write_accounts on accounts for insert with check (has_role('admin','sales_manager','account_executive'));
create policy update_accounts on accounts for update using (has_role('admin','sales_manager') or (has_role('account_executive') and owner_id = auth.uid()));
create policy delete_accounts on accounts for delete using (has_role('admin'));
create policy write_contacts on contacts for all using (has_role('admin','sales_manager','account_executive')) with check (has_role('admin','sales_manager','account_executive'));
create policy write_opps on opportunities for all using (has_role('admin','sales_manager','account_executive','csm')) with check (has_role('admin','sales_manager','account_executive','csm'));
create policy write_subs on subscriptions for all using (has_role('admin','sales_manager')) with check (has_role('admin','sales_manager'));
create policy write_tasks on tasks for all using (has_role('admin','sales_manager','account_executive','csm')) with check (has_role('admin','sales_manager','account_executive','csm'));
create policy write_notes on notes for insert with check (has_role('admin','sales_manager','account_executive','csm') and author_id = auth.uid());
create policy manage_profiles on profiles for update using (has_role('admin')) with check (has_role('admin') and id <> auth.uid());
create policy audit_read on audit_log for select using (has_role('admin','sales_manager'));
-- No insert/update/delete policies on audit_log: only the security-definer trigger writes to it.
