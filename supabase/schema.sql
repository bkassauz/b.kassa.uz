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
