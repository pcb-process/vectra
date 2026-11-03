-- Smart Personal Finance Schema & RLS Migration
-- Target: Supabase Postgres 17

-- 1. Create finance_categories table
create table if not exists public.finance_categories (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text not null default 'Wallet',
  color text not null default '#10b981',
  created_at timestamptz not null default now()
);

-- 2. Create finance_transactions table
create table if not exists public.finance_transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id bigint references public.finance_categories(id) on delete set null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12,2) not null check (amount > 0),
  note text not null default '',
  transaction_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- 3. Create finance_budgets table
create table if not exists public.finance_budgets (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id bigint not null references public.finance_categories(id) on delete cascade,
  month_year text not null check (month_year ~ '^[0-9]{4}-[0-9]{2}$'),
  amount_limit numeric(12,2) not null check (amount_limit > 0),
  alert_threshold numeric(5,2) not null default 80.00 check (alert_threshold > 0 and alert_threshold <= 100),
  created_at timestamptz not null default now(),
  unique (user_id, category_id, month_year)
);

-- 4. Create indexes for foreign keys and RLS performance
create index if not exists finance_categories_user_id_idx on public.finance_categories (user_id);
create index if not exists finance_transactions_user_date_idx on public.finance_transactions (user_id, transaction_date desc);
create index if not exists finance_transactions_category_id_idx on public.finance_transactions (category_id);
create index if not exists finance_budgets_user_month_idx on public.finance_budgets (user_id, month_year);
create index if not exists finance_budgets_category_id_idx on public.finance_budgets (category_id);

-- 5. Enable RLS
alter table public.finance_categories enable row level security;
alter table public.finance_transactions enable row level security;
alter table public.finance_budgets enable row level security;

-- 6. Grants for Data API exposure
grant select on public.finance_categories to anon, authenticated;
grant insert, update, delete on public.finance_categories to authenticated;
grant select, insert, update, delete on public.finance_transactions to authenticated;
grant select, insert, update, delete on public.finance_budgets to authenticated;

-- 7. RLS Policies for finance_categories
create policy "Anyone can view default categories"
  on public.finance_categories for select
  to anon, authenticated
  using (user_id is null or (select auth.uid()) = user_id);

create policy "Users can insert own categories"
  on public.finance_categories for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own categories"
  on public.finance_categories for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own categories"
  on public.finance_categories for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 8. RLS Policies for finance_transactions
create policy "Users can view own transactions"
  on public.finance_transactions for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own transactions"
  on public.finance_transactions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own transactions"
  on public.finance_transactions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own transactions"
  on public.finance_transactions for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 9. RLS Policies for finance_budgets
create policy "Users can view own budgets"
  on public.finance_budgets for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own budgets"
  on public.finance_budgets for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own budgets"
  on public.finance_budgets for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own budgets"
  on public.finance_budgets for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 10. Seed default Thai categories if none exist
insert into public.finance_categories (user_id, name, type, icon, color)
select null, v.name, v.type, v.icon, v.color
from (values
  ('เงินเดือน', 'income', 'Briefcase', '#10b981'),
  ('รายได้เสริม / ฟรีแลนซ์', 'income', 'TrendingUp', '#06b6d4'),
  ('โบนัส / เงินปันผล', 'income', 'Gift', '#8b5cf6'),
  ('อาหารและเครื่องดื่ม', 'expense', 'Utensils', '#f59e0b'),
  ('การเดินทาง / น้ำมัน', 'expense', 'Car', '#3b82f6'),
  ('ที่อยู่อาศัย / ค่าน้ำ-ค่าไฟ', 'expense', 'Home', '#6366f1'),
  ('ช้อปปิ้ง / ของใช้ส่วนตัว', 'expense', 'ShoppingBag', '#ec4899'),
  ('สุขภาพ / การแพทย์', 'expense', 'HeartPulse', '#ef4444'),
  ('ความบันเทิง / สมาชิกรายเดือน', 'expense', 'Film', '#a855f7'),
  ('การออม / ลงทุน', 'expense', 'PiggyBank', '#14b8a6')
) as v(name, type, icon, color)
where not exists (
  select 1 from public.finance_categories c where c.user_id is null and c.name = v.name
);
