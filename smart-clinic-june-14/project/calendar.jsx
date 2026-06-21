// Calendar with drag & drop — private practice (single therapist)
const CalendarPage = ({ events, onEventsChange, onBookSession, onEditEvent, settings = {} }) => {
  const workStart = settings.workStart != null ? settings.workStart : 9;
  const workEnd   = settings.workEnd   != null ? settings.workEnd   : 18;
  const blocked   = settings.blockedSlots || [];
  const hours = Array.from({ length: workEnd - workStart }, (_, i) => workStart + i);
  const D = window.CLINIC_DATA;
  const [view, setView] = React.useState('week');
  const [weekOffset, setWeekOffset] = React.useState(0); // weeks from current
  const [dayOffset, setDayOffset] = React.useState(0);   // days from today
  const [monthOffset, setMonthOffset] = React.useState(0);
  const [draggedId, setDraggedId] = React.useState(null);
  const [dropTarget, setDropTarget] = React.useState(null);

  // Persian month names
  const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  // Live anchor: today's real Jalali date (year / month / day / weekday).
  const jToday = window.JALALI_TODAY;
  const todayDayOfWeek = jToday.dow; // 0 = Saturday

  // Jalali info for a day N days from real today — computed from the real
  // Date so month boundaries, leap years and weekdays are always correct.
  const dayInfoFor = (offsetDays) => {
    const j = window.jalaliFromOffset(offsetDays);
    return { day: j.day, monthIdx: j.monthIdx, year: j.year, monthName: persianMonths[j.monthIdx], dow: j.dow };
  };

  // Build week (7 days starting Saturday)
  const weekStartOffset = weekOffset * 7 - todayDayOfWeek;
  const weekDays = D.weekDays.map((label, i) => {
    const info = dayInfoFor(weekStartOffset + i);
    return { ...info, label, isToday: weekStartOffset + i === 0 };
  });

  const weekHeaderLabel = () => {
    const first = weekDays[0];
    const last = weekDays[6];
    if (first.monthIdx === last.monthIdx) {
      return `${toFa(first.day)} – ${toFa(last.day)} ${first.monthName} ${toFa(first.year)}`;
    }
    return `${toFa(first.day)} ${first.monthName} – ${toFa(last.day)} ${last.monthName} ${toFa(last.year)}`;
  };

  const dayInfo = dayInfoFor(dayOffset);
  const dayHeaderLabel = () => `${D.weekDays[dayInfo.dow]}، ${toFa(dayInfo.day)} ${dayInfo.monthName} ${toFa(dayInfo.year)}`;

  // For week view, events keyed by day-of-week (we keep mock events on Sat..Thu)
  const eventsForDayOfWeek = (dow) => events.filter(ev => ev.day === dow);

  const handleDragStart = (id) => setDraggedId(id);
  const handleDragEnd = () => { setDraggedId(null); setDropTarget(null); };
  const handleDragOver = (e, day, hour) => { e.preventDefault(); setDropTarget({ day, hour }); };
  const handleDrop = (day, hour) => {
    if (draggedId == null) return;
    onEventsChange(events.map(ev => ev.id === draggedId ? { ...ev, day, startHour: hour } : ev));
    handleDragEnd();
  };

  const goPrev = () => {
    if (view === 'week') setWeekOffset(weekOffset - 1);
    else if (view === 'day') setDayOffset(dayOffset - 1);
    else setMonthOffset(monthOffset - 1);
  };
  const goNext = () => {
    if (view === 'week') setWeekOffset(weekOffset + 1);
    else if (view === 'day') setDayOffset(dayOffset + 1);
    else setMonthOffset(monthOffset + 1);
  };
  const goToday = () => { setWeekOffset(0); setDayOffset(0); setMonthOffset(0); };

  // Header label switches by view
  const headerLabel = () => {
    if (view === 'day') return dayHeaderLabel();
    if (view === 'week') return weekHeaderLabel();
    // month
    let total = jToday.monthIdx + monthOffset;
    let year = jToday.year;
    while (total >= 12) { total -= 12; year++; }
    while (total < 0) { total += 12; year--; }
    return `${persianMonths[total]} ${toFa(year)}`;
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">تقویم جلسات</h1>
          <div className="page-sub">{headerLabel()}</div>
        </div>
        <div className="row gap-8">
          <div className="row gap-4" style={{ background: 'var(--bg-soft)', borderRadius: 10, padding: 3 }}>
            {[
              { id: 'day', label: 'روز' },
              { id: 'week', label: 'هفته' },
              { id: 'month', label: 'ماه' },
            ].map(v => (
              <button key={v.id}
                style={{ padding: '6px 14px', fontSize: 12, fontWeight: 500, borderRadius: 8,
                  background: view === v.id ? 'var(--ink)' : 'transparent',
                  color: view === v.id ? 'var(--bg-elevated)' : 'var(--ink-soft)' }}
                onClick={() => setView(v.id)}>
                {v.label}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost" style={{ padding: 10 }} onClick={goPrev}><Icon name="chevronRight" size={14} /></button>
          <button className="btn btn-soft" style={{ fontSize: 12, padding: '8px 14px' }} onClick={goToday}>امروز</button>
          <button className="btn btn-ghost" style={{ padding: 10 }} onClick={goNext}><Icon name="chevronLeft" size={14} /></button>
          <button className="btn btn-primary" onClick={() => onBookSession()}>
            <Icon name="plus" size={14} />
            رزرو جلسه
          </button>
        </div>
      </div>

      {/* Mode legend (no therapist colors) */}
      <div className="row gap-16" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="row gap-8" style={{ fontSize: 12 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--sky-soft)', border: '1px solid #3d6680' }}></span>
          <span style={{ color: 'var(--ink-soft)' }}>○ حضوری</span>
        </div>
        <div className="row gap-8" style={{ fontSize: 12 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--lavender-soft)', border: '1px solid #6a5a85' }}></span>
          <span style={{ color: 'var(--ink-soft)' }}>⊙ آنلاین</span>
        </div>
      </div>

      {/* === WEEK VIEW === */}
      {view === 'week' && (
        <div className="calendar-grid">
          <div className="cal-header-cell" style={{ borderLeft: '1px solid var(--line-soft)' }}></div>
          {weekDays.map((d, i) => (
            <div key={i} className={`cal-header-cell ${d.isToday ? 'today' : ''}`}>
              <div>{d.label}</div>
              <div className="date-num">{toFa(d.day)}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-muted)', marginTop: 2 }}>{d.monthName}</div>
            </div>
          ))}

          <div>
            {hours.map(h => (
              <div key={h} className="cal-time-cell" style={{ height: 60 }}>{toFa(h)}:۰۰</div>
            ))}
          </div>

          {weekDays.map((d, dayIdx) => (
            <div key={dayIdx} className="cal-day-col">
              {hours.map(h => {
                const dKey = window.jKey(d.year, d.monthIdx, d.day);
                const isBl = blocked.some(b => (b.dateKey ? b.dateKey === dKey : b.dow === d.dow) && b.hour === h);
                return (
                  <div key={h}
                    className={`cal-hour${isBl ? ' cal-blocked' : ''} ${dropTarget?.day === d.dow && dropTarget?.hour === h ? 'cal-drop-target' : ''}`}
                    onDragOver={!isBl ? (e) => handleDragOver(e, d.dow, h) : undefined}
                    onDrop={!isBl ? () => handleDrop(d.dow, h) : undefined}
                    onClick={!isBl ? () => onBookSession({ day: d.dow, hour: h }) : undefined}
                  >{isBl ? <span className="cal-blocked-label">بسته</span> : ''}</div>
                );
              })}
              {weekOffset === 0 && eventsForDayOfWeek(d.dow).filter(ev => ev.startHour >= workStart && ev.startHour < workEnd).map(ev => {
                const p = getPatient(ev.patientId);
                const evName = ev.name || (p ? `${p.firstName} ${p.lastName}` : '');
                const top = (ev.startHour - workStart) * 60 + 2;
                const height = ev.duration * 60 - 4;
                const isOnline = ev.mode === 'online';
                return (
                  <React.Fragment key={ev.id}>
                    <div draggable
                      onDragStart={() => handleDragStart(ev.id)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => { e.stopPropagation(); onEditEvent && onEditEvent(ev); }}
                      className={`cal-event ${draggedId === ev.id ? 'dragging' : ''}`}
                      style={{
                        top, height, cursor: 'pointer',
                        background: isOnline ? 'var(--lavender-soft)' : 'var(--sky-soft)',
                        borderRightWidth: 3, borderRightStyle: 'solid',
                        borderRightColor: isOnline ? '#6a5a85' : '#3d6680',
                      }}>
                      <div className="ev-name">{evName}{ev.fromBooking ? ' • جدید' : ''}</div>
                      <div className="ev-meta">{toFa(ev.startHour)}:۰۰ • {isOnline ? '⊙ آنلاین' : '○ حضوری'}</div>
                    </div>
                    {ev.buffer > 0 && (
                      <div className="cal-buffer" style={{ top: top + height + 2, height: ev.buffer - 2 }} title={`فاصله ${toFa(ev.buffer)} دقیقه`}></div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* === DAY VIEW === */}
      {view === 'day' && (
        <div className="calendar-grid" style={{ gridTemplateColumns: '64px 1fr' }}>
          <div className="cal-header-cell" style={{ borderLeft: '1px solid var(--line-soft)' }}></div>
          <div className={`cal-header-cell ${dayOffset === 0 ? 'today' : ''}`}>
            <div>{D.weekDays[dayInfo.dow]}</div>
            <div className="date-num">{toFa(dayInfo.day)}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-muted)', marginTop: 2 }}>{dayInfo.monthName}</div>
          </div>

          <div>
            {hours.map(h => (
              <div key={h} className="cal-time-cell" style={{ height: 60 }}>{toFa(h)}:۰۰</div>
            ))}
          </div>

          <div className="cal-day-col">
            {hours.map(h => {
              const dKey = window.jKey(dayInfo.year, dayInfo.monthIdx, dayInfo.day);
              const isBl = blocked.some(b => (b.dateKey ? b.dateKey === dKey : b.dow === dayInfo.dow) && b.hour === h);
              return (
                <div key={h}
                  className={`cal-hour${isBl ? ' cal-blocked' : ''} ${dropTarget?.day === dayInfo.dow && dropTarget?.hour === h ? 'cal-drop-target' : ''}`}
                  onDragOver={!isBl ? (e) => handleDragOver(e, dayInfo.dow, h) : undefined}
                  onDrop={!isBl ? () => handleDrop(dayInfo.dow, h) : undefined}
                  onClick={!isBl ? () => onBookSession({ day: dayInfo.dow, hour: h }) : undefined}
                >{isBl ? <span className="cal-blocked-label">بسته</span> : ''}</div>
              );
            })}
            {dayOffset === 0 && eventsForDayOfWeek(dayInfo.dow).filter(ev => ev.startHour >= workStart && ev.startHour < workEnd).map(ev => {
              const p = getPatient(ev.patientId);
              const evName = ev.name || (p ? `${p.firstName} ${p.lastName}` : '');
              const top = (ev.startHour - workStart) * 60 + 2;
              const height = ev.duration * 60 - 4;
              const isOnline = ev.mode === 'online';
              return (
                <React.Fragment key={ev.id}>
                  <div draggable
                    onDragStart={() => handleDragStart(ev.id)}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => { e.stopPropagation(); onEditEvent && onEditEvent(ev); }}
                    className={`cal-event ${draggedId === ev.id ? 'dragging' : ''}`}
                    style={{
                      top, height, right: 8, left: 8, cursor: 'pointer',
                      background: isOnline ? 'var(--lavender-soft)' : 'var(--sky-soft)',
                      borderRightWidth: 3, borderRightStyle: 'solid',
                      borderRightColor: isOnline ? '#6a5a85' : '#3d6680',
                      padding: '10px 14px',
                    }}>
                    <div className="ev-name" style={{ fontSize: 13 }}>{evName}{ev.fromBooking ? ' • جدید' : ''}</div>
                    <div className="ev-meta" style={{ fontSize: 11 }}>{toFa(ev.startHour)}:۰۰ • {isOnline ? '⊙ آنلاین' : '○ حضوری'} • {ev.fromBooking ? 'رزرو جدید' : (p?.tags?.[0] || '')}</div>
                  </div>
                  {ev.buffer > 0 && (
                    <div className="cal-buffer" style={{ top: top + height + 2, height: ev.buffer - 2, right: 8, left: 8 }} title={`فاصله ${toFa(ev.buffer)} دقیقه`}></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* === MONTH VIEW === */}
      {view === 'month' && (
        <MonthGrid monthOffset={monthOffset} events={events} onCellClick={(dow, h) => onBookSession({ day: dow, hour: h })} />
      )}

      <div style={{ fontSize: 11, color: 'var(--ink-muted)', textAlign: 'center', marginTop: 16 }}>
        💡 برای جابه‌جایی، جلسات را بکشید و رها کنید — برای ویرایش یا حذف، روی هر جلسه کلیک کنید
      </div>
    </div>
  );
};

const MonthGrid = ({ monthOffset, events, onCellClick }) => {
  const D = window.CLINIC_DATA;
  const persianMonths = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  const monthLengths = [31,31,31,31,31,31, 30,30,30,30,30, 29];
  const jToday = window.JALALI_TODAY;
  const baseMonthIdx = jToday.monthIdx;
  const todayDay = jToday.day;

  let mIdx = baseMonthIdx + monthOffset;
  let year = jToday.year;
  while (mIdx >= 12) { mIdx -= 12; year++; }
  while (mIdx < 0) { mIdx += 12; year--; }
  const daysInMonth = monthLengths[mIdx];

  // Weekday of day 1 of today's month — derived live from the real date.
  const baseDow = window.jalaliFromOffset(-(todayDay - 1)).dow;
  // Compute first-day-of-month dow for current view
  let dowShift = 0;
  for (let i = 0; i < Math.abs(monthOffset); i++) {
    const idx = monthOffset > 0
      ? (baseMonthIdx + i) % 12
      : (baseMonthIdx - 1 - i + 12) % 12;
    dowShift += (monthOffset > 0 ? monthLengths[idx] : -monthLengths[idx]);
  }
  const firstDow = ((baseDow + dowShift) % 7 + 7) % 7;

  // Build cells
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (day) => monthOffset === 0 && day === todayDay;

  // Distribute events for visual purposes — map day-of-week events to days of month
  const eventsForDay = (day) => {
    if (!day) return [];
    const cellIdx = firstDow + day - 1;
    const dow = cellIdx % 7;
    return events.filter(ev => ev.day === dow);
  };

  return (
    <div className="month-grid">
      {D.weekDays.map(d => (
        <div key={d} className="month-header-cell">{d}</div>
      ))}
      {cells.map((day, i) => (
        <div key={i} className={`month-cell ${!day ? 'empty' : ''} ${day && isToday(day) ? 'today' : ''}`}
             onClick={() => day && onCellClick(i % 7, 10)}>
          {day && (
            <>
              <div className="month-cell-num">{toFa(day)}</div>
              <div className="month-cell-events">
                {eventsForDay(day).slice(0, 3).map(ev => {
                  const p = getPatient(ev.patientId);
                  const evFirst = ev.name ? ev.name.split(' ')[0] : p?.firstName;
                  const isOnline = ev.mode === 'online';
                  return (
                    <div key={ev.id} className="month-event"
                      style={{
                        background: isOnline ? 'var(--lavender-soft)' : 'var(--sky-soft)',
                        color: isOnline ? '#6a5a85' : '#3d6680',
                      }}>
                      {toFa(ev.startHour)}:۰۰ {evFirst}
                    </div>
                  );
                })}
                {eventsForDay(day).length > 3 && (
                  <div style={{ fontSize: 10, color: 'var(--ink-muted)', padding: '2px 6px' }}>
                    +{toFa(eventsForDay(day).length - 3)} جلسه دیگر
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

Object.assign(window, { CalendarPage });
