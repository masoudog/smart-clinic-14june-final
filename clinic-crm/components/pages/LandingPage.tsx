'use client';

import React, { useState, useEffect } from 'react';
import '@/app/landing.css';
import BookingWizard from '@/components/BookingWizard';

const CLINIC_PHONE = '۰۴۱۳–۳۵۰۵۸۰۰۸';

const SERVICE_CARDS = [
  { id: 'adult',   label: 'روانشناسی بزرگسال',       icon: '🧠', tint: '#3A404A', desc: 'تشخیص و درمان اختلالات روان‌پزشکی شامل افسردگی، اضطراب، اختلال دوقطبی و اسکیزوفرنی با رویکرد جدیدترین پروتکل‌های درمانی.' },
  { id: 'child',   label: 'روانشناسی کودک و نوجوان', icon: '👥', tint: '#3A404A', desc: 'ارزیابی و درمان اختلالات توجه (ADHD)، اوتیسم، اضطراب و افسردگی در کودکان و نوجوانان با رویکرد خانواده‌محور.' },
  { id: 'anxiety', label: 'اختلالات اضطرابی',         icon: '⚡', tint: '#8951E0', desc: 'درمان انواع اختلالات اضطرابی از جمله اختلال وسواسی (OCD)، فوبی اجتماعی، اضطراب فراگیر و حملات پانیک.' },
  { id: 'sleep',   label: 'اختلالات خواب',            icon: '🌙', tint: '#E06161', desc: 'بررسی و درمان بی‌خوابی، پرخوابی، کابوس‌های شبانه و سایر اختلالات خواب با روش‌های دارویی و رفتاری.' },
];

interface LandingPageProps {
  onLogin?: () => void;
  onBookingSubmit?: (payload: any) => void;
}

