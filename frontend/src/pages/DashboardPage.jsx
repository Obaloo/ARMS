import { useCallback, useEffect, useMemo, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api/client';
import { useAuth } from '../state/AuthContext';

/* ─────────────────────────────────────────────
   DESIGN TOKENS  (inline styles + CSS-in-JS)
───────────────────────────────────────────── */
const STYLE = document.createElement('style');
STYLE.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,300&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:       #1a1814;
    --ink-2:     #3b3730;
    --ink-3:     #6b6358;
    --ink-4:     #9e9488;
    --parchment: #faf8f4;
    --cream:     #f3efe8;
    --rule:      #e2ddd5;
    --gold:      #b5892a;
    --gold-lt:   #f0e4c4;
    --teal:      #1a5c55;
    --teal-lt:   #d4ece9;
    --red:       #8b2020;
    --red-lt:    #f5dcdc;
    --present:   #1a5c55;
    --late:      #8b6020;
    --absent:    #8b2020;
  }

  body { background: var(--parchment); color: var(--ink); font-family: 'Source Serif 4', Georgia, serif; }

  /* ── layout ── */
  .arms-root { min-height: 100vh; display: grid; grid-template-rows: auto 1fr; }

  .arms-topbar {
    background: var(--ink);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .75rem;
    padding: .6rem 1.5rem;
    min-height: 64px;
    position: sticky; top: 0; z-index: 100;
    border-bottom: 3px solid var(--gold);
  }
  .arms-topbar-brand {
    display: flex; align-items: center; gap: .8rem;
    min-width: 0;
  }
  .arms-topbar-crest {
    width: 36px; height: 36px;
    border: 2px solid var(--gold);
    border-radius: 50%;
    display: grid; place-items: center;
    font-family: 'Playfair Display', serif;
    font-size: 14px; color: var(--gold);
    flex-shrink: 0;
  }
  .arms-topbar-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem; letter-spacing: .04em;
    color: #fff;
  }
  .arms-topbar-meta {
    font-size: .72rem; color: rgba(255,255,255,.55);
    letter-spacing: .08em; text-transform: uppercase;
    margin-top: 1px;
  }
  .arms-topbar-right {
    display: flex;
    align-items: center;
    gap: .8rem;
    margin-left: auto;
    min-width: 0;
  }
  .arms-role-badge {
    font-size: .68rem; letter-spacing: .1em; text-transform: uppercase;
    background: var(--gold); color: var(--ink); font-weight: 600;
    padding: 3px 10px; border-radius: 2px;
  }
  .arms-signout {
    background: transparent; border: 1px solid rgba(255,255,255,.3);
    color: rgba(255,255,255,.8); font-family: 'Source Serif 4', serif;
    font-size: .8rem; padding: 6px 16px; cursor: pointer;
    letter-spacing: .05em; transition: all .2s;
    border-radius: 2px;
  }
  .arms-signout:hover { border-color: var(--gold); color: var(--gold); }
  .arms-user-name {
    font-size: .85rem;
    color: rgba(255,255,255,.75);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
  }

  /* ── main canvas ── */
  .arms-canvas { padding: 2rem 2rem 7.5rem; max-width: 1400px; margin: 0 auto; width: 100%; }

  /* ── section divider ── */
  .arms-section-label {
    display: flex; align-items: center; gap: 1rem;
    margin-bottom: 1.25rem; margin-top: .25rem;
  }
  .arms-section-label h2, .arms-section-label h3 {
    font-family: 'Playfair Display', serif;
    font-size: .75rem; letter-spacing: .16em; text-transform: uppercase;
    color: var(--ink-3); white-space: nowrap;
  }
  .arms-section-label::after {
    content: ''; flex: 1; height: 1px; background: var(--rule);
  }

  /* ── card ── */
  .arms-card {
    background: #fff; border: 1px solid var(--rule);
    border-radius: 4px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(26,24,20,.06);
  }
  .arms-card-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.05rem; color: var(--ink);
    margin-bottom: 1rem;
    padding-bottom: .75rem;
    border-bottom: 1px solid var(--rule);
  }

  /* ── stat tiles ── */
  .arms-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--rule); border: 1px solid var(--rule); border-radius: 4px; overflow: hidden; margin-bottom: 1.5rem; }
  .arms-stat {
    background: #fff; padding: 1.25rem 1.5rem;
    display: flex; flex-direction: column; gap: .25rem;
  }
  .arms-stat-value {
    font-family: 'Playfair Display', serif;
    font-size: 2rem; color: var(--ink); line-height: 1;
  }
  .arms-stat-label { font-size: .72rem; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); }
  .arms-stat-accent { width: 24px; height: 2px; background: var(--gold); margin-top: .25rem; }

  /* ── grid helpers ── */
  .arms-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
  .arms-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.25rem; }
  .arms-col-span-2 { grid-column: span 2; }

  /* ── form elements ── */
  .arms-field { display: flex; flex-direction: column; gap: .35rem; }
  .arms-label { font-size: .72rem; letter-spacing: .09em; text-transform: uppercase; color: var(--ink-3); font-weight: 600; font-family: 'Source Serif 4', serif; }
  .arms-input {
    width: 100%; padding: .55rem .75rem;
    border: 1px solid var(--rule); border-radius: 2px;
    background: var(--parchment); color: var(--ink);
    font-family: 'Source Serif 4', serif; font-size: .9rem;
    transition: border-color .15s;
    outline: none;
  }
  .arms-input:focus { border-color: var(--ink-3); background: #fff; }
  .arms-input:focus-visible {
    outline: 2px solid rgba(181,137,42,.85);
    outline-offset: 2px;
  }
  .arms-input::placeholder { color: var(--ink-4); }

  /* ── buttons ── */
  .arms-btn-primary {
    background: var(--ink); color: #fff;
    border: none; padding: .6rem 1.5rem;
    font-family: 'Source Serif 4', serif; font-size: .85rem;
    letter-spacing: .06em; cursor: pointer; border-radius: 2px;
    transition: background .15s; white-space: nowrap;
  }
  .arms-btn-primary:hover { background: var(--ink-2); }
  .arms-btn-primary:disabled { opacity: .45; cursor: not-allowed; }

  .arms-btn-secondary {
    background: transparent; color: var(--ink);
    border: 1px solid var(--ink-3); padding: .55rem 1.25rem;
    font-family: 'Source Serif 4', serif; font-size: .85rem;
    letter-spacing: .05em; cursor: pointer; border-radius: 2px;
    transition: all .15s;
  }
  .arms-btn-secondary:hover { border-color: var(--ink); }
  .arms-btn-secondary:disabled { opacity: .45; cursor: not-allowed; }

  .arms-btn-ghost {
    background: transparent; color: var(--ink-3);
    border: 1px solid var(--rule); padding: .45rem 1rem;
    font-family: 'Source Serif 4', serif; font-size: .78rem;
    letter-spacing: .05em; cursor: pointer; border-radius: 2px;
    transition: all .15s;
  }
  .arms-btn-ghost:hover { color: var(--ink); border-color: var(--ink-4); }
  .arms-btn-primary:focus-visible,
  .arms-btn-secondary:focus-visible,
  .arms-btn-ghost:focus-visible,
  .arms-btn-muted:focus-visible,
  .arms-signout:focus-visible,
  .arms-bottom-nav-item:focus-visible {
    outline: 2px solid rgba(181,137,42,.85);
    outline-offset: 2px;
  }

  .arms-btn-muted {
    background: var(--cream); color: var(--ink-2);
    border: 1px solid var(--rule); padding: .35rem .9rem;
    font-family: 'Source Serif 4', serif; font-size: .78rem;
    cursor: pointer; border-radius: 2px; transition: all .15s;
  }
  .arms-btn-muted:hover { background: var(--rule); }
  .arms-btn-muted:disabled {
    opacity: .55;
    cursor: not-allowed;
    background: #f3efe8;
  }

  /* ── toast / feedback ── */
  .arms-toast {
    padding: .75rem 1.25rem; border-radius: 2px;
    font-size: .85rem; margin-bottom: 1.25rem;
    display: flex; align-items: center; gap: .75rem;
    border-left: 3px solid;
  }
  .arms-toast.success { background: var(--teal-lt); color: var(--teal); border-color: var(--teal); }
  .arms-toast.error   { background: var(--red-lt);  color: var(--red);  border-color: var(--red); }

  /* ── notification items ── */
  .arms-notif {
    padding: .9rem 1rem; border: 1px solid var(--rule);
    border-radius: 3px; background: #fff;
  }
  .arms-notif-title { font-weight: 600; font-size: .88rem; }
  .arms-notif-body  { font-size: .8rem; color: var(--ink-3); margin-top: .25rem; line-height: 1.5; }
  .arms-notif.unread { border-left: 3px solid var(--gold); }

  /* ── session card ── */
  .arms-session-card {
    border: 1px solid var(--rule); border-radius: 3px;
    padding: 1rem; background: #fff;
    display: flex; flex-direction: column; gap: .5rem;
  }
  .arms-session-code {
    font-family: 'JetBrains Mono', monospace;
    font-size: .8rem; color: var(--ink-3);
    background: var(--cream); padding: .2rem .5rem;
    border-radius: 2px; display: inline-block; letter-spacing: .08em;
  }
  .arms-session-open  { border-top: 2px solid var(--teal); }
  .arms-session-closed{ border-top: 2px solid var(--rule); }

  /* ── table ── */
  .arms-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .arms-table { width: 100%; border-collapse: collapse; font-size: .85rem; table-layout: fixed; }
  .arms-table thead tr { border-bottom: 2px solid var(--ink); }
  .arms-table th {
    padding: .6rem .75rem; text-align: left;
    font-size: .68rem; letter-spacing: .12em; text-transform: uppercase;
    color: var(--ink-3); font-weight: 600; white-space: nowrap;
    font-family: 'Source Serif 4', serif;
  }
  .arms-table td { padding: .65rem .75rem; border-bottom: 1px solid var(--rule); vertical-align: middle; word-break: break-word; }
  .arms-table tbody tr:hover { background: var(--parchment); }
  .arms-table tbody tr:last-child td { border-bottom: none; }

  .arms-status {
    display: inline-block; font-size: .68rem; letter-spacing: .1em;
    text-transform: uppercase; font-weight: 600;
    padding: 2px 8px; border-radius: 2px;
  }
  .arms-status.present { background: var(--teal-lt); color: var(--present); }
  .arms-status.late    { background: var(--gold-lt);  color: var(--late); }
  .arms-status.absent  { background: var(--red-lt);   color: var(--absent); }

  .arms-id-cell {
    font-family: 'JetBrains Mono', monospace; font-size: .7rem;
    color: var(--ink-4); max-width: 120px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .arms-table th:last-child,
  .arms-table td:last-child {
    width: 140px;
  }

  /* ── summary bar ── */
  .arms-summary-item {
    padding: .9rem 1rem; border: 1px solid var(--rule);
    border-radius: 3px; background: #fff;
  }
  .arms-summary-name { font-weight: 600; font-size: .9rem; }
  .arms-summary-pct  { font-size: .82rem; color: var(--ink-3); margin-top: .25rem; }
  .arms-summary-bar-track {
    height: 4px; background: var(--rule); border-radius: 2px; margin-top: .5rem; overflow: hidden;
  }
  .arms-summary-bar-fill { height: 100%; border-radius: 2px; background: var(--teal); transition: width .4s; }

  /* ── chart tooltip ── */
  .arms-chart-tip {
    background: var(--ink); color: #fff;
    padding: .4rem .75rem; font-size: .78rem;
    border-radius: 2px; font-family: 'Source Serif 4', serif;
  }

  /* ── report buttons row ── */
  .arms-report-row { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .5rem; }

  /* ── settings grid ── */
  .arms-settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .arms-checkbox-row { display: flex; flex-wrap: wrap; gap: 1.5rem; margin-top: .25rem; }
  .arms-checkbox-label {
    display: flex; align-items: center; gap: .5rem;
    font-size: .85rem; color: var(--ink-2); cursor: pointer;
  }
  .arms-checkbox-label input[type=checkbox] { accent-color: var(--ink); width: 14px; height: 14px; }

  /* ── empty state ── */
  .arms-empty { font-size: .85rem; color: var(--ink-4); font-style: italic; padding: .5rem 0; }

  /* ── overview grid ── */
  .arms-overview { display: grid; grid-template-columns: 2fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem; }

  /* ── bottom nav ── */
  .arms-bottom-nav {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 120;
    padding: .6rem .75rem calc(.6rem + env(safe-area-inset-bottom));
    background: linear-gradient(to top, rgba(250, 248, 244, .95), rgba(250, 248, 244, 0));
    pointer-events: none;
  }
  .arms-bottom-nav-inner {
    max-width: 1080px;
    margin: 0 auto;
    width: 100%;
    display: flex;
    gap: .35rem;
    background: rgba(26, 24, 20, .96);
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 16px;
    padding: .35rem;
    box-shadow: 0 12px 30px rgba(15, 12, 9, .35);
    pointer-events: auto;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .arms-bottom-nav-inner::-webkit-scrollbar { display: none; }
  .arms-bottom-nav-item {
    flex: 1 1 0;
    min-width: 110px;
    border: 1px solid transparent;
    background: transparent;
    color: rgba(255,255,255,.78);
    padding: .55rem .6rem;
    border-radius: 12px;
    font-size: .72rem;
    letter-spacing: .08em;
    text-transform: uppercase;
    font-family: 'Source Serif 4', serif;
    cursor: pointer;
    transition: all .15s;
    min-height: 44px;
    line-height: 1.15;
    white-space: nowrap;
  }
  .arms-bottom-nav-item:hover {
    color: #fff;
    border-color: rgba(255,255,255,.14);
    background: rgba(255,255,255,.08);
  }
  .arms-bottom-nav-item.active {
    background: linear-gradient(135deg, #f0e4c4, #b5892a);
    color: #1a1814;
    border-color: rgba(0,0,0,.08);
    box-shadow: 0 4px 12px rgba(181,137,42,.35);
  }

  /* ── responsive ── */
  @media (max-width: 900px) {
    .arms-stats { grid-template-columns: 1fr 1fr; }
    .arms-overview { grid-template-columns: 1fr; }
    .arms-grid-2 { grid-template-columns: 1fr; }
    .arms-grid-3 { grid-template-columns: 1fr; }
    .arms-settings-grid { grid-template-columns: 1fr; }
    .arms-col-span-2 { grid-column: span 1; }
    .arms-canvas { padding: 1rem 1rem 7rem; }
    .arms-topbar {
      padding: .55rem 1rem;
    }
    .arms-topbar-right {
      gap: .55rem;
    }
    .arms-user-name { max-width: 130px; }
  }
  @media (max-width: 600px) {
    .arms-stats { grid-template-columns: 1fr; }
    .arms-topbar {
      align-items: flex-start;
      padding: .55rem .8rem;
    }
    .arms-topbar-brand {
      width: 100%;
    }
    .arms-topbar-title { font-size: 1rem; }
    .arms-topbar-meta { display: none; }
    .arms-topbar-right {
      width: 100%;
      justify-content: space-between;
      gap: .45rem;
    }
    .arms-role-badge {
      font-size: .62rem;
      padding: 3px 8px;
    }
    .arms-user-name {
      max-width: 45vw;
      font-size: .78rem;
    }
    .arms-signout {
      font-size: .72rem;
      padding: 5px 10px;
    }
    .arms-bottom-nav {
      padding: .45rem .5rem calc(.55rem + env(safe-area-inset-bottom));
    }
    .arms-bottom-nav-inner {
      border-radius: 14px;
      gap: .25rem;
      padding: .25rem;
    }
    .arms-bottom-nav-item {
      min-width: 88px;
      font-size: .63rem;
      letter-spacing: .04em;
      padding: .45rem .42rem;
      border-radius: 10px;
      white-space: normal;
    }
  }
  @media (max-width: 760px) {
    .arms-table-wrap {
      overflow: visible;
    }
    .arms-table {
      width: 100%;
      min-width: 0;
      border-collapse: separate;
      border-spacing: 0;
    }
    .arms-table thead {
      display: none;
    }
    .arms-table tbody {
      display: flex;
      flex-direction: column;
      gap: .7rem;
    }
    .arms-table tbody tr {
      display: block;
      border: 1px solid var(--rule);
      border-radius: 8px;
      background: #fff;
      padding: .25rem 0;
    }
    .arms-table tbody tr td {
      display: grid;
      grid-template-columns: minmax(96px, 34%) 1fr;
      gap: .65rem;
      align-items: center;
      padding: .48rem .75rem;
      border-bottom: 1px dashed var(--rule);
      white-space: normal;
    }
    .arms-table tbody tr td:last-child {
      border-bottom: none;
      width: auto;
    }
    .arms-table tbody tr td::before {
      content: attr(data-label);
      font-size: .62rem;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: var(--ink-4);
      font-weight: 700;
    }
    .arms-id-cell {
      max-width: none;
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
      font-size: .68rem;
    }
  }
`;
if (!document.querySelector('#arms-style')) {
  STYLE.id = 'arms-style';
  document.head.appendChild(STYLE);
}

/* ─────────────────────────────────────────────
   SMALL COMPONENTS
───────────────────────────────────────────── */
const Empty = ({ text }) => <p className="arms-empty">{text}</p>;

const Field = ({ label, children }) => (
  <div className="arms-field">
    <span className="arms-label">{label}</span>
    {children}
  </div>
);

const SectionLabel = ({ children }) => (
  <div className="arms-section-label">
    <h2>{children}</h2>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="arms-chart-tip">
        <strong>{label}</strong>: {payload[0].value}
      </div>
    );
  }
  return null;
};

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
const DashboardPage = () => {
  const { user, logout } = useAuth();
  const sectionsByRole = {
    super_admin: [
      { key: 'overview', label: 'Overview' },
      { key: 'attendance', label: 'Attendance' },
      { key: 'admin', label: 'Administration' },
      { key: 'sessions', label: 'Sessions' },
    ],
    lecturer: [
      { key: 'overview', label: 'Overview' },
      { key: 'attendance', label: 'Attendance' },
      { key: 'sessions', label: 'Sessions' },
    ],
    student: [
      { key: 'overview', label: 'Overview' },
      { key: 'attendance-submit', label: 'Attendance' },
      { key: 'enroll', label: 'Enroll Courses' },
      { key: 'attendance-history', label: 'My Records' },
    ],
  };
  const defaultSection = 'overview';

  const [busy, setBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState(defaultSection);
  const [notifications, setNotifications] = useState([]);

  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [settings, setSettings] = useState(null);

  const [lecturerForm, setLecturerForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [studentForm, setStudentForm] = useState({ firstName: '', lastName: '', matricNumber: '', email: '', password: '' });
  const [courseForm, setCourseForm] = useState({ name: '', code: '', lecturerId: '' });
  const [enrollForm, setEnrollForm] = useState({ studentId: '', courseId: '' });
  const [sessionForm, setSessionForm] = useState({ courseId: '', title: '', startsAt: '', endsAt: '', lateCutoffMinutes: 15, codeRotationSeconds: 60 });
  const [attendanceForm, setAttendanceForm] = useState({ sessionCode: '', seatNumber: '' });
  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);
  const [overrideForm, setOverrideForm] = useState({ attendanceId: '', status: 'present' });
  const [selfEnrollCode, setSelfEnrollCode] = useState('');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('all');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceMatric, setAttendanceMatric] = useState('');
  const [attendanceCourseId, setAttendanceCourseId] = useState('');
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendanceMeta, setAttendanceMeta] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [headcountDrafts, setHeadcountDrafts] = useState({});
  const [headcountApplyingId, setHeadcountApplyingId] = useState('');
  const [headcountFeedback, setHeadcountFeedback] = useState({});
  const [downloadingSessionId, setDownloadingSessionId] = useState('');
  const [seatAvailability, setSeatAvailability] = useState({ checking: false, available: null, message: '' });

  const call = async (request, successMessage) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await request();
      if (successMessage) setMessage(successMessage);
      return result;
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const loadBase = useCallback(async () => {
    const attendanceParams = { limit: 25, page: attendancePage, includeMeta: 1 };
    if (attendanceStatusFilter !== 'all') {
      attendanceParams.status = attendanceStatusFilter;
    }
    if (attendanceSearch.trim()) {
      attendanceParams.search = attendanceSearch.trim();
    }
    if (attendanceMatric.trim()) {
      attendanceParams.matricNumber = attendanceMatric.trim();
    }
    if (attendanceCourseId) {
      attendanceParams.courseId = attendanceCourseId;
    }

    const [notificationsRes, coursesRes, sessionsRes, attendanceRes] = await Promise.all([
      call(() => api.get('/notifications')),
      call(() => api.get('/courses')),
      call(() => api.get('/sessions')),
      call(() => api.get('/attendance', { params: attendanceParams })),
    ]);
    if (notificationsRes) setNotifications(notificationsRes.data);
    if (coursesRes) setCourses(coursesRes.data);
    if (sessionsRes) setSessions(sessionsRes.data);
    if (attendanceRes) {
      if (Array.isArray(attendanceRes.data)) {
        setAttendance(attendanceRes.data);
        setAttendanceMeta({ page: attendancePage, limit: 25, total: attendanceRes.data.length, totalPages: 1 });
      } else {
        setAttendance(attendanceRes.data.records || []);
        setAttendanceMeta(attendanceRes.data.pagination || { page: attendancePage, limit: 25, total: 0, totalPages: 1 });
      }
    }

    if (user.role === 'super_admin') {
      const [usersRes, dashRes, settingsRes] = await Promise.all([
        call(() => api.get('/users')),
        call(() => api.get('/dashboards/super-admin')),
        call(() => api.get('/settings')),
      ]);
      if (usersRes) setUsers(usersRes.data);
      if (dashRes) setDashboard(dashRes.data);
      if (settingsRes) setSettings(settingsRes.data);
    }
    if (user.role === 'lecturer') {
      const dashRes = await call(() => api.get('/dashboards/lecturer'));
      if (dashRes) setDashboard(dashRes.data);
    }
    if (user.role === 'student') {
      const [dashRes, publicCoursesRes] = await Promise.all([
        call(() => api.get('/dashboards/student')),
        call(() => api.get('/courses/public')),
      ]);
      if (dashRes) setDashboard(dashRes.data);
      if (publicCoursesRes) setAvailableCourses(publicCoursesRes.data);
    }
  }, [user.role, attendanceStatusFilter, attendancePage, attendanceSearch, attendanceMatric, attendanceCourseId]);

  useEffect(() => { loadBase(); }, [loadBase]);
  useEffect(() => { setActiveSection(defaultSection); }, [defaultSection]);
  useEffect(() => { window.scrollTo(0, 0); }, [activeSection]);
  useEffect(() => { setAttendancePage(1); }, [attendanceStatusFilter, attendanceSearch, attendanceMatric, attendanceCourseId, activeSection]);
  useEffect(() => {
    if (activeSection !== 'sessions' || (user.role !== 'lecturer' && user.role !== 'super_admin')) {
      return undefined;
    }

    const timer = setInterval(async () => {
      try {
        const response = await api.get('/sessions');
        setSessions(response.data || []);
      } catch {
        // Keep polling silent to avoid disrupting user actions.
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [activeSection, user.role]);
  useEffect(() => {
    if (user.role !== 'student' || activeSection !== 'attendance-submit') {
      setSeatAvailability({ checking: false, available: null, message: '' });
      return;
    }

    const sessionCode = attendanceForm.sessionCode.trim();
    const seatNumber = Number(attendanceForm.seatNumber);

    if (!sessionCode || !attendanceForm.seatNumber) {
      setSeatAvailability({ checking: false, available: null, message: '' });
      return;
    }

    if (!Number.isInteger(seatNumber) || seatNumber < 1) {
      setSeatAvailability({ checking: false, available: false, message: 'Seat number must be a positive whole number' });
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSeatAvailability((prev) => ({ ...prev, checking: true }));
      try {
        const response = await api.get('/attendance/seat-availability', { params: { sessionCode, seatNumber } });
        if (cancelled) return;
        setSeatAvailability({
          checking: false,
          available: Boolean(response.data?.available),
          message: response.data?.message || '',
        });
      } catch (err) {
        if (cancelled) return;
        setSeatAvailability({
          checking: false,
          available: false,
          message: err.response?.data?.message || 'Could not verify seat number right now',
        });
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [attendanceForm.sessionCode, attendanceForm.seatNumber, user.role, activeSection]);

  const students = useMemo(() => users.filter((item) => item.role === 'student'), [users]);
  const lecturers = useMemo(() => users.filter((item) => item.role === 'lecturer'), [users]);
  const enrolledCourseCodes = useMemo(
    () => new Set((courses || []).map((item) => item.code)),
    [courses]
  );

  const markRead = async (id) => {
    const response = await call(() => api.patch(`/notifications/${id}/read`), 'Notification updated');
    if (response) setNotifications((prev) => prev.map((item) => (item._id === id ? response.data : item)));
  };

  const createLecturer = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    const { firstName, lastName, email, password } = lecturerForm;
    const trimmed = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password: password,
    };
    if (!trimmed.firstName || !trimmed.lastName || !trimmed.email || !trimmed.password) {
      setError('Please fill out all lecturer registration fields.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmed.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    const response = await call(() => api.post('/users/lecturers', lecturerForm), 'Lecturer created');
    if (response) { setLecturerForm({ firstName: '', lastName: '', email: '', password: '' }); setUsers((prev) => [response.data, ...prev]); }
  };

  const createStudent = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    const { firstName, lastName, matricNumber, email, password } = studentForm;
    const trimmed = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      matricNumber: matricNumber.trim(),
      email: email.trim(),
      password: password,
    };
    if (!trimmed.firstName || !trimmed.lastName || !trimmed.matricNumber || !trimmed.email || !trimmed.password) {
      setError('Please fill out all student registration fields.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmed.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (trimmed.matricNumber.length < 6) {
      setError('Please enter a valid matric number.');
      return;
    }
    const response = await call(() => api.post('/users/students', studentForm), 'Student created');
    if (response) { setStudentForm({ firstName: '', lastName: '', matricNumber: '', email: '', password: '' }); setUsers((prev) => [response.data, ...prev]); }
  };

  const createCourse = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    const { name, code, lecturerId } = courseForm;
    if (!name.trim() || !code.trim() || !lecturerId) {
      setError('Please enter course details and select an assigned lecturer.');
      return;
    }
    const response = await call(() => api.post('/courses', courseForm), 'Course created');
    if (response) { setCourseForm({ name: '', code: '', lecturerId: '' }); setCourses((prev) => [response.data, ...prev]); }
  };

  const enrollStudent = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!enrollForm.studentId || !enrollForm.courseId) {
      setError('Please select a student and a course to enroll.');
      return;
    }
    const response = await call(() => api.post('/users/enroll', enrollForm), 'Student enrolled');
    if (response) { setEnrollForm({ studentId: '', courseId: '' }); await loadBase(); }
  };

  const createSession = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    const { courseId, title, startsAt, endsAt, lateCutoffMinutes, codeRotationSeconds } = sessionForm;
    if (!courseId || !title.trim() || !startsAt || !endsAt) {
      setError('Please complete all session fields (course, title, start/end time).');
      return;
    }
    const startMs = new Date(startsAt).getTime();
    const endMs = new Date(endsAt).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
      setError('End time must be after start time.');
      return;
    }
    if (!Number.isFinite(lateCutoffMinutes) || lateCutoffMinutes < 0) {
      setError('Late cutoff must be a non-negative number.');
      return;
    }
    if (!Number.isFinite(codeRotationSeconds) || codeRotationSeconds < 0) {
      setError('Code rotation must be a non-negative number.');
      return;
    }
    const response = await call(() => api.post('/sessions', sessionForm), 'Session created');
    if (response) { setSessionForm({ courseId: '', title: '', startsAt: '', endsAt: '', lateCutoffMinutes: 15, codeRotationSeconds: 60 }); setSessions((prev) => [response.data, ...prev]); }
  };

  const setSessionState = async (id, isOpen) => {
    const response = await call(() => api.patch(`/sessions/${id}/state`, { isOpen }), 'Session updated');
    if (response) setSessions((prev) => prev.map((item) => (item._id === id ? response.data : item)));
  };

  const setSessionHeadcount = async (id) => {
    const value = Number(headcountDrafts[id]);
    if (!Number.isInteger(value) || value < 1) {
      setHeadcountFeedback((prev) => ({
        ...prev,
        [id]: { type: 'error', text: 'Headcount must be a positive whole number' },
      }));
      return;
    }

    setHeadcountApplyingId(id);
    setHeadcountFeedback((prev) => ({ ...prev, [id]: null }));

    try {
      const response = await api.patch(`/sessions/${id}/headcount`, { actualHeadcount: value });
      setSessions((prev) => prev.map((item) => (item._id === id ? response.data : item)));
      setHeadcountFeedback((prev) => ({
        ...prev,
        [id]: { type: 'success', text: 'Headcount saved. Students above this seat number are flagged as false attendance.' },
      }));
      await loadBase();
    } catch (err) {
      setHeadcountFeedback((prev) => ({
        ...prev,
        [id]: { type: 'error', text: err.response?.data?.message || 'Failed to apply headcount' },
      }));
    } finally {
      setHeadcountApplyingId('');
    }
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session? This will also delete all attendance records for this session.')) {
      return;
    }
    const response = await call(() => api.delete(`/sessions/${sessionId}`), 'Session deleted successfully');
    if (response) setSessions((prev) => prev.filter((item) => item._id !== sessionId));
  };

  const markAttendance = async (event) => {
    event.preventDefault();
    if (attendanceSubmitting) {
      return;
    }
    setAttendanceSubmitting(true);
    const payload = { ...attendanceForm };
    payload.seatNumber = Number(attendanceForm.seatNumber);
    if (navigator.geolocation) {
      await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => { payload.latitude = position.coords.latitude; payload.longitude = position.coords.longitude; payload.accuracy = position.coords.accuracy; resolve(); },
          () => resolve(),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      });
    }
    const response = await call(() => api.post('/attendance/mark', payload), 'Attendance submitted');
    if (response) { setAttendance((prev) => [response.data, ...prev]); setAttendanceForm({ sessionCode: '', seatNumber: '' }); await loadBase(); }
    setAttendanceSubmitting(false);
  };

  const overrideAttendance = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!overrideForm.attendanceId.trim()) {
      setError('Attendance record ID is required.');
      return;
    }
    if (!overrideForm.status) {
      setError('Please select the new attendance status.');
      return;
    }
    const response = await call(
      () => api.patch(`/attendance/${overrideForm.attendanceId}/override`, { status: overrideForm.status }),
      'Attendance overridden'
    );
    if (response) { setOverrideForm({ attendanceId: '', status: 'present' }); await loadBase(); }
  };

  const updateSettings = async (event) => {
    event.preventDefault();
    const response = await call(() => api.put('/settings', settings), 'Settings updated');
    if (response) setSettings(response.data);
  };

  const openReport = (format) => {
    const token = localStorage.getItem('arms_access_token');
    const url = `/api/reports/attendance${format === 'json' ? '' : `.${format}`}?from=&to=`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(async (res) => {
      if (!res.ok) throw new Error('Report download failed');
      if (format === 'json') { const data = await res.json(); setAttendance(data); setMessage('JSON report loaded'); return; }
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `attendance-report.${format}`;
      link.click();
      URL.revokeObjectURL(link.href);
      setMessage(`Attendance report downloaded as ${format.toUpperCase()}`);
    }).catch((err) => setError(err.message));
  };

  const selfEnrollStudent = async (event) => {
    event.preventDefault();
    if (!selfEnrollCode) {
      setError('Course code is required');
      return;
    }
    if (enrolledCourseCodes.has(selfEnrollCode)) {
      setError(`You are already enrolled in ${selfEnrollCode}`);
      return;
    }
    const response = await call(() => api.post('/courses/enroll-self', { courseCode: selfEnrollCode }));
    if (response) {
      const enrolledCode = selfEnrollCode;
      setSelfEnrollCode('');
      await loadBase();
      setMessage(`Enrolled in ${enrolledCode}`);
    }
  };

  const selfEnrollFromList = async (courseCode) => {
    if (enrolledCourseCodes.has(courseCode)) {
      setError(`You are already enrolled in ${courseCode}`);
      return;
    }
    const response = await call(() => api.post('/courses/enroll-self', { courseCode }));
    if (response) {
      await loadBase();
      setMessage(`Enrolled in ${courseCode}`);
    }
  };

  const downloadSessionAttendance = async (sessionId, session) => {
    setDownloadingSessionId(sessionId);
    try {
      const token = localStorage.getItem('arms_access_token');
      const response = await fetch(`/api/attendance/${sessionId}/download.pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      if (!response.ok) throw new Error('Failed to download attendance');
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const courseCode = session.course?.code || 'Unknown';
      const sessionDate = new Date(session.startsAt).toISOString().split('T')[0];
      link.download = `attendance_${courseCode}_${sessionDate}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
      
      setMessage('Attendance report downloaded as PDF');
    } catch (err) {
      setError(err.message || 'Failed to download attendance report');
    } finally {
      setDownloadingSessionId('');
    }
  };

  const chartData = useMemo(() => {
    if (user.role === 'student') {
      return (dashboard?.summaries || []).map((item) => ({ name: item.courseCode, value: item.percentage }));
    }
    if (user.role === 'super_admin') {
      return [
        { name: 'Courses',   value: dashboard?.courses   || 0 },
        { name: 'Lecturers', value: dashboard?.lecturers || 0 },
        { name: 'Students',  value: dashboard?.students  || 0 },
        { name: 'Sessions',  value: dashboard?.sessions  || 0 },
      ];
    }
    if (user.role === 'lecturer') {
      const grouped = {};
      attendance.forEach((item) => { const key = item.course?.code || 'X'; grouped[key] = (grouped[key] || 0) + 1; });
      return Object.keys(grouped).map((key) => ({ name: key, value: grouped[key] }));
    }
    return [];
  }, [dashboard, attendance, user.role]);

  const roleLabel = { super_admin: 'Administrator', lecturer: 'Lecturer', student: 'Student' }[user.role] || user.role;
  const currentSections = sectionsByRole[user.role] || [{ key: 'overview', label: 'Overview' }];
  const quickActions = currentSections.filter((s) => s.key !== 'overview');
  const canGoPrevAttendance = attendanceMeta.page > 1;
  const canGoNextAttendance = attendanceMeta.page < attendanceMeta.totalPages;
  const formatLocation = (location) => {
    if (!location) {
      return 'N/A';
    }

    const address = [location.displayName, [location.city, location.state, location.country].filter(Boolean).join(', ')]
      .filter(Boolean)[0];

    if (address) {
      return address;
    }

    if (location.latitude != null && location.longitude != null) {
      return `${Number(location.latitude).toFixed(5)}, ${Number(location.longitude).toFixed(5)}${location.accuracy ? ` (±${Math.round(location.accuracy)}m)` : ''}`;
    }

    return 'N/A';
  };

  return (
    <div className="arms-root">
      {/* ── TOP BAR ── */}
      <header className="arms-topbar">
        <div className="arms-topbar-brand">
          <div className="arms-topbar-crest">A</div>
          <div>
            <div className="arms-topbar-title">CoreNova</div>
            <div className="arms-topbar-meta">Attendance &amp; Records Management</div>
          </div>
        </div>
        <div className="arms-topbar-right">
          <span className="arms-role-badge">{roleLabel}</span>
          <span className="arms-user-name">{user.firstName} {user.lastName}</span>
          <button
            className="arms-signout"
            type="button"
            onClick={() => {
              setSigningOut(true);
              logout();
            }}
            disabled={signingOut}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </header>

      {/* ── CANVAS ── */}
      <main className="arms-canvas">

        {/* Feedback toast */}
        {(message || error) && (
          <div className={`arms-toast ${error ? 'error' : 'success'}`}>
            <span>{error ? '✕' : '✓'}</span>
            <span>{error || message}</span>
          </div>
        )}

        {/* ── SUPER ADMIN STATS ── */}
        {user.role === 'super_admin' && dashboard && activeSection === 'overview' && (
          <div className="arms-stats">
            {[
              { label: 'Courses',   value: dashboard.courses   ?? 0 },
              { label: 'Lecturers', value: dashboard.lecturers ?? 0 },
              { label: 'Students',  value: dashboard.students  ?? 0 },
              { label: 'Sessions',  value: dashboard.sessions  ?? 0 },
            ].map((s) => (
              <div key={s.label} className="arms-stat">
                <span className="arms-stat-value">{s.value}</span>
                <span className="arms-stat-label">{s.label}</span>
                <div className="arms-stat-accent" />
              </div>
            ))}
          </div>
        )}

        {/* ── OVERVIEW: chart + notifications ── */}
        {activeSection === 'overview' && <div className="arms-overview">
          <div className="arms-card">
            <p className="arms-card-title">Overview</p>
            {chartData.length > 0 ? (
              <div style={{ height: 240, marginTop: '.5rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fontFamily: 'Source Serif 4', fontSize: 11, fill: '#6b6358' }} axisLine={{ stroke: '#e2ddd5' }} tickLine={false} />
                    <YAxis tick={{ fontFamily: 'Source Serif 4', fontSize: 11, fill: '#6b6358' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="value" stroke="#1a5c55" strokeWidth={2} dot={{ r: 3, fill: '#1a5c55' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ marginTop: '.75rem' }}><Empty text="No data available yet." /></div>
            )}
            {quickActions.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <span className="arms-label" style={{ display: 'block', marginBottom: '.6rem' }}>Quick actions</span>
                <div className="arms-report-row">
                  {quickActions.slice(0, 3).map((section) => (
                    <button
                      key={section.key}
                      type="button"
                      className="arms-btn-ghost"
                      onClick={() => setActiveSection(section.key)}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="arms-card">
            <p className="arms-card-title">Notifications</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', maxHeight: 280, overflowY: 'auto' }}>
              {notifications.length === 0 && <Empty text="No notifications." />}
              {notifications.map((item) => (
                <div key={item._id} className={`arms-notif ${!item.read ? 'unread' : ''}`}>
                  <p className="arms-notif-title">{item.title}</p>
                  <p className="arms-notif-body">{item.message}</p>
                  {!item.read && (
                    <button className="arms-btn-muted" style={{ marginTop: '.5rem' }} onClick={() => markRead(item._id)}>
                      Mark as read
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>}

        {/* ══════════════════════════════════════
            SUPER ADMIN FORMS
        ══════════════════════════════════════ */}
        {user.role === 'super_admin' && activeSection === 'admin' && (
          <>
            <SectionLabel>User Management</SectionLabel>
            <div className="arms-grid-2" style={{ marginBottom: '1.5rem' }}>
              {/* Create Lecturer */}
              <form className="arms-card" onSubmit={createLecturer} style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                <p className="arms-card-title">Register Lecturer</p>
                <div className="arms-grid-2">
                  <Field label="First name"><input className="arms-input" value={lecturerForm.firstName} onChange={(e) => setLecturerForm((s) => ({ ...s, firstName: e.target.value }))} /></Field>
                  <Field label="Last name"><input className="arms-input" value={lecturerForm.lastName} onChange={(e) => setLecturerForm((s) => ({ ...s, lastName: e.target.value }))} /></Field>
                </div>
                <Field label="Email address"><input className="arms-input" type="email" value={lecturerForm.email} onChange={(e) => setLecturerForm((s) => ({ ...s, email: e.target.value }))} /></Field>
                <Field label="Password"><input className="arms-input" type="password" value={lecturerForm.password} onChange={(e) => setLecturerForm((s) => ({ ...s, password: e.target.value }))} /></Field>
                <div><button className="arms-btn-primary" disabled={busy}>Create Lecturer</button></div>
              </form>

              {/* Create Student */}
              <form className="arms-card" onSubmit={createStudent} style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                <p className="arms-card-title">Register Student</p>
                <div className="arms-grid-2">
                  <Field label="First name"><input className="arms-input" value={studentForm.firstName} onChange={(e) => setStudentForm((s) => ({ ...s, firstName: e.target.value }))} /></Field>
                  <Field label="Last name"><input className="arms-input" value={studentForm.lastName} onChange={(e) => setStudentForm((s) => ({ ...s, lastName: e.target.value }))} /></Field>
                </div>
                <Field label="Matric number"><input className="arms-input" value={studentForm.matricNumber} onChange={(e) => setStudentForm((s) => ({ ...s, matricNumber: e.target.value.toUpperCase() }))} /></Field>
                <Field label="Email address"><input className="arms-input" type="email" value={studentForm.email} onChange={(e) => setStudentForm((s) => ({ ...s, email: e.target.value }))} /></Field>
                <Field label="Password"><input className="arms-input" type="password" value={studentForm.password} onChange={(e) => setStudentForm((s) => ({ ...s, password: e.target.value }))} /></Field>
                <div><button className="arms-btn-primary" disabled={busy}>Create Student</button></div>
              </form>
            </div>

            <SectionLabel>Course Management</SectionLabel>
            <div className="arms-grid-2" style={{ marginBottom: '1.5rem' }}>
              {/* Create Course */}
              <form className="arms-card" onSubmit={createCourse} style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                <p className="arms-card-title">Add Course</p>
                <Field label="Course name"><input className="arms-input" value={courseForm.name} onChange={(e) => setCourseForm((s) => ({ ...s, name: e.target.value }))} /></Field>
                <Field label="Course code"><input className="arms-input" value={courseForm.code} onChange={(e) => setCourseForm((s) => ({ ...s, code: e.target.value }))} /></Field>
                <Field label="Assigned lecturer">
                  <select className="arms-input" value={courseForm.lecturerId} onChange={(e) => setCourseForm((s) => ({ ...s, lecturerId: e.target.value }))}>
                    <option value="">Select lecturer</option>
                    {lecturers.map((item) => <option key={item._id} value={item._id}>{item.firstName} {item.lastName}</option>)}
                  </select>
                </Field>
                <div><button className="arms-btn-primary" disabled={busy}>Add Course</button></div>
                <div style={{ borderTop: '1px solid var(--rule)', paddingTop: '.75rem' }}>
                  <span className="arms-label" style={{ display: 'block', marginBottom: '.4rem' }}>Course offering counts</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', maxHeight: 160, overflowY: 'auto' }}>
                    {courses.map((item) => (
                      <div key={item._id} style={{ fontSize: '.82rem', color: 'var(--ink-3)' }}>
                        {item.code} — {item.name}: <strong style={{ color: 'var(--ink)' }}>{item.studentCount ?? item.students?.length ?? 0}</strong>
                      </div>
                    ))}
                    {courses.length === 0 && <Empty text="No courses available." />}
                  </div>
                </div>
              </form>

              {/* Enroll Student */}
              <form className="arms-card" onSubmit={enrollStudent} style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                <p className="arms-card-title">Enroll Student</p>
                <Field label="Student">
                  <select className="arms-input" value={enrollForm.studentId} onChange={(e) => setEnrollForm((s) => ({ ...s, studentId: e.target.value }))}>
                    <option value="">Select student</option>
                    {students.map((item) => <option key={item._id} value={item._id}>{item.firstName} {item.lastName}</option>)}
                  </select>
                </Field>
                <Field label="Course">
                  <select className="arms-input" value={enrollForm.courseId} onChange={(e) => setEnrollForm((s) => ({ ...s, courseId: e.target.value }))}>
                    <option value="">Select course</option>
                    {courses.map((item) => <option key={item._id} value={item._id}>{item.code} — {item.name}</option>)}
                  </select>
                </Field>
                <div><button className="arms-btn-primary" disabled={busy}>Enroll Student</button></div>
              </form>
            </div>

            {/* System Settings */}
            {settings && (
              <>
                <SectionLabel>System Settings</SectionLabel>
                <form className="arms-card" onSubmit={updateSettings} style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p className="arms-card-title">Institution Configuration</p>
                  <div className="arms-settings-grid">
                    <Field label="Organisation name"><input className="arms-input" value={settings.organizationName || ''} onChange={(e) => setSettings((s) => ({ ...s, organizationName: e.target.value }))} /></Field>
                    <Field label="Logo URL"><input className="arms-input" value={settings.logoUrl || ''} onChange={(e) => setSettings((s) => ({ ...s, logoUrl: e.target.value }))} /></Field>
                    <Field label="Low attendance threshold (%)"><input className="arms-input" type="number" value={settings.lowAttendanceThreshold || 75} onChange={(e) => setSettings((s) => ({ ...s, lowAttendanceThreshold: Number(e.target.value) }))} /></Field>
                  </div>
                  <div className="arms-checkbox-row">
                    <label className="arms-checkbox-label"><input type="checkbox" checked={Boolean(settings.notificationsEnabled)} onChange={(e) => setSettings((s) => ({ ...s, notificationsEnabled: e.target.checked }))} />Notifications enabled</label>
                    <label className="arms-checkbox-label"><input type="checkbox" checked={Boolean(settings.featureFlags?.geolocationRequired)} onChange={(e) => setSettings((s) => ({ ...s, featureFlags: { ...s.featureFlags, geolocationRequired: e.target.checked } }))} />Require geolocation</label>
                    <label className="arms-checkbox-label"><input type="checkbox" checked={Boolean(settings.featureFlags?.emailAlertsEnabled)} onChange={(e) => setSettings((s) => ({ ...s, featureFlags: { ...s.featureFlags, emailAlertsEnabled: e.target.checked } }))} />Email alerts</label>
                  </div>
                  <div><button className="arms-btn-primary" disabled={busy}>Save Settings</button></div>
                </form>
              </>
            )}
          </>
        )}

        {/* ══════════════════════════════════════
            LECTURER ADD COURSE
        ══════════════════════════════════════ */}
        {user.role === 'lecturer' && activeSection === 'overview' && (
          <>
            <SectionLabel>Course Management</SectionLabel>
            <div className="arms-grid-2" style={{ marginBottom: '1.5rem' }}>
              {/* Add Course (Lecturer) */}
              <form className="arms-card" onSubmit={async (event) => {
                event.preventDefault();
                setError('');
                setMessage('');
                const { name, code } = courseForm;
                if (!name.trim() || !code.trim()) {
                  setError('Please enter course name and code.');
                  return;
                }
                const response = await call(() => api.post('/courses', { name, code, lecturerId: user._id }), 'Course created');
                if (response) { setCourseForm({ name: '', code: '', lecturerId: user._id }); setCourses((prev) => [response.data, ...prev]); }
              }} style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                <p className="arms-card-title">Add Course</p>
                <Field label="Course name"><input className="arms-input" value={courseForm.name} onChange={(e) => setCourseForm((s) => ({ ...s, name: e.target.value }))} /></Field>
                <Field label="Course code"><input className="arms-input" value={courseForm.code} onChange={(e) => setCourseForm((s) => ({ ...s, code: e.target.value }))} /></Field>
                <div><button className="arms-btn-primary" disabled={busy}>Add Course</button></div>
                <div style={{ borderTop: '1px solid var(--rule)', paddingTop: '.75rem' }}>
                  <span className="arms-label" style={{ display: 'block', marginBottom: '.4rem' }}>My Courses</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', maxHeight: 160, overflowY: 'auto' }}>
                    {courses.filter((item) => item.lecturer?._id === user._id || item.lecturer === user._id).map((item) => (
                      <div key={item._id} style={{ fontSize: '.82rem', color: 'var(--ink-3)' }}>
                        {item.code} — {item.name}: <strong style={{ color: 'var(--ink)' }}>{item.studentCount ?? item.students?.length ?? 0}</strong>
                      </div>
                    ))}
                    {courses.filter((item) => item.lecturer?._id === user._id || item.lecturer === user._id).length === 0 && <Empty text="No courses available." />}
                  </div>
                </div>
              </form>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════
            LECTURER / ADMIN SESSIONS
        ══════════════════════════════════════ */}
        {(user.role === 'lecturer' || user.role === 'super_admin') && activeSection === 'sessions' && (
          <>
            <SectionLabel>Session Management</SectionLabel>
            <div className="arms-grid-2" style={{ marginBottom: '1.5rem' }}>
              {/* Create Session */}
              <form className="arms-card" onSubmit={createSession} style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                <p className="arms-card-title">Create Session</p>
                <Field label="Course">
                  <select className="arms-input" value={sessionForm.courseId} onChange={(e) => setSessionForm((s) => ({ ...s, courseId: e.target.value }))}>
                    <option value="">Select course</option>
                    {courses.map((item) => <option key={item._id} value={item._id}>{item.code} — {item.name}</option>)}
                  </select>
                </Field>
                <Field label="Session title"><input className="arms-input" value={sessionForm.title} onChange={(e) => setSessionForm((s) => ({ ...s, title: e.target.value }))} /></Field>
                <div className="arms-grid-2">
                  <Field label="Starts at"><input className="arms-input" type="datetime-local" value={sessionForm.startsAt} onChange={(e) => setSessionForm((s) => ({ ...s, startsAt: e.target.value }))} /></Field>
                  <Field label="Ends at"><input className="arms-input" type="datetime-local" value={sessionForm.endsAt} onChange={(e) => setSessionForm((s) => ({ ...s, endsAt: e.target.value }))} /></Field>
                </div>
                <Field label="Late cutoff (minutes)"><input className="arms-input" type="number" value={sessionForm.lateCutoffMinutes} onChange={(e) => setSessionForm((s) => ({ ...s, lateCutoffMinutes: Number(e.target.value) }))} /></Field>
                <Field label="Code rotation interval">
                  <select className="arms-input" value={sessionForm.codeRotationSeconds} onChange={(e) => setSessionForm((s) => ({ ...s, codeRotationSeconds: Number(e.target.value) }))}>
                    <option value={0}>Permanent (no expiry)</option>
                    <option value={30}>30 seconds</option>
                    <option value={60}>1 minute</option>
                  </select>
                </Field>
                <div><button className="arms-btn-primary" disabled={busy}>Create Session</button></div>
              </form>

              {/* Override + Reports */}
              <form className="arms-card" onSubmit={overrideAttendance} style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                <p className="arms-card-title">Override Attendance</p>
                <Field label="Attendance record ID"><input className="arms-input" value={overrideForm.attendanceId} onChange={(e) => setOverrideForm((s) => ({ ...s, attendanceId: e.target.value }))} /></Field>
                <Field label="New status">
                  <select className="arms-input" value={overrideForm.status} onChange={(e) => setOverrideForm((s) => ({ ...s, status: e.target.value }))}>
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                  </select>
                </Field>
                <div><button className="arms-btn-secondary" disabled={busy}>Apply Override</button></div>
                <div style={{ borderTop: '1px solid var(--rule)', paddingTop: '.85rem' }}>
                  <span className="arms-label" style={{ display: 'block', marginBottom: '.5rem' }}>Export Reports</span>
                  <div className="arms-report-row">
                    <button type="button" className="arms-btn-ghost" onClick={() => openReport('json')}>JSON</button>
                    <button type="button" className="arms-btn-ghost" onClick={() => openReport('pdf')}>PDF</button>
                  </div>
                </div>
              </form>
            </div>

            {/* Sessions list */}
            <div className="arms-card" style={{ marginBottom: '1.5rem' }}>
              <p className="arms-card-title">Active &amp; Scheduled Sessions</p>
              <p style={{ fontSize: '.78rem', color: 'var(--ink-3)', marginBottom: '.65rem' }}>
                Open session codes auto-refresh every 10 seconds on this screen.
              </p>
              {sessions.length === 0 && <Empty text="No sessions found." />}
              <div className="arms-grid-3" style={{ marginTop: sessions.length > 0 ? '.75rem' : 0 }}>
                {sessions.map((item) => (
                  <div key={item._id} className={`arms-session-card ${item.isOpen ? 'arms-session-open' : 'arms-session-closed'}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ fontWeight: 600, fontSize: '.9rem' }}>{item.title}</p>
                      <span style={{ fontSize: '.68rem', letterSpacing: '.08em', textTransform: 'uppercase', color: item.isOpen ? 'var(--teal)' : 'var(--ink-4)', fontWeight: 600 }}>
                        {item.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    <span className="arms-session-code">{item.course?.code || 'N/A'} · {item.attendanceCode}</span>
                    <p style={{ fontSize: '.75rem', color: 'var(--ink-3)' }}>
                      {item.codeRotationSeconds ? `Code rotates every ${item.codeRotationSeconds}s` : 'Code is permanent'}
                    </p>
                    <p style={{ fontSize: '.78rem', color: 'var(--ink-3)' }}>{new Date(item.startsAt).toLocaleString()}</p>
                    <button className="arms-btn-muted" style={{ alignSelf: 'flex-start' }} onClick={() => setSessionState(item._id, !item.isOpen)}>
                      {item.isOpen ? 'Close session' : 'Open session'}
                    </button>
                    <button 
                      className="arms-btn-secondary" 
                      style={{ alignSelf: 'flex-start' }} 
                      onClick={() => downloadSessionAttendance(item._id, item)}
                      disabled={downloadingSessionId === item._id}
                    >
                      {downloadingSessionId === item._id ? 'Downloading...' : 'Download Attendance (PDF)'}
                    </button>
                    <button 
                      className="arms-btn-secondary" 
                      style={{ alignSelf: 'flex-start', background: 'var(--red-lt)', color: 'var(--red)', border: '1px solid var(--red)' }} 
                      onClick={() => deleteSession(item._id)}
                    >
                      Delete Session
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '.45rem', marginTop: '.35rem' }}>
                      <input
                        className="arms-input"
                        type="number"
                        min="1"
                        placeholder={item.actualHeadcount ? `Headcount: ${item.actualHeadcount}` : 'Set actual headcount'}
                        value={headcountDrafts[item._id] ?? ''}
                        onChange={(e) => {
                          setHeadcountDrafts((prev) => ({ ...prev, [item._id]: e.target.value }));
                          if (headcountFeedback[item._id]) {
                            setHeadcountFeedback((prev) => ({ ...prev, [item._id]: null }));
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="arms-btn-muted"
                        onClick={() => setSessionHeadcount(item._id)}
                        disabled={headcountApplyingId === item._id || !headcountDrafts[item._id]}
                      >
                        {headcountApplyingId === item._id ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                    {headcountFeedback[item._id]?.text && (
                      <p
                        style={{
                          marginTop: '.4rem',
                          fontSize: '.78rem',
                          color: headcountFeedback[item._id].type === 'error' ? 'var(--red)' : 'var(--teal)',
                        }}
                      >
                        {headcountFeedback[item._id].text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════
            STUDENT VIEW
        ══════════════════════════════════════ */}
        {user.role === 'student' && activeSection === 'attendance-submit' && (
          <>
            <SectionLabel>My Attendance</SectionLabel>
            <div className="arms-grid-2" style={{ marginBottom: '1.5rem' }}>
              <form className="arms-card" onSubmit={markAttendance} style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                <p className="arms-card-title">Submit Attendance</p>
                <Field label="Session code">
                  <input
                    className="arms-input"
                    placeholder="Enter code provided by lecturer"
                    value={attendanceForm.sessionCode}
                    onChange={(e) => setAttendanceForm((prev) => ({ ...prev, sessionCode: e.target.value }))}
                  />
                </Field>
                <Field label="Seat number">
                  <input
                    className="arms-input"
                    type="number"
                    min="1"
                    placeholder="Enter your seat number"
                    value={attendanceForm.seatNumber}
                    onChange={(e) => setAttendanceForm((prev) => ({ ...prev, seatNumber: e.target.value }))}
                  />
                </Field>
                {seatAvailability.message && (
                  <p style={{
                    marginTop: '-.35rem',
                    fontSize: '.78rem',
                    color: seatAvailability.available ? 'var(--teal)' : 'var(--red)',
                  }}>
                    {seatAvailability.checking ? 'Checking seat number...' : seatAvailability.message}
                  </p>
                )}
                <div>
                  <button
                    className="arms-btn-primary"
                    disabled={busy || attendanceSubmitting || !attendanceForm.sessionCode.trim() || !attendanceForm.seatNumber || seatAvailability.checking || seatAvailability.available === false}
                  >
                    {attendanceSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>

              <div className="arms-card">
                <p className="arms-card-title">Course Summary</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginTop: '.25rem' }}>
                  {(dashboard?.summaries || []).length === 0 && <Empty text="No course summary available." />}
                  {(dashboard?.summaries || []).map((item) => (
                    <div key={item.courseId} className="arms-summary-item">
                      <p className="arms-summary-name">{item.courseCode} — {item.courseName}</p>
                      <p className="arms-summary-pct">Attendance: {item.percentage}%</p>
                      <div className="arms-summary-bar-track">
                        <div className="arms-summary-bar-fill" style={{ width: `${Math.min(item.percentage, 100)}%`, background: item.percentage < 75 ? 'var(--red)' : 'var(--teal)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </>
        )}

        {user.role === 'student' && activeSection === 'enroll' && (
          <>
            <SectionLabel>Course Enrollment</SectionLabel>
            <div className="arms-grid-2" style={{ marginBottom: '1.5rem' }}>
              <form className="arms-card" onSubmit={selfEnrollStudent} style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                <p className="arms-card-title">Enroll in a Course</p>
                <Field label="Course code">
                  <select
                    className="arms-input"
                    value={selfEnrollCode}
                    onChange={(e) => setSelfEnrollCode(e.target.value.toUpperCase())}
                  >
                    <option value="">Select course</option>
                    {availableCourses.map((item) => (
                      <option key={item._id} value={item.code}>
                        {item.code} - {item.name}{enrolledCourseCodes.has(item.code) ? ' (Enrolled)' : ''}
                      </option>
                    ))}
                  </select>
                </Field>
                <div>
                  <button
                    className="arms-btn-primary"
                    disabled={busy || !selfEnrollCode || enrolledCourseCodes.has(selfEnrollCode)}
                  >
                    {selfEnrollCode && enrolledCourseCodes.has(selfEnrollCode) ? 'Already Enrolled' : 'Enroll Myself'}
                  </button>
                </div>
              </form>

              <div className="arms-card">
                <p className="arms-card-title">Available Courses</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginTop: '.25rem' }}>
                  {availableCourses.map((item) => (
                    <div key={item._id} className="arms-summary-item">
                      <p className="arms-summary-name">{item.code} — {item.name}</p>
                      <p className="arms-summary-pct">Students offering this course: {item.studentCount ?? item.students?.length ?? 0}</p>
                      <div style={{ marginTop: '.5rem' }}>
                        <button
                          type="button"
                          className="arms-btn-muted"
                          disabled={busy || enrolledCourseCodes.has(item.code)}
                          onClick={() => selfEnrollFromList(item.code)}
                        >
                          {enrolledCourseCodes.has(item.code) ? `Already enrolled in ${item.code}` : `Enroll in ${item.code}`}
                        </button>
                      </div>
                    </div>
                  ))}
                  {availableCourses.length === 0 && <Empty text="No available courses." />}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════
            ATTENDANCE RECORDS TABLE
        ══════════════════════════════════════ */}
        {(user.role === 'super_admin' || user.role === 'lecturer') && activeSection === 'attendance' && <>
        <SectionLabel>Attendance Records</SectionLabel>
        <div className="arms-card" style={{ marginBottom: '1rem' }}>
          <div className="arms-grid-3">
            <Field label="Student name or email">
              <input
                className="arms-input"
                placeholder="Search student"
                value={attendanceSearch}
                onChange={(e) => setAttendanceSearch(e.target.value)}
              />
            </Field>
            <Field label="Matric number">
              <input
                className="arms-input"
                placeholder="e.g. CSC/23/001"
                value={attendanceMatric}
                onChange={(e) => setAttendanceMatric(e.target.value.toUpperCase())}
              />
            </Field>
            <Field label="Course (optional)">
              <select
                className="arms-input"
                value={attendanceCourseId}
                onChange={(e) => setAttendanceCourseId(e.target.value)}
              >
                <option value="">All courses</option>
                {courses.map((item) => <option key={item._id} value={item._id}>{item.code} — {item.name}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ marginTop: '.8rem' }}>
            <Field label="Filter attendance status">
              <select
                className="arms-input"
                value={attendanceStatusFilter}
                onChange={(e) => setAttendanceStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="absent">Absent only</option>
                <option value="not_absent">Not absent (present + late)</option>
                <option value="present">Present only</option>
                <option value="late">Late only</option>
              </select>
            </Field>
          </div>
        </div>
        <div className="arms-card" style={{ marginBottom: '2rem' }}>
          <div className="arms-table-wrap">
            <table className="arms-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Session</th>
                  <th>Seat</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Submitted</th>
                  <th>Record ID</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 && (
                  <tr><td colSpan={8}><Empty text="No attendance records found." /></td></tr>
                )}
                {attendance.map((item) => (
                  <tr key={item._id}>
                    <td data-label="Student">{item.student ? `${item.student.firstName} ${item.student.lastName}` : user.firstName}</td>
                    <td data-label="Course">{item.course?.code || '—'}</td>
                    <td data-label="Session">{item.session?.title || '—'}</td>
                    <td data-label="Seat">{item.seatNumber || '—'}</td>
                    <td data-label="Status"><span className={`arms-status ${item.status}`}>{item.status}</span>{item.isFalseAttendance ? ' (False attendance)' : ''}</td>
                    <td data-label="Location">{formatLocation(item.location)}</td>
                    <td data-label="Submitted" style={{ whiteSpace: 'nowrap', color: 'var(--ink-3)', fontSize: '.82rem' }}>{new Date(item.submittedAt).toLocaleString()}</td>
                    <td data-label="Record ID"><span className="arms-id-cell" title={item._id}>{item._id}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem', marginTop: '.85rem', flexWrap: 'wrap' }}>
            <span className="arms-label" style={{ margin: 0 }}>Page {attendanceMeta.page} of {attendanceMeta.totalPages} ({attendanceMeta.total} records)</span>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button type="button" className="arms-btn-muted" disabled={!canGoPrevAttendance || busy} onClick={() => setAttendancePage((p) => Math.max(p - 1, 1))}>Previous</button>
              <button type="button" className="arms-btn-muted" disabled={!canGoNextAttendance || busy} onClick={() => setAttendancePage((p) => p + 1)}>Next</button>
            </div>
          </div>
        </div>
        </>}

        {user.role === 'student' && activeSection === 'attendance-history' && <>
        <SectionLabel>My Attendance Records</SectionLabel>
        <div className="arms-card" style={{ marginBottom: '2rem' }}>
          <div className="arms-table-wrap">
            <table className="arms-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Session</th>
                  <th>Seat</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Submitted</th>
                  <th>Record ID</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 && (
                  <tr><td colSpan={7}><Empty text="No attendance records found." /></td></tr>
                )}
                {attendance.map((item) => (
                  <tr key={item._id}>
                    <td data-label="Course">{item.course?.code || '—'}</td>
                    <td data-label="Session">{item.session?.title || '—'}</td>
                    <td data-label="Seat">{item.seatNumber || '—'}</td>
                    <td data-label="Status"><span className={`arms-status ${item.status}`}>{item.status}</span>{item.isFalseAttendance ? ' (False attendance)' : ''}</td>
                    <td data-label="Location">{formatLocation(item.location)}</td>
                    <td data-label="Submitted" style={{ whiteSpace: 'nowrap', color: 'var(--ink-3)', fontSize: '.82rem' }}>{new Date(item.submittedAt).toLocaleString()}</td>
                    <td data-label="Record ID"><span className="arms-id-cell" title={item._id}>{item._id}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem', marginTop: '.85rem', flexWrap: 'wrap' }}>
            <span className="arms-label" style={{ margin: 0 }}>Page {attendanceMeta.page} of {attendanceMeta.totalPages} ({attendanceMeta.total} records)</span>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <button type="button" className="arms-btn-muted" disabled={!canGoPrevAttendance || busy} onClick={() => setAttendancePage((p) => Math.max(p - 1, 1))}>Previous</button>
              <button type="button" className="arms-btn-muted" disabled={!canGoNextAttendance || busy} onClick={() => setAttendancePage((p) => p + 1)}>Next</button>
            </div>
          </div>
        </div>
        </>}
      </main>

      <nav className="arms-bottom-nav" aria-label="Section navigation">
        <div className="arms-bottom-nav-inner">
          {currentSections.map((section) => (
            <button
              key={section.key}
              type="button"
              className={`arms-bottom-nav-item ${activeSection === section.key ? 'active' : ''}`}
              onClick={() => setActiveSection(section.key)}
              aria-current={activeSection === section.key ? 'page' : undefined}
              aria-label={section.label}
            >
              {section.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default DashboardPage;