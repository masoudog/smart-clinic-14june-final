// Patients list page
const PatientsPage = ({ patients, searchValue, onPatientClick, onAddPatient }) => {
  const [filter, setFilter] = React.useState('all');
  const [tagFilter, setTagFilter] = React.useState('');
  const D = window.CLINIC_DATA;
  const list = patients || D.patients;
  const allTags = [...new Set(list.flatMap(p => p.tags || []))];

  const filtered = list.filter(p => {
    const q = searchValue.trim();
    const matchSearch = !q || (p.firstName + ' ' + p.lastName).includes(q) || p.phone.includes(q);
    const matchFilter = filter === 'all'
      || (filter === 'active' && p.status === 'active')
      || (filter === 'inactive' && p.status === 'inactive');
    const matchTag = !tagFilter || (p.tags || []).includes(tagFilter);
    return matchSearch && matchFilter && matchTag;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">مراجعین</h1>
          <div className="page-sub">{toFa(filtered.length)} مراجع از {toFa(list.length)}</div>
        </div>
        <button className="btn btn-primary" onClick={onAddPatient}>
          <Icon name="plus" size={14} />
          افزودن مراجع جدید
        </button>
      </div>

      <div className="row between" style={{ marginBottom: 20 }}>
        <div className="filter-chips">
          <button className={`chip ${filter==='all'?'active':''}`} onClick={() => setFilter('all')}>همه</button>
          <button className={`chip ${filter==='active'?'active':''}`} onClick={() => setFilter('active')}>فعال</button>
          <button className={`chip ${filter==='inactive'?'active':''}`} onClick={() => setFilter('inactive')}>غیرفعال</button>
        </div>
        <div className="row gap-8" style={{ alignItems: 'center' }}>
          <Icon name="filter" size={14} />
          <select
            className="patients-tag-filter"
            value={tagFilter}
            onChange={e => setTagFilter(e.target.value)}>
            <option value="">همهٔ برچسب‌ها</option>
            {allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><Icon name="users" size={24} /></div>
            <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>مراجعی پیدا نشد</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>جستجو یا فیلترها را تغییر دهید</div>
          </div>
        ) : (
          <table className="patients-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>نام مراجع</th>
                <th>سن</th>
                <th>آخرین جلسه</th>
                <th>تعداد جلسات</th>
                <th>وضعیت</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="patient-row" onClick={() => onPatientClick(p)}>
                  <td>
                    <div className="row gap-12">
                      <Avatar initials={patientInitials(p)} color={p.color} />
                      <div>
                        <div style={{ fontWeight: 500 }}>{p.firstName} {p.lastName}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>
                          {p.tags.slice(0,2).join(' • ')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--ink-soft)' }}>{toFa(p.age)} سال</td>
                  <td style={{ color: 'var(--ink-soft)' }}>{p.lastSession}</td>
                  <td style={{ color: 'var(--ink-soft)' }}>{toFa(p.sessions)}</td>
                  <td>
                    {p.status === 'active'
                      ? <span className="tag tag-active"><span className="tag-dot"></span>فعال</span>
                      : <span className="tag tag-inactive"><span className="tag-dot"></span>غیرفعال</span>}
                  </td>
                  <td style={{ width: 32 }}>
                    <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={e => e.stopPropagation()}>
                      <Icon name="chevronLeft" size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// Patient profile page
const PatientProfilePage = ({ patient, onBack, onBookSession, settings = {} }) => {
  const D = window.CLINIC_DATA;
  const therapist = getTherapist('t1');
  const availableTags = settings.patientTags || D.clinicSettings.patientTags || [];

  // Timeline is a board: seeded per-patient. New patients start empty.
  const seedHistory = () => {
    const base = patient.sessions > 0
      ? D.sessionHistory.map(h => ({ ...h, type: 'session' }))
      : [];
    const cx = (D.cancellations || [])
      .filter(c => c.patientId === patient.id)
      .map(c => ({ id: c.id, date: c.date, time: c.time, therapistId: 't1', type: 'cancellation', reason: c.reason, summary: '', tags: [] }));
    return [...cx, ...base];
  };
  const [history, setHistory] = React.useState(seedHistory);

  // Pinned therapist note — merged into the board header.
  const [note, setNote] = React.useState(
    patient.notes || (patient.sessions > 0
      ? 'مراجع پیشرفت قابل توجهی در مدیریت اضطراب دارد. تمرین‌های ذهن‌آگاهی به خوبی پاسخ داده. توصیه به ادامه جلسات هفتگی برای ۲ ماه آینده.'
      : '')
  );
  const [editingNote, setEditingNote] = React.useState(false);
  const [draftNote, setDraftNote] = React.useState(note);

  const [attachments, setAttachments] = React.useState(patient.attachments || []);

  // Board composer + per-entry editing
  const [adding, setAdding] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);

  // Live "now" so new notes carry the real current date & time.
  const jt2 = window.JALALI_TODAY;
  const pad2 = (n) => toFa(String(n).padStart(2, '0'));
  const todayLabel = `${toFa(jt2.year)}/${pad2(jt2.monthIdx + 1)}/${pad2(jt2.day)}`;
  const nowTime = () => { const d = new Date(); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
  const addEntry = (draft) => {
    setHistory(h => [{ id: 'sh' + Date.now(), date: todayLabel, time: draft.time || nowTime(), therapistId: 't1', type: draft.type || 'session', summary: draft.summary, reason: draft.reason || '', tags: draft.tags || [] }, ...h]);
    setAdding(false);
  };
  const updateEntry = (id, patch) => {
    setHistory(h => h.map(e => e.id === id ? { ...e, ...patch } : e));
    setEditingId(null);
  };
  const removeEntry = (id) => setHistory(h => h.filter(e => e.id !== id));

  const sessionCount = history.filter(h => h.type !== 'cancellation').length;

  const [editingProfile, setEditingProfile] = React.useState(false);
  const [profile, setProfile] = React.useState({
    firstName: patient.firstName,
    lastName: patient.lastName,
    age: patient.age,
    phone: patient.phone,
  });
  const [draftProfile, setDraftProfile] = React.useState(profile);

  const saveNote = () => { setNote(draftNote); setEditingNote(false); };
  const cancelNote = () => { setDraftNote(note); setEditingNote(false); };
  const saveProfile = () => { setProfile(draftProfile); setEditingProfile(false); };
  const cancelProfile = () => { setDraftProfile(profile); setEditingProfile(false); };

  return (
    <div className="page">
      <button className="btn btn-soft" onClick={onBack} style={{ marginBottom: 20 }}>
        <Icon name="arrow" size={14} />
        بازگشت به مراجعین
      </button>

      <div className="profile-banner" style={{ marginBottom: 24 }}>
        <div className="organic-shape" style={{ background: colorMap[patient.color], width: 200, height: 200, top: -60, left: -60, opacity: 0.6 }}></div>
        <div className="organic-shape" style={{ background: 'var(--sage)', width: 140, height: 140, bottom: -50, right: 200, opacity: 0.3 }}></div>

        <div style={{ position: 'relative', zIndex: 1 }} className="row between">
          <div className="row gap-16">
            <Avatar initials={patientInitials({ ...patient, ...profile })} color={patient.color} size="xl" />
            <div>
              {editingProfile ? (
                <div className="col gap-8" style={{ maxWidth: 380 }}>
                  <div className="row gap-8">
                    <input
                      className="profile-edit-input"
                      value={draftProfile.firstName}
                      onChange={e => setDraftProfile({ ...draftProfile, firstName: e.target.value })}
                      placeholder="نام"
                    />
                    <input
                      className="profile-edit-input"
                      value={draftProfile.lastName}
                      onChange={e => setDraftProfile({ ...draftProfile, lastName: e.target.value })}
                      placeholder="نام خانوادگی"
                    />
                  </div>
                  <div className="row gap-8">
                    <input
                      className="profile-edit-input"
                      style={{ width: 80 }}
                      value={draftProfile.age}
                      onChange={e => setDraftProfile({ ...draftProfile, age: e.target.value })}
                      placeholder="سن"
                    />
                    <input
                      className="profile-edit-input"
                      style={{ flex: 1 }}
                      value={draftProfile.phone}
                      onChange={e => setDraftProfile({ ...draftProfile, phone: e.target.value })}
                      placeholder="شماره تماس"
                    />
                  </div>
                  <div className="row gap-8" style={{ marginTop: 4 }}>
                    <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={saveProfile}>ذخیره</button>
                    <button className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: 12 }} onClick={cancelProfile}>انصراف</button>
                  </div>
                </div>
              ) : (
                <React.Fragment>
                  <div className="row gap-8" style={{ alignItems: 'center' }}>
                    <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>{profile.firstName} {profile.lastName}</h2>
                    <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => { setDraftProfile(profile); setEditingProfile(true); }} title="ویرایش">
                      <Icon name="edit" size={13} />
                    </button>
                  </div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 4 }}>
                    {toFa(profile.age)} سال • {profile.phone}
                  </div>
                  <div className="row gap-4" style={{ marginTop: 10, flexWrap: 'wrap' }}>
                    {patient.status === 'active'
                      ? <span className="tag tag-active"><span className="tag-dot"></span>مراجع فعال</span>
                      : <span className="tag tag-inactive"><span className="tag-dot"></span>غیرفعال</span>}
                    {patient.tags.map(t => <span key={t} className="tag" style={{ background: 'var(--bg-elevated)', color: 'var(--ink-soft)', border: '1px solid var(--line-soft)' }}>{t}</span>)}
                  </div>
                </React.Fragment>
              )}
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => onBookSession(patient)}>
            <Icon name="plus" size={14} />
            رزرو جلسه جدید
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Timeline board */}
        <div className="card card-lg">
          <div className="row between" style={{ marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>تایم‌لاین جلسات</div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{toFa(sessionCount)} جلسه برگزار شده</div>
            </div>
            <button className="btn btn-soft" style={{ padding: '7px 14px', fontSize: 12 }} onClick={() => { setAdding(true); setEditingId(null); }}>
              <Icon name="plus" size={13} />
              افزودن یادداشت
            </button>
          </div>

          {/* Pinned therapist note — merged in from the old standalone box */}
          <div className="tl-pinned">
            <div className="row between" style={{ marginBottom: editingNote ? 10 : (note ? 8 : 0) }}>
              <div className="row gap-8" style={{ alignItems: 'center' }}>
                <Icon name="note" size={14} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>یادداشت درمانگر</span>
              </div>
              {!editingNote && (
                <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => { setDraftNote(note); setEditingNote(true); }} title="ویرایش">
                  <Icon name="edit" size={13} />
                </button>
              )}
            </div>
            {editingNote ? (
              <div className="col gap-8">
                <textarea className="note-edit-area" value={draftNote} onChange={e => setDraftNote(e.target.value)} rows={4} placeholder="یادداشت کلی درمانگر درباره مراجع..." autoFocus />
                <div className="row gap-8" style={{ justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => { setDraftNote(note); setEditingNote(false); }}>انصراف</button>
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => { setNote(draftNote); setEditingNote(false); }}>ذخیره</button>
                </div>
              </div>
            ) : (
              note
                ? <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{note}</div>
                : <div style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>هنوز یادداشتی ثبت نشده — برای افزودن، روی مداد بزنید.</div>
            )}
          </div>

          {/* Composer */}
          {adding && <EntryComposer availableTags={availableTags} onSave={addEntry} onCancel={() => setAdding(false)} />}

          {/* Entries */}
          {history.length === 0 && !adding ? (
            <div className="tl-empty">
              <div className="tl-empty-icon"><Icon name="calendar" size={22} /></div>
              <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>هنوز جلسه‌ای ثبت نشده</div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>پس از اولین جلسه، یادداشت‌ها اینجا ثبت می‌شود.</div>
            </div>
          ) : (
            <div style={{ position: 'relative', marginTop: 18 }}>
              <div style={{ position: 'absolute', right: 18, top: 10, bottom: 10, width: 1, background: 'var(--line)' }}></div>
              {history.map(h => (
                <TimelineEntry
                  key={h.id}
                  entry={h}
                  availableTags={availableTags}
                  therapistName={getTherapist(h.therapistId)?.name}
                  editing={editingId === h.id}
                  onEdit={() => { setEditingId(h.id); setAdding(false); }}
                  onSave={(patch) => updateEntry(h.id, patch)}
                  onCancelEdit={() => setEditingId(null)}
                  onDelete={() => removeEntry(h.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <div className="col gap-16">
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>اطلاعات فردی</div>
            <InfoRow label="کد مراجع" value={patient.id.toUpperCase()} />
            <InfoRow label="درمانگر" value={therapist.name} />
            <InfoRow label="تاریخ شروع" value={patient.sessions > 0 ? '۱۴۰۴/۰۹/۱۲' : todayLabel} last={!patient.companion} />
            {patient.companion && (
              <React.Fragment>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', margin: '14px 0 2px' }}>
                  اطلاعات همراه
                </div>
                {patient.companion.relation && <InfoRow label="نسبت" value={patient.companion.relation} />}
                {patient.companion.name && <InfoRow label="نام همراه" value={patient.companion.name} />}
                {patient.companion.phone && <InfoRow label="تماس همراه" value={patient.companion.phone} last />}
              </React.Fragment>
            )}
          </div>

          {/* Attachments */}
          <AttachmentsCard attachments={attachments} onChange={setAttachments} />
        </div>
      </div>
    </div>
  );
};

// One timeline entry — session note or cancellation. Inline-editable.
const TimelineEntry = ({ entry, therapistName, editing, onEdit, onSave, onCancelEdit, onDelete, availableTags = [] }) => {
  const isCancel = entry.type === 'cancellation';
  const [summary, setSummary] = React.useState(entry.summary || '');
  const [tags, setTags] = React.useState(entry.tags || []);
  const toggle = (t) => setTags(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t]);

  if (editing) {
    return (
      <div style={{ display: 'flex', gap: 16, paddingBottom: 24, position: 'relative' }}>
        <div className="tl-dot"><Icon name="edit" size={13} /></div>
        <div style={{ flex: 1, paddingTop: 2 }}>
          <textarea className="note-edit-area" value={summary} onChange={e => setSummary(e.target.value)} rows={3} placeholder="خلاصهٔ جلسه..." autoFocus />
          <TagChooser availableTags={availableTags} selected={tags} onToggle={toggle} />
          <div className="row gap-8" style={{ marginTop: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={onCancelEdit}>انصراف</button>
            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => onSave({ summary, tags })}>ذخیره</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 16, paddingBottom: 24, position: 'relative' }} className="tl-entry">
      <div className={`tl-dot ${isCancel ? 'cancel' : ''}`}>
        <Icon name={isCancel ? 'close' : 'note'} size={14} />
      </div>
      <div style={{ flex: 1, paddingTop: 4 }}>
        <div className="row between">
          <div className="row gap-8" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{entry.date} • {entry.time}</span>
            {isCancel && <span className="tag" style={{ background: 'oklch(0.93 0.04 25)', color: '#8b5050' }}>لغو شد</span>}
          </div>
          <div className="row gap-4" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{therapistName}</span>
            <button className="icon-btn tl-action" style={{ width: 24, height: 24 }} onClick={onEdit} title="ویرایش"><Icon name="edit" size={12} /></button>
            <button className="icon-btn tl-action" style={{ width: 24, height: 24 }} onClick={onDelete} title="حذف"><Icon name="close" size={12} /></button>
          </div>
        </div>
        {isCancel ? (
          <div style={{ fontSize: 12.5, color: '#8b5050', marginTop: 8, lineHeight: 1.7, background: 'oklch(0.96 0.02 25)', padding: '8px 12px', borderRadius: 8 }}>
            <span style={{ fontWeight: 600 }}>دلیل لغو: </span>{entry.reason || 'ثبت نشده'}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 8, lineHeight: 1.7 }}>{entry.summary}</div>
        )}
        {!isCancel && entry.tags && entry.tags.length > 0 && (
          <div className="row gap-4" style={{ marginTop: 10, flexWrap: 'wrap' }}>
            {entry.tags.map(t => <span key={t} className="tag" style={{ background: 'var(--bg-soft)', color: 'var(--ink-soft)' }}>{t}</span>)}
          </div>
        )}
      </div>
    </div>
  );
};

const TagChooser = ({ availableTags = [], selected = [], onToggle, minimal = false }) => {
  if (!availableTags.length) return null;
  return (
    <div className="row gap-8" style={{ flexWrap: 'wrap', marginTop: 8 }}>
      {availableTags.map(t => (
        <button
          key={t}
          type="button"
          className={`tag-choice ${minimal ? 'sm' : ''} ${selected.includes(t) ? 'on' : ''}`}
          onClick={() => onToggle(t)}>
          {selected.includes(t) && <Icon name="check" size={10} />}
          {t}
        </button>
      ))}
    </div>
  );
};

const EntryComposer = ({ onSave, onCancel, availableTags = [] }) => {
  const [summary, setSummary] = React.useState('');
  const [tags, setTags] = React.useState([]);
  const toggle = (t) => setTags(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t]);
  return (
    <div className="tl-composer">
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>یادداشت جلسهٔ جدید</div>
      <textarea className="note-edit-area" value={summary} onChange={e => setSummary(e.target.value)} rows={3} placeholder="چه اتفاقی در جلسه افتاد؟ تمرین‌ها، مشاهدات..." autoFocus />
      <TagChooser availableTags={availableTags} selected={tags} onToggle={toggle} minimal />
      <div className="row gap-8" style={{ marginTop: 10, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={onCancel}>انصراف</button>
        <button className="btn btn-primary" disabled={!summary.trim()} style={{ padding: '6px 12px', fontSize: 12, opacity: summary.trim() ? 1 : 0.5 }} onClick={() => summary.trim() && onSave({ summary: summary.trim(), tags })}>ثبت در تایم‌لاین</button>
      </div>
    </div>
  );
};

const AttachmentsCard = ({ attachments, onChange }) => {
  const inputRef = React.useRef(null);
  const fmtSize = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return toFa(bytes) + ' B';
    if (bytes < 1024 * 1024) return toFa(Math.round(bytes / 1024)) + ' KB';
    return toFa((bytes / (1024 * 1024)).toFixed(1)) + ' MB';
  };
  const onPick = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    onChange([...attachments, ...files.map(f => ({ id: 'f' + Date.now() + Math.random().toString(36).slice(2, 6), name: f.name, size: f.size }))]);
    e.target.value = '';
  };
  const remove = (id) => onChange(attachments.filter(a => a.id !== id));
  return (
    <div className="card">
      <div className="row between" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>فایل‌های پیوست</div>
        <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => inputRef.current?.click()} title="افزودن فایل">
          <Icon name="plus" size={14} />
        </button>
      </div>
      <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={onPick} />
      {attachments.length === 0 ? (
        <button className="attach-drop" onClick={() => inputRef.current?.click()}>
          <Icon name="note" size={18} />
          <span>افزودن گزارش، آزمون یا تصویر</span>
        </button>
      ) : (
        <div className="col gap-8">
          {attachments.map(a => (
            <div key={a.id} className="attach-row">
              <div className="attach-icon"><Icon name="note" size={14} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                {a.size != null && <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{fmtSize(a.size)}</div>}
              </div>
              <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => remove(a.id)} title="حذف"><Icon name="close" size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value, last }) => (
  <div className="row between" style={{
    padding: '10px 0',
    borderBottom: last ? 'none' : '1px solid var(--line-soft)',
    fontSize: 12,
  }}>
    <span style={{ color: 'var(--ink-muted)' }}>{label}</span>
    <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{value}</span>
  </div>
);

Object.assign(window, { PatientsPage, PatientProfilePage });