export default function LandingPage({ onLogin, onBookingSubmit }: LandingPageProps) {
  const [wizard, setWizard] = useState<{ service: string | null } | null>(null);
  const [urgentOpen, setUrgentOpen] = useState(false);
  const [urgentName, setUrgentName] = useState('');
  const [urgentPhone, setUrgentPhone] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'l' || e.key === 'L')) { e.preventDefault(); onLogin?.(); }
      if (e.key === 'Escape') { setWizard(null); setUrgentOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onLogin]);

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 72, behavior: 'smooth' });
  };

  const handleBookingSubmit = (payload: any) => {
    onBookingSubmit?.(payload);
    setWizard(null);
  };

  const submitUrgent = () => {
    if (!urgentName.trim() || !urgentPhone.trim()) return;
    onBookingSubmit?.({ kind: 'urgent', name: urgentName.trim(), phone: urgentPhone.trim(), reason: 'urgent', mode: 'in-person' });
    setUrgentOpen(false);
    setUrgentName(''); setUrgentPhone('');
  };

  return (
    <div className="site" dir="rtl">
      {/* NAV */}
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
            <a className="site-phone" href="tel:0413355058008">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 013 1.18 2 2 0 015 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L9.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14z"/></svg>
              <span>{CLINIC_PHONE}</span>
            </a>
            <button className="site-btn primary" onClick={() => setUrgentOpen(true)}>ثبت نیاز فوری</button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="site-hero" id="home">
        <div className="site-hero-bg"></div>
        <div className="site-hero-scrim"></div>
        <div className="site-hero-inner">
          <div className="site-hero-text">
            <h1>آرامش روان شما، اولویت ماست</h1>
            <p>ارائهٔ تخصصی‌ترین خدمات روان‌شناسی در فضایی آرام و حرفه‌ای، با بهره‌گیری از دانش روز دنیا برای بهبود کیفیت زندگی شما.</p>
            <div className="site-hours">
              <div className="site-hours-head">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>ساعات پذیرش</span>
              </div>
              <div className="site-hours-row"><span className="d">شنبه تا چهارشنبه</span><span className="t">۱۰:۰۰ – ۱۷:۰۰</span></div>
              <div className="site-hours-row"><span className="d">پنج‌شنبه</span><span className="t">۱۰:۰۰ – ۱۳:۰۰</span></div>
            </div>
          </div>
          <div className="site-hero-booking">
            <BookingWizard embed onSubmit={handleBookingSubmit} />
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="site-about" id="about">
        <div className="site-about-ellipses" aria-hidden="true">
          <span className="ring-cluster about-tr">
            <span className="r"></span><span className="r"></span><span className="r"></span><span className="r"></span><span className="r"></span>
          </span>
        </div>
        <div className="site-about-inner">
          <h2>دکتر محمد مهدی اسماعیل‌زاده پوریا</h2>
          <div className="site-about-role">دکترای تخصصی روان‌درمانی و روان‌شناس سلامت</div>
          <p>دکتر محمد مهدی اسماعیل‌زاده پوریا با بیش از ۱۵ سال تجربه در حوزهٔ روان‌پزشکی بالینی، با رویکردی انسانی، علمی و به‌روز، در خدمت بیماران خود است. تخصص ایشان در درمان اختلالات اضطرابی، افسردگی، اختلال دوقطبی و روان‌پزشکی کودک و نوجوان می‌باشد.</p>
          <ul className="site-badges">
            {['ساب‌تخصص آنکولوژی، روان‌درمانگر سرطان', 'مشاور فردی', 'عضو انجمن روان‌پزشکی ایران'].map((b, i) => (
              <li key={i}>
                <span className="chk">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                </span>
                <span className="badge-text">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* SERVICES */}
      <section className="site-services" id="services">
        <div className="site-services-rings" aria-hidden="true">
          <span className="ring-cluster services-left">
            <span className="r"></span><span className="r"></span><span className="r"></span><span className="r"></span>
          </span>
        </div>
        <div className="site-services-head">
          <h2>خدمات تخصصی کلینیک روان درمانی پوریا</h2>
          <p>با بهره‌گیری از آخرین دستاوردهای علمی در روان‌پزشکی، خدمات جامع و متنوعی را به شما ارائه می‌دهیم.</p>
        </div>
        <div className="site-services-grid">
          {SERVICE_CARDS.map((s) => (
            <button key={s.id} className="site-service" onClick={() => setWizard({ service: s.id })}>
              <span className="ico" style={{ color: s.tint }}>{s.icon}</span>
              <h3>{s.label}</h3>
              <p>{s.desc}</p>
              <span className="site-service-cta">
                رزرو نوبت
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section className="site-contact" id="contact">
        <div className="site-contact-bg"></div>
        <div className="site-contact-scrim"></div>
        <div className="site-contact-inner">
          <div className="site-contact-head">
            <h2>در تماس باشید</h2>
            <p>برای کسب اطلاعات بیشتر با ما در ارتباط باشید.</p>
          </div>
          <div className="site-contact-card">
            <div className="site-contact-item">
              <span className="ico">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </span>
              <div className="lbl">آدرس کلینیک</div>
              <div className="val">تبریز - خیابان ارتش جنوبی - ساختمان ماهان</div>
            </div>
            <div className="site-contact-divider"></div>
            <div className="site-contact-item">
              <span className="ico">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 013 1.18 2 2 0 015 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L9.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14z"/></svg>
              </span>
              <div className="lbl">شماره تماس</div>
              <div className="val ltr">{CLINIC_PHONE}</div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-row">
            <div className="site-footer-social">
              <a href="#" aria-label="اینستاگرام">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="#" aria-label="لینکدین">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
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
            <button className="site-staff" onClick={onLogin}>ورود کارکنان</button>
          </div>
        </div>
      </footer>

      {/* BOOKING WIZARD MODAL */}
      {wizard && (
        <BookingWizard
          initialService={wizard.service}
          onClose={() => setWizard(null)}
          onSubmit={handleBookingSubmit}
        />
      )}

      {/* URGENT MODAL */}
      {urgentOpen && (
        <div className="bw-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setUrgentOpen(false); }}>
          <div className="bw-card urgent" role="dialog">
            <div className="ur-head">
              <span className="ur-ico">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v5"/><path d="M12 16h.01"/></svg>
              </span>
              نیاز فوری دارید؟
            </div>
            <div className="ur-body">
              <p className="ur-lead">اگر شرایط اضطراری است، همین حالا تماس بگیرید. در غیر این صورت شماره خود را ثبت کنید تا با شما در سریع‌ترین زمان ممکن تماس گرفته شود.</p>
              <a className="ur-call" href="tel:0413355058008">
                <span className="ur-call-num">{CLINIC_PHONE}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 013 1.18 2 2 0 015 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L9.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14z"/></svg>
              </a>
              <div className="ur-divider"></div>
              <p className="ur-sub">نام و شماره تماس خود را ثبت کنید.</p>
              <div className="bw-fields">
                <div className="bw-field">
                  <label>نام و نام خانوادگی</label>
                  <input autoFocus placeholder="مثال: حسین ملکی" value={urgentName} onChange={(e) => setUrgentName(e.target.value)} />
                </div>
                <div className="bw-field">
                  <label>شماره تماس</label>
                  <input inputMode="tel" placeholder="مثال: ۰۹۱۴۱۲۳۴۵۶۷" value={urgentPhone} onChange={(e) => setUrgentPhone(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitUrgent()} />
                </div>
              </div>
              <div className="bw-actions">
                <button className={`bw-btn primary ${urgentName && urgentPhone ? '' : 'disabled'}`} onClick={submitUrgent}>ثبت درخواست</button>
                <button className="bw-btn ghost" onClick={() => setUrgentOpen(false)}>بستن</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
