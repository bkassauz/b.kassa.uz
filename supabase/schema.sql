-- ============================================================
-- BARONA / b.Kassa.uz — Supabase sxemasi
-- Buni Supabase Dashboard > SQL Editor ichida to'liq ishga tushiring.
-- ============================================================

-- 1) PROFILES — har bir auth foydalanuvchisining roli (developer / seller_admin)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  email text not null,
  full_name text,
  role text not null check (role in ('developer', 'seller_admin')),
  phone text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles: o'z profilini ko'rish"
  on public.profiles for select
  using (auth.uid() = id);

-- Developer rolini tekshiruvchi funksiya (RLS policy'larda ishlatiladi)
create or replace function public.is_developer()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'developer'
  );
$$;

create policy "profiles: developer barchasini ko'radi"
  on public.profiles for select
  using (public.is_developer());

create policy "profiles: o'z profilini yangilash"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Login sahifasi uchun: username -> email qidiruvi (parol bu yerda YO'Q, xavfsiz)
create or replace view public.login_lookup as
  select username, email from public.profiles;

grant select on public.login_lookup to anon, authenticated;


-- 2) GAME_CLUBS — ro'yxatdan o'tgan barlar
create table if not exists public.game_clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  username text unique not null,
  owner_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.game_clubs enable row level security;

create policy "game_clubs: faqat developer boshqaradi"
  on public.game_clubs for all
  using (public.is_developer())
  with check (public.is_developer());

create policy "game_clubs: egasi o'z ma'lumotini ko'radi"
  on public.game_clubs for select
  using (auth.uid() = owner_id);


-- 3) CLUB_ADMINS — bitta game club ichidagi qo'shimcha adminlar (Ism + Telefon)
create table if not exists public.club_admins (
  id uuid primary key default gen_random_uuid(),
  game_club_id uuid references public.game_clubs(id) on delete cascade,
  full_name text not null,
  phone text,
  created_at timestamptz default now()
);

alter table public.club_admins enable row level security;

create policy "club_admins: faqat developer boshqaradi"
  on public.club_admins for all
  using (public.is_developer())
  with check (public.is_developer());


-- 4) ADMINS — "Admin sozlamalari" bo'limidagi tizim adminlari (Ism + Telefon)
create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  created_at timestamptz default now()
);

alter table public.admins enable row level security;

create policy "admins: faqat developer boshqaradi"
  on public.admins for all
  using (public.is_developer())
  with check (public.is_developer());


-- ============================================================
-- SELLER ADMIN (Game Club) uchun jadvallar
-- ============================================================

-- Foydalanuvchi (seller_admin) o'ziga tegishli game_club'ni boshqarayotganini tekshiradi
create or replace function public.owns_game_club(gc_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.game_clubs
    where id = gc_id and owner_id = auth.uid()
  );
$$;

-- 5) CATEGORIES — har bir game club o'z kategoriyalariga ega (ichimliklar, snaklar va h.k.)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  game_club_id uuid references public.game_clubs(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

alter table public.categories enable row level security;

create policy "categories: developer yoki egasi boshqaradi"
  on public.categories for all
  using (public.is_developer() or public.owns_game_club(game_club_id))
  with check (public.is_developer() or public.owns_game_club(game_club_id));


-- 6) PRODUCTS — mahsulotlar
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  game_club_id uuid references public.game_clubs(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  name text not null,
  quantity numeric not null default 0,
  cost_price numeric not null default 0,
  sale_price numeric not null default 0,
  unit text not null default 'dona',
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products enable row level security;

create policy "products: developer yoki egasi boshqaradi"
  on public.products for all
  using (public.is_developer() or public.owns_game_club(game_club_id))
  with check (public.is_developer() or public.owns_game_club(game_club_id));


-- 7) INVENTORY_HISTORY — "Kirim tarixi" bo'limi uchun jurnal
create table if not exists public.inventory_history (
  id uuid primary key default gen_random_uuid(),
  game_club_id uuid references public.game_clubs(id) on delete cascade,
  action text not null, -- 'category_added' | 'product_added' | 'product_imported' | 'product_updated'
  category_name text,
  product_name text,
  quantity numeric,
  unit text,
  created_at timestamptz default now()
);

alter table public.inventory_history enable row level security;

create policy "inventory_history: developer yoki egasi ko'radi"
  on public.inventory_history for all
  using (public.is_developer() or public.owns_game_club(game_club_id))
  with check (public.is_developer() or public.owns_game_club(game_club_id));


