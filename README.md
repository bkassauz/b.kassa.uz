# Barona / b.Kassa.uz — Game Club Bar Control

Next.js + Supabase asosida qurilgan, GitHub orqali versiyalanadigan va Vercel'da
joylashtiriladigan boshqaruv tizimi.

## Texnologiyalar
- **Next.js 14** (App Router)
- **Supabase** — autentifikatsiya (Auth) + ma'lumotlar bazasi (Postgres)
- **Vercel** — hosting / deploy
- Qo'shimcha chart kutubxonasi ishlatilmagan — barcha diagrammalar toza SVG bilan.

---

## 1-qadam: Supabase loyihasini sozlash

1. [supabase.com](https://supabase.com) da yangi loyiha yarating.
2. Chap menyudan **SQL Editor** ga o'ting, `supabase/schema.sql` faylining
   to'liq mazmunini joylashtirib, **Run** tugmasini bosing.
   Bu barcha jadvallarni (`profiles`, `game_clubs`, `club_admins`, `admins`),
   xavfsizlik siyosatlarini (RLS) va `login_lookup` view'ini yaratadi.
3. **Authentication → Users** bo'limiga o'ting → **Add user**:
   - Email: `imradjabov@barona.local`
   - Password: `12345678`
   - "Auto Confirm User" belgisini yoqing.
4. Yaratilgan foydalanuvchining UUID'sini nusxalang (Users jadvalida ko'rinadi).
5. Yana **SQL Editor**'ga qaytib, quyidagini bajaring (UUID'ni almashtiring):

```sql
insert into public.profiles (id, username, email, full_name, role)
values (
  'BU_YERGA_UUID',
  'imradjabov',
  'imradjabov@barona.local',
  'Imradjabov',
  'developer'
);
```

Shu bilan **Developer** profili tayyor: Login `imradjabov`, Parol `12345678`.
Parolni istalgan vaqt Authentication → Users bo'limidan o'zgartirishingiz mumkin.

6. **Settings → API** bo'limidan quyidagilarni nusxalab oling — ular keyingi
   qadamda kerak bo'ladi:
   - `Project URL`
   - `anon public` key
   - `service_role` key (⚠️ maxfiy, faqat serverga beriladi)

7. **Storage** bo'limiga o'ting → **New bucket** → nomi: `product-images` →
   **Public bucket** belgisini yoqing → Create. So'ng SQL Editor'da
   `supabase/schema.sql` faylining oxiridagi (izohdan chiqarilgan) uchta
   `storage.objects` policy'sini ishga tushiring — bu mahsulot rasmlarini
   yuklash va ko'rish uchun kerak.

---

## 2-qadam: Loyihani local kompyuterda ishga tushirish

```bash
npm install
cp .env.example .env.local
```

`.env.local` faylini oching va Supabase'dan olgan qiymatlarni kiriting:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

So'ngra:

```bash
npm run dev
```

`http://localhost:3000` manzilida sayt ochiladi (avtomatik `/login`ga yo'naltiradi).

---

## 3-qadam: GitHub'ga yuklash

```bash
git init
git add .
git commit -m "Initial commit — Barona game club control"
git branch -M main
git remote add origin https://github.com/<username>/<repo-nomi>.git
git push -u origin main
```

`.env.local` fayli `.gitignore` orqali avtomatik chiqarib tashlanadi — maxfiy
kalitlar GitHub'ga hech qachon yuklanmaydi.

---

## 4-qadam: Vercel'ga deploy qilish

1. [vercel.com](https://vercel.com) → **Add New Project** → GitHub repongizni tanlang.
2. **Environment Variables** bo'limiga uchta qiymatni qo'shing (xuddi `.env.local` dagidek):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. **Deploy** tugmasini bosing. Bir necha daqiqada sayt tayyor bo'ladi.

Keyingi har bir `git push` avtomatik ravishda Vercel'da yangi deploy yaratadi.

---

## Loyiha tuzilishi

```
app/
  login/              → avtorizatsiya oynasi
  developer/
    dashboard/         → umumiy vidjetlar
    game-clubs/         → barlarni ro'yxatga olish, tahrirlash (klik orqali)
    analytics/         → club tanlab, diagrammalar (hozircha namunaviy data)
    settings/          → developer profili: ism, login, parol
  club/                → Seller Admin (game club) paneli
    dashboard/          → ombor va sotuv bo'yicha vidjetlar
    pos/                 → Sotuv POS (hozircha placeholder)
    products/            → kategoriyalar, mahsulotlar, Excel import
    history/             → Kirim tarixi jurnali
  api/
    game-clubs/         → yangi bar uchun login/parol yaratuvchi xavfsiz server route
    game-clubs/[id]/     → mavjud barni tahrirlash (login/parol/adminlar)
components/             → Sidebar, Modal, DeveloperShell, ClubShell, ProductFormModal, ExcelImportModal
lib/                    → Supabase client'lar, auth context'lar, telefon mask
supabase/schema.sql     → to'liq SQL sxema
```

## Rollar
- **developer** — sizning boshqaruv panelingiz (Game Clubs, Analitika, sozlamalar).
- **seller_admin** — game club bar egasi uchun profil. Developer "BAR qo'shish" orqali
  yaratgan login/parol bilan shu foydalanuvchi avtorizatsiya oynasidan kirib, o'z
  panelida (Dashboard, Mahsulotlar, Kirim tarixi, POS) ombor va mahsulotlarni boshqaradi.

## Mahsulotlarni Excel'dan import qilish
"Mahsulotlar" bo'limi pastki o'ng burchagidagi doira tugma orqali `.xlsx` fayl
yuklanadi. Ustunlar aynan shunday bo'lishi kerak: **Mahsulot nomi, kategoriyasi,
soni, kelish narxi, sotuv narxi, o'lchov birligi**. Yuklangach, tasdiqlashdan oldin
jadvalni to'g'ridan-to'g'ri tahrirlash mumkin. Kategoriya mavjud bo'lmasa, avtomatik
yaratiladi. Import qilingan mahsulotlar rasmsiz qo'shiladi — rasmni keyin mahsulot
ustiga bosib, tahrirlash oynasidan qo'shasiz.
