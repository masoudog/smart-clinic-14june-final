// Pouria Psychotherapy Clinic — public marketing site, recreated from the Figma.
// Full scrolling page: glass nav · hero + office hours · services · about the
// doctor · contact · footer. Online booking opens the stepped reservation
// wizard (BookingWizard). A discreet staff entry routes into the CRM.

const CLINIC_PHONE = '۰۴۱۳–۳۵۰۵۸۰۰۸';

const LandingPage = ({ onLogin, onBookingSubmit, settings = {}, slots = [], events = [] }) => {
  const bookingOpen = settings.onlineBookingEnabled !== false;
  const [wizard, setWizard] = React.useState(null);   // null | { service }
  const [closedOpen, setClosedOpen] = React.useState(false);
  const [urgentOpen, setUrgentOpen] = React.useState(false);

  const openBooking = (service = null) => {
    if (!bookingOpen) { setClosedOpen(true); return; }
    setWizard({ service });
  };

  // staff entry — Alt + L, undocumented
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && (e.key === 'l' || e.key === 'L')) { e.preventDefault(); onLogin?.(); }
      if (e.key === 'Escape') { setWizard(null); setClosedOpen(false); setUrgentOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onLogin]);

  const handleSubmit = (payload) => { onBookingSubmit?.(payload); };

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 72, behavior: 'smooth' });
  };

  return (
    <div className="site">
      {/* ===== NAV ===== */}
      <header className="site-nav">
        <div className="site-nav-inner">
          <a className="site-logo" href="#home" onClick={scrollTo('home')}>
            <span className="dot"></span>
            کلینیک پوریا
          </a>
          <nav className="site-links">
            <a href="#home" onClick={scrollTo('home')}>خانه</a>
            <a href="#services" onClick={scrollTo('services')}>خدمات</a>
            <a href="#contact" onClick={scrollTo('contact')}>تماس با ما</a>
          </nav>
          <div className="site-nav-actions">
            <a className="site-phone" href={`tel:0413355058008`}>
              <Icon name="phone" size={18} />
              <span>{CLINIC_PHONE}</span>
            </a>
            <button className="site-btn primary" onClick={() => setUrgentOpen(true)}>ثبت نیاز فوری</button>
          </div>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="site-hero" id="home">
        <div className="site-hero-bg" style={{ backgroundImage: 'url(assets/hero.jpg)' }}></div>
        <div className="site-hero-scrim"></div>
        <div className="site-hero-inner">
          <div className="site-hero-text">
            <h1>آرامش روان شما، اولویت ماست</h1>
            <p>
              ارائهٔ تخصصی‌ترین خدمات روان‌شناسی در فضایی آرام و حرفه‌ای،
              با بهره‌گیری از دانش روز دنیا برای بهبود کیفیت زندگی شما.
            </p>
            <div className="site-hours">
              <div className="site-hours-head">
                <Icon name="clock" size={16} />
                <span>ساعات پذیرش</span>
              </div>
              <div className="site-hours-row">
                <span className="d">شنبه تا چهارشنبه</span>
                <span className="t">۱۰:۰۰ – ۱۷:۰۰</span>
              </div>
              <div className="site-hours-row">
                <span className="d">پنج‌شنبه</span>
                <span className="t">۱۰:۰۰ – ۱۳:۰۰</span>
              </div>
            </div>
          </div>
          <div className="site-hero-booking">
            {bookingOpen ? (
              <BookingWizard
                embed
                events={events}
                settings={settings}
                onSubmit={handleSubmit}
              />
            ) : (
              <div className="bw-card embed closed">
                <div className="bw-head"><h2>رزرو آنلاین نوبت</h2><p>اولین قدم به سوی سلامت روان</p></div>
                <div className="site-closed-msg"
                     dangerouslySetInnerHTML={{ __html: settings.closedMessage || 'در حال حاضر رزرو آنلاین از وب‌سایت امکان‌پذیر نمی‌باشد. لطفاً با دفتر تماس بگیرید.' }} />
                <a className="bw-btn primary full" href={`tel:0413355058008`}>
                  <Icon name="phone" size={18} /><span>تماس با دفتر — {CLINIC_PHONE}</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== ABOUT THE DOCTOR ===== */}
      <section className="site-about" id="about">
        <div className="site-about-ellipses" aria-hidden="true">
          <span className="ring-cluster about-tr">
            <span className="r rc-1"></span>
            <span className="r rc-2"></span>
            <span className="r rc-3"></span>
            <span className="r rc-4"></span>
            <span className="r rc-5"></span>
          </span>
        </div>
        <div className="site-about-inner">
          <h2>دکتر محمد مهدی اسماعیل‌زاده پوریا</h2>
          <div className="site-about-role">دکترای تخصصی روان‌درمانی و روان‌شناس سلامت</div>
          <p>
            دکتر محمد مهدی اسماعیل‌زاده پوریا با بیش از ۱۵ سال تجربه در حوزهٔ روان‌پزشکی بالینی،
            با رویکردی انسانی، علمی و به‌روز، در خدمت بیماران خود است. تخصص ایشان در درمان
            اختلالات اضطرابی، افسردگی، اختلال دوقطبی و روان‌پزشکی کودک و نوجوان می‌باشد.
          </p>
          <ul className="site-badges">
            {['ساب‌تخصص آنکولوژی، روان‌درمانگر سرطان', 'مشاور فردی', 'عضو انجمن روان‌پزشکی ایران'].map((b, i) => (
              <li key={i}>
                <span className="chk"><Icon name="check" size={14} /></span>
                <span className="badge-text">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <section className="site-services" id="services">
        <div className="site-services-rings" aria-hidden="true">
          <span className="ring-cluster services-left">
            <span className="r rc-2"></span>
            <span className="r rc-3"></span>
            <span className="r rc-4"></span>
            <span className="r rc-5"></span>
          </span>
        </div>
        <div className="site-services-head">
          <h2>خدمات تخصصی کلینیک روان درمانی پوریا</h2>
          <p>با بهره‌گیری از آخرین دستاوردهای علمی در روان‌پزشکی، خدمات جامع و متنوعی را به شما ارائه می‌دهیم.</p>
        </div>
        <div className="site-services-grid">
          {SERVICE_CARDS.map((s) => (
            <button key={s.id} className="site-service" onClick={() => openBooking(s.id)}>
              <span className="ico" style={{ color: s.tint }}><Icon name={s.icon} size={22} /></span>
              <h3>{s.label}</h3>
              <p>{s.desc}</p>
              <span className="site-service-cta">رزرو نوبت<Icon name="arrowLeft" size={16} /></span>
            </button>
          ))}
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section className="site-contact" id="contact">
        <div className="site-contact-bg" style={{ backgroundImage: 'url(assets/hero.jpg)' }}></div>
        <div className="site-contact-scrim"></div>
        <div className="site-contact-inner">
          <div className="site-contact-head">
            <h2>در تماس باشید</h2>
            <p>برای کسب اطلاعات بیشتر با ما در ارتباط باشید.</p>
          </div>
          <div className="site-contact-card">
            <div className="site-contact-item">
              <span className="ico"><Icon name="pin" size={20} /></span>
              <div className="lbl">آدرس کلینیک</div>
              <div className="val">تبریز - خیابان ارتش جنوبی - ساختمان ماهان</div>
            </div>
            <div className="site-contact-divider"></div>
            <div className="site-contact-item">
              <span className="ico"><Icon name="phone" size={20} /></span>
              <div className="lbl">شماره تماس</div>
              <div className="val ltr">{CLINIC_PHONE}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-row">
            <div className="site-footer-social">
              <a href="#" aria-label="اینستاگرام"><Icon name="instagram" size={20} /></a>
              <a href="#" aria-label="لینکدین"><Icon name="linkedin" size={20} /></a>
            </div>
            <nav className="site-footer-links">
              <a href="#contact" onClick={scrollTo('contact')}>تماس با ما</a>
              <a href="#services" onClick={scrollTo('services')}>خدمات</a>
              <a href="#home" onClick={scrollTo('home')}>خانه</a>
            </nav>
            <a className="site-logo small" href="#home" onClick={scrollTo('home')}>
              <span className="dot"></span>
              کلینیک پوریا
            </a>
          </div>
          <div className="site-footer-divider"></div>
          <div className="site-footer-credits">
            <span className="site-copy">تمام حقوق وبسایت کلینیک روان درمانی پوریا محفوظ است.</span>
            <button className="site-staff" onClick={onLogin} title="ورود کارکنان (Alt + L)">ورود کارکنان</button>
          </div>
        </div>
      </footer>

      {/* ===== BOOKING WIZARD ===== */}
      {wizard && (
        <BookingWizard
          events={events}
          settings={settings}
          initialService={wizard.service}
          onClose={() => setWizard(null)}
          onSubmit={handleSubmit}
        />
      )}

      {/* ===== URGENT-NEED MODAL ===== */}
      {urgentOpen && (
        <UrgentModal
          phone={CLINIC_PHONE}
          onClose={() => setUrgentOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      {/* ===== CLOSED-BOOKING NOTICE ===== */}
      {closedOpen && (
        <div className="bw-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setClosedOpen(false); }}>
          <div className="bw-card closed" role="dialog" aria-modal="true">
            <button className="bw-close" onClick={() => setClosedOpen(false)} aria-label="بستن"><Icon name="close" size={18} /></button>
            <div className="bw-head"><h2>رزرو آنلاین</h2></div>
            <div className="site-closed-msg"
                 dangerouslySetInnerHTML={{ __html: settings.closedMessage || 'در حال حاضر رزرو آنلاین از وب‌سایت امکان‌پذیر نمی‌باشد. لطفاً با دفتر تماس بگیرید.' }} />
            <a className="bw-btn primary full" href={`tel:0413355058008`}>
              <Icon name="phone" size={18} /><span>تماس با دفتر — {CLINIC_PHONE}</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

const SERVICE_CARDS = [
  { id: 'adult', label: 'روانشناسی بزرگسال', icon: 'brain', tint: '#3A404A',
    desc: 'تشخیص و درمان اختلالات روان‌پزشکی شامل افسردگی، اضطراب، اختلال دوقطبی و اسکیزوفرنی با رویکرد جدیدترین پروتکل‌های درمانی.' },
  { id: 'child', label: 'روانشناسی کودک و نوجوان', icon: 'users', tint: '#3A404A',
    desc: 'ارزیابی و درمان اختلالات توجه (ADHD)، اوتیسم، اضطراب و افسردگی در کودکان و نوجوانان با رویکرد خانواده‌محور.' },
  { id: 'anxiety', label: 'اختلالات اضطرابی', icon: 'zap', tint: '#8951E0',
    desc: 'درمان انواع اختلالات اضطرابی از جمله اختلال وسواسی (OCD)، فوبی اجتماعی، اضطراب فراگیر و حملات پانیک.' },
  { id: 'sleep', label: 'اختلالات خواب', icon: 'moon', tint: '#E06161',
    desc: 'بررسی و درمان بی‌خوابی، پرخوابی، کابوس‌های شبانه و سایر اختلالات خواب با روش‌های دارویی و رفتاری.' },
];

Object.assign(window, { LandingPage });

/* ---------- Staff login (restyled to the new system) ---------- */

const LoginScreen = ({ onSuccess, onCancel }) => {
  const [user, setUser] = React.useState('');
  const [pass, setPass] = React.useState('');
  const [error, setError] = React.useState('');

  const submit = (e) => {
    e && e.preventDefault();
    if (!user.trim() || !pass.trim()) { setError('نام کاربری و گذرواژه را وارد کنید.'); return; }
    onSuccess?.();
  };

  return (
    <div className="site-login">
      <div className="site-login-bg" style={{ backgroundImage: 'url(assets/hero.jpg)' }}></div>
      <div className="site-login-scrim"></div>

      <button className="site-login-back" onClick={onCancel}>
        <Icon name="arrowRight" size={16} />
        بازگشت به صفحه اصلی
      </button>

      <form className="site-login-card" onSubmit={submit}>
        <div className="site-login-clinic">
          <span className="dot"></span>
          کلینیک روان درمانی پوریا
        </div>
        <h2 className="site-login-title">ورود کارکنان</h2>
        <p className="site-login-sub">برای دسترسی به داشبورد مدیریت وارد شوید.</p>

        <div className="site-login-field">
          <label>نام کاربری</label>
          <input autoFocus placeholder="admin" value={user}
                 onChange={(e) => { setUser(e.target.value); setError(''); }} />
        </div>
        <div className="site-login-field">
          <label>گذرواژه</label>
          <input type="password" placeholder="••••••" value={pass}
                 onChange={(e) => { setPass(e.target.value); setError(''); }} />
        </div>

        {error && <div className="site-login-error">{error}</div>}

        <button type="submit" className="bw-btn primary full">ورود به داشبورد</button>
      </form>
    </div>
  );
};

Object.assign(window, { LandingPage, LoginScreen });
