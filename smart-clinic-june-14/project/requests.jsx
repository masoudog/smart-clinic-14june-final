// Booking requests page — incoming bookings from public website
const RequestsPage = ({ requests, onAccept, onReject, onAddPatient }) => {
  return (
    <div className="page" style={{ maxWidth: 980 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">درخواست‌های رزرو</h1>
          <div className="page-sub">{toFa(requests.length)} درخواست در انتظار بررسی از وب‌سایت</div>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="card card-lg empty">
          <div className="empty-icon"><Icon name="check" size={24} /></div>
          <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>هیچ درخواست در انتظاری ندارید</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>رزروهای جدید از وب‌سایت اینجا ظاهر می‌شوند.</div>
        </div>
      ) : (
        <div className="col gap-12">
          {requests.map(r => (
            <RequestCard key={r.id} req={r} onAccept={onAccept} onReject={onReject} />
          ))}
        </div>
      )}
    </div>
  );
};

const RequestCard = ({ req, onAccept, onReject }) => {
  const initials = (req.firstName.charAt(0) || '') + (req.lastName.charAt(0) || '');
  const isOnline = req.mode === 'online';
  const fromWeb = req.source === 'online';

  return (
    <div className="card card-lg request-card">
      <div className="row gap-16" style={{ alignItems: 'flex-start' }}>
        <Avatar initials={initials} color={req.color} size="lg" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row between" style={{ marginBottom: 8 }}>
            <div>
              <div className="row gap-8" style={{ alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{req.firstName} {req.lastName}</span>
                <span className="req-pill" style={{
                  background: req.isReturning ? 'var(--sky-soft)' : 'var(--sage-soft)',
                  color: req.isReturning ? '#3d6680' : '#4a6b56',
                }}>
                  {req.isReturning ? 'مراجع قدیمی' : 'مراجع جدید'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4 }}>{req.phone}</div>
            </div>
            <div className="row gap-4" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <span className="req-pill" style={{
                background: fromWeb ? 'var(--lavender-soft)' : 'var(--bg-soft)',
                color: fromWeb ? '#6a5a85' : 'var(--ink-soft)',
              }}>
                <span className="tag-dot" style={{ background: fromWeb ? '#6a5a85' : 'var(--ink-muted)' }}></span>
                {fromWeb ? 'از وب‌سایت' : 'ثبت دفتر'}
              </span>
              {isOnline
                ? <span className="tag tag-online"><span className="tag-dot"></span>آنلاین</span>
                : <span className="tag tag-inperson"><span className="tag-dot"></span>حضوری</span>}
              <span className="tag" style={{ background: 'var(--bg-soft)', color: 'var(--ink-soft)' }}>
                {req.submittedAt}
              </span>
            </div>
          </div>

          <div className="request-time">
            <span className="request-time-item">
              <Icon name="calendar" size={14} />
              <span>{req.dateLabel}</span>
            </span>
            <span className="request-time-sep"></span>
            <span className="request-time-item">
              <Icon name="clock" size={14} />
              <span>{req.time}</span>
            </span>
          </div>

          {req.reason && (
            <div className="request-reason">
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 4 }}>دلیل مراجعه:</div>
              <div>«{req.reason}»</div>
            </div>
          )}

          <div className="row gap-8" style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={() => onAccept(req)}>
              <Icon name="check" size={14} />
              تایید درخواست
            </button>
            <button className="btn btn-ghost" onClick={() => onReject(req)}>
              <Icon name="close" size={14} />
              رد درخواست
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { RequestsPage });