-- 8) SALES / SALE_ITEMS — Sotuv POS uchun
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  game_club_id uuid references public.game_clubs(id) on delete cascade,
  customer_name text,
  customer_phone text,
  payment_method text not null default 'naqd',
  total numeric not null default 0,
  created_at timestamptz default now()
);

alter table public.sales enable row level security;
drop policy if exists "sales: developer yoki egasi boshqaradi" on public.sales;
create policy "sales: developer yoki egasi boshqaradi"
  on public.sales for all
  using (public.is_developer() or public.owns_game_club(game_club_id))
  with check (public.is_developer() or public.owns_game_club(game_club_id));

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references public.sales(id) on delete cascade,
  game_club_id uuid references public.game_clubs(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit text,
  quantity numeric not null,
  price numeric not null,
  line_total numeric not null,
  created_at timestamptz default now()
);

alter table public.sale_items enable row level security;
drop policy if exists "sale_items: developer yoki egasi boshqaradi" on public.sale_items;
create policy "sale_items: developer yoki egasi boshqaradi"
  on public.sale_items for all
  using (public.is_developer() or public.owns_game_club(game_club_id))
  with check (public.is_developer() or public.owns_game_club(game_club_id));


-- 9) ANNOUNCEMENTS — Developer'dan barcha Seller Adminlarga xabar
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.announcements enable row level security;

drop policy if exists "announcements: hamma o'qiy oladi" on public.announcements;
create policy "announcements: hamma o'qiy oladi"
  on public.announcements for select
  using (auth.role() = 'authenticated');

drop policy if exists "announcements: faqat developer yozadi" on public.announcements;
create policy "announcements: faqat developer yozadi"
  on public.announcements for insert
  with check (public.is_developer());

drop policy if exists "announcements: faqat developer o'chiradi" on public.announcements;
create policy "announcements: faqat developer o'chiradi"
  on public.announcements for delete
  using (public.is_developer());


-- 9) ANNOUNCEMENTS — Developer'dan barcha Seller Adminlarga xabar
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  created_at timestamptz default now()
);

alter table public.announcements enable row level security;
drop policy if exists "announcements: developer boshqaradi" on public.announcements;
create policy "announcements: developer boshqaradi"
  on public.announcements for all
  using (public.is_developer())
  with check (public.is_developer());

drop policy if exists "announcements: hamma o'qiy oladi" on public.announcements;
create policy "announcements: hamma o'qiy oladi"
  on public.announcements for select
  using (auth.role() = 'authenticated');


-- ============================================================
-- STORAGE — mahsulot rasmlari uchun
-- ============================================================
-- Supabase Dashboard > Storage > "New bucket" orqali "product-images"
-- nomli PUBLIC bucket yarating, so'ng shu SQL'ni ishga tushiring:
--
-- create policy "product-images: hamma o'qiy oladi"
--   on storage.objects for select
--   using (bucket_id = 'product-images');
--
-- create policy "product-images: tizimga kirganlar yuklay oladi"
--   on storage.objects for insert
--   with check (bucket_id = 'product-images' and auth.role() = 'authenticated');
--
-- create policy "product-images: tizimga kirganlar o'chira oladi"
--   on storage.objects for delete
--   using (bucket_id = 'product-images' and auth.role() = 'authenticated');
-- ============================================================


-- ============================================================
-- DEVELOPER FOYDALANUVCHISINI QO'LDA YARATISH
-- ============================================================
-- 1. Supabase Dashboard > Authentication > Users > "Add user"
--      email:    imradjabov@barona.local
--      password: 12345678
--      (Auto Confirm User belgisini yoqing)
--
-- 2. Yuqoridagi foydalanuvchi yaratilgach, uning UUID sini nusxalab oling
--    (Users jadvalida ko'rinadi) va quyidagi so'rovni bajaring:
--
-- insert into public.profiles (id, username, email, full_name, role)
-- values (
--   'BU YERGA_YARATILGAN_UUID',
--   'imradjabov',
--   'imradjabov@barona.local',
--   'Imradjabov',
--   'developer'
-- );
--
-- Shundan so'ng saytda Login: imradjabov / Parol: 12345678 bilan kirish mumkin.
-- Parolni keyinchalik Authentication > Users bo'limidan istalgan vaqt o'zgartirasiz.
-- ============================================================
