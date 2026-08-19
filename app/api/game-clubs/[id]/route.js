import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { verifyDeveloper } from '../../../../lib/verifyDeveloper';

export async function GET(request, { params }) {
  const caller = await verifyDeveloper(request.headers.get('authorization'));
  if (!caller) {
    return NextResponse.json({ error: 'Ruxsat yo\'q.' }, { status: 403 });
  }

  const admin = createSupabaseAdmin();
  const { id } = params;

  const { data: club, error: clubErr } = await admin
    .from('game_clubs')
    .select('*')
    .eq('id', id)
    .single();

  if (clubErr || !club) {
    return NextResponse.json({ error: 'Bar topilmadi.' }, { status: 404 });
  }

  const { data: admins } = await admin
    .from('club_admins')
    .select('*')
    .eq('game_club_id', id)
    .order('created_at');

  return NextResponse.json({ club, admins: admins || [] });
}

export async function PUT(request, { params }) {
  try {
    const caller = await verifyDeveloper(request.headers.get('authorization'));
    if (!caller) {
      return NextResponse.json({ error: 'Ruxsat yo\'q.' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { name, phone, address, username, password, admins } = body;

    if (!name || !username) {
      return NextResponse.json({ error: 'Majburiy maydonlar to\'ldirilmagan.' }, { status: 400 });
    }

    const admin = createSupabaseAdmin();

    const { data: existing, error: fetchErr } = await admin
      .from('game_clubs')
      .select('id, owner_id, username')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Bar topilmadi.' }, { status: 404 });
    }

    const newUsername = username.trim().toLowerCase();

    // 1) Asosiy ma'lumotlarni yangilash
    const { error: updateErr } = await admin
      .from('game_clubs')
      .update({
        name,
        phone: phone || null,
        address: address || null,
        username: newUsername,
      })
      .eq('id', id);

    if (updateErr) {
      const msg = updateErr.message.includes('duplicate')
        ? 'Bu login band.'
        : updateErr.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // 2) Login o'zgargan bo'lsa, profildagi username'ni ham yangilaymiz
    if (existing.owner_id && newUsername !== existing.username) {
      const { error: profileErr } = await admin
        .from('profiles')
        .update({ username: newUsername })
        .eq('id', existing.owner_id);

      if (profileErr) {
        const msg = profileErr.message.includes('duplicate')
          ? 'Bu login band.'
          : profileErr.message;
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    }

    // 3) Parol kiritilgan bo'lsa — yangilaymiz (bo'sh qoldirilsa o'zgarmaydi)
    if (password && password.trim().length > 0) {
      if (password.trim().length < 6) {
        return NextResponse.json(
          { error: 'Parol kamida 6 belgidan iborat bo\'lishi kerak.' },
          { status: 400 }
        );
      }
      if (existing.owner_id) {
        const { error: pwdErr } = await admin.auth.admin.updateUserById(existing.owner_id, {
          password: password.trim(),
        });
        if (pwdErr) {
          return NextResponse.json({ error: pwdErr.message }, { status: 400 });
        }
      }
    }

    // 4) Adminlar ro'yxatini almashtirish (soddalik uchun: o'chirib, qayta yozamiz)
    await admin.from('club_admins').delete().eq('game_club_id', id);

    const adminRows = (admins || [])
      .filter((a) => a.full_name?.trim())
      .map((a) => ({
        game_club_id: id,
        full_name: a.full_name.trim(),
        phone: a.phone || null,
      }));

    if (adminRows.length > 0) {
      const { error: adminsErr } = await admin.from('club_admins').insert(adminRows);
      if (adminsErr) {
        return NextResponse.json({ error: adminsErr.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Kutilmagan xatolik.' }, { status: 500 });
  }
}
