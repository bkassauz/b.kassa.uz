import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { verifyDeveloper } from '../../../lib/verifyDeveloper';

export async function POST(request) {
  try {
    const caller = await verifyDeveloper(request.headers.get('authorization'));
    if (!caller) {
      return NextResponse.json({ error: 'Ruxsat yo\'q.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, phone, address, username, password, admins } = body;

    if (!name || !username || !password) {
      return NextResponse.json({ error: 'Majburiy maydonlar to\'ldirilmagan.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Parol kamida 6 belgidan iborat bo\'lishi kerak.' }, { status: 400 });
    }

    const admin = createSupabaseAdmin();
    const internalEmail = `${username.trim().toLowerCase()}@barona.local`;

    // 1) Auth foydalanuvchisi yaratish
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: internalEmail,
      password,
      email_confirm: true,
    });

    if (createErr) {
      const msg = createErr.message?.includes('already been registered')
        ? 'Bu login allaqachon band.'
        : createErr.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const newUserId = created.user.id;

    // 2) Profil yozuvi
    const { error: profileErr } = await admin.from('profiles').insert({
      id: newUserId,
      username: username.trim().toLowerCase(),
      email: internalEmail,
      full_name: name,
      role: 'seller_admin',
      phone: phone || null,
    });

    if (profileErr) {
      await admin.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: profileErr.message }, { status: 400 });
    }

    // 3) Game club yozuvi
    const { data: club, error: clubErr } = await admin
      .from('game_clubs')
      .insert({
        name,
        phone: phone || null,
        address: address || null,
        username: username.trim().toLowerCase(),
        owner_id: newUserId,
      })
      .select()
      .single();

    if (clubErr) {
      await admin.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: clubErr.message }, { status: 400 });
    }

    // 4) Qo'shimcha adminlar (Ism Familiya + Telefon)
    const adminRows = (admins || [])
      .filter((a) => a.full_name?.trim())
      .map((a) => ({
        game_club_id: club.id,
        full_name: a.full_name.trim(),
        phone: a.phone || null,
      }));

    if (adminRows.length > 0) {
      const { error: adminsErr } = await admin.from('club_admins').insert(adminRows);
      if (adminsErr) {
        return NextResponse.json({ error: adminsErr.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true, club });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Kutilmagan xatolik.' }, { status: 500 });
  }
}
