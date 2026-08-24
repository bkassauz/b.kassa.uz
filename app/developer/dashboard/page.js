'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useDeveloperAuth } from '../../../lib/DeveloperAuthContext';
import styles from '../developer.module.css';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString('uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function DashboardPage() {
  const { profile } = useDeveloperAuth();
  const [stats, setStats] = useState({ clubs: null, clubAdmins: null });

  const [message, setMessage] = useState('');
  const [lastAnnouncement, setLastAnnouncement] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState('');

  useEffect(() => {
    async function loadStats() {
      const [clubsRes, clubAdminsRes] = await Promise.all([
        supabase.from('game_clubs').select('id', { count: 'exact', head: true }),
        supabase.from('club_admins').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        clubs: clubsRes.count ?? 0,
        clubAdmins: clubAdminsRes.count ?? 0,
      });
    }

    async function loadAnnouncement() {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setLastAnnouncement(data || null);
    }

    loadStats();
    loadAnnouncement();
  }, []);

  async function handleSend(e) {
    e.preventDefault();
    setSendMsg('');
    if (!message.trim()) return;
    setSending(true);

    const { data, error } = await supabase
      .from('announcements')
      .insert({ message: message.trim() })
      .select()
      .single();

    if (error) {
      setSendMsg(error.message);
    } else {
      setLastAnnouncement(data);
      setMessage('');
      setSendMsg('Yuborildi.');
    }
    setSending(false);
  }

  return (
    <>
      <div className={styles.pageHead}>
        <h1>Xush kelibsiz, {profile?.full_name || profile?.username}</h1>
      </div>

      <div className={styles.grid}>
        <div className={styles.widget}>
          <div className={styles.widgetAccent}></div>
          <div className={styles.widgetLabel}>Ro'yxatdagi Game Clublar</div>
          <div className={styles.widgetValue}>{stats.clubs ?? '—'}</div>
          <div className={styles.widgetHint}>Faol ro'yxatdan o'tgan barlar</div>
        </div>

        <div className={styles.widget}>
          <div className={styles.widgetAccent}></div>
          <div className={styles.widgetLabel}>Club adminlari</div>
          <div className={styles.widgetValue}>{stats.clubAdmins ?? '—'}</div>
          <div className={styles.widgetHint}>Barcha clublar bo'yicha jami</div>
        </div>

        <div className={styles.widget}>
          <div className={styles.widgetAccent}></div>
          <div className={styles.widgetLabel}>Bugungi savdo</div>
          <div className={styles.widgetValue}>—</div>
          <div className={styles.widgetHint}>Sotuv jadvali ulanganda chiqadi</div>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Barcha Seller Adminlarga xabar</h2>
        </div>

        <div className={styles.phoneMock}>
          <div className={styles.phoneNotch}></div>
          <div className={styles.phoneScreen}>
            <div className={styles.phoneScreenLabel}>So'nggi xabar</div>
            {lastAnnouncement ? (
              <>
                <div className={styles.phoneMessage}>{lastAnnouncement.message}</div>
                <div className={styles.phoneMessageTime}>{formatDate(lastAnnouncement.created_at)}</div>
              </>
            ) : (
              <div className={styles.phoneMessageEmpty}>Hali xabar yuborilmagan</div>
            )}
          </div>

          <form className={styles.phoneForm} onSubmit={handleSend}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Barcha bar adminlariga xabar yozing..."
            />
            {sendMsg && <p className={styles.mutedSmall} style={{ marginTop: 6 }}>{sendMsg}</p>}
            <button type="submit" className={styles.btnPrimary} disabled={sending || !message.trim()}>
              {sending ? 'Yuborilmoqda...' : 'Yuborish'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
