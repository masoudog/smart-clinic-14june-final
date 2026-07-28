"use client";

import React, { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { cn, toFa } from "@/lib/utils";
import { useBookingFlow } from "@/components/booking/useBookingFlow";
import NewPatientIntakeStep from "@/components/booking/NewPatientIntakeStep";
import NewPatientTerminalStep from "@/components/booking/NewPatientTerminalStep";
import ExistingPatientCodeStep from "@/components/booking/ExistingPatientCodeStep";
import ExistingPatientLocationStep from "@/components/booking/ExistingPatientLocationStep";
import ExistingPatientDateStep from "@/components/booking/ExistingPatientDateStep";
import ExistingPatientTimeStep from "@/components/booking/ExistingPatientTimeStep";
import ExistingPatientCheckoutStep from "@/components/booking/ExistingPatientCheckoutStep";
import ExistingPatientTerminalStep from "@/components/booking/ExistingPatientTerminalStep";
import { shortDateLabel, fullDateLabelWithGregorian, getJalaliToday, parseDateKey } from "@/lib/jalali";
import { formatLocalTimeFa } from "@/lib/locationService";

interface LandingPageProps {
  onLogin?: () => void;
}

const ABOUT_FEATURES = [
  "رویکردهای اگزیستانسیالیسم",
  "طرح‌واره درمانی اختلالات روانی و شخصیتی",
  "زوج‌درمانگر و خانواده‌درمانگر",
  "روان‌درمانگر سرطان (سایکوآنکولوژیست)",
];

const SERVICE_CARDS = [
  {
    icon: "/landing-assets/Brain.svg",
    title: "روان‌درمانی اختلالات روانی",
    description:
      "تشخیص و درمان طیف گسترده‌ای از اختلالات شامل: افسردگی، اختلالات دو قطبی، اضطراب، وسواس، اختلالات جنسی.",
  },
  {
    icon: "/landing-assets/People.svg",
    title: "درمان اختلالات شخصیتی",
    description:
      "درمان اختلال شخصیت مرزی (BPD)، خودشیفته، وسواسی و سایر اختلالات شخصیت با رویکرد طرحواره درمانی",
  },
  {
    icon: "/landing-assets/Family.svg",
    title: "زوج‌درمانی و خانواده‌درمانی",
    description:
      "بهبود روابط زناشویی، حل تعارضات خانوادگی و بازسازی اعتماد و زوج‌درمانی.",
  },
  {
    icon: "/landing-assets/Person-heart.svg",
    title: "مشاوره قبل از ازدواج",
    description:
      "بررسی سازگاری شخصیتی، سبک‌های دلبستگی، مهارت‌های ارتباطی و آمادگی عاطفی برای زندگی مشترک.",
  },
];

const CONTACT_CARDS = [
  {
    icon: "/landing-assets/Pin.svg",
    title: "آدرس کلینیک",
    description:
      "تبریز - خیابان ارتش جنوبی - ساختمان ماهان - طبقه سوم- واحد چهار",
  },
  {
    icon: "/landing-assets/Phone 2.svg",
    title: "شماره تماس",
    description: "۰۴۱۳-۵۵۵۸۰۰۸",
    href: "tel:+984135558008",
  },
  {
    icon: "/landing-assets/Emails.svg",
    title: "پست الکترونیک",
    description: "Mahdipourya@yahoo.com",
    href: "mailto:Mahdipourya@yahoo.com",
  },
  {
    icon: "/landing-assets/Clock.svg",
    title: "ساعات پذیرش",
    rows: [
      { label: "تمام ایام به غیر از تعطیلات رسمی", value: "۱۵:۰۰ – ۲۱:۰۰" },
      { label: "پنجشنبه", value: "۱۰:۰۰ – ۱۳:۰۰" },
    ],
  },
];

export default function LandingPage({ onLogin }: LandingPageProps) {
  const {
    state: bookingFlow,
    setPersona,
    goToNewIntake,
    goToEntry,
    setIntakeField,
    submitNewPatientIntake,
    retryIntake,
    resetBookingFlow,
    goToExistingCode,
    setReferenceCode,
    submitReferenceCode,
    goToExistingLocation,
    selectLocation,
    goToExistingDate,
    setViewMonth,
    selectDate,
    goToExistingTime,
    selectHour,
    goToExistingCheckout,
    submitPayment,
    retryPayment,
  } = useBookingFlow();

  const jalaliToday = getJalaliToday();
  const isAbroad = bookingFlow.existingPatient.region === "abroad";
  const selectedLocation = bookingFlow.existingPatient.selectedLocation;

  // Phase 5.1 — the location/timezone step's dropdown grows the panel itself
  // (330px default / 570px open) rather than floating past it, per
  // public/abroad-time-zone.png / abroad-time-zone-selected.png. Lifted here
  // (not into the reducer) since it's transient UI state, not booking state.
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  // Hero booking panel: resizes/repositions in place per step (Phase 4.1+),
  // never a modal. "entry" keeps its original fixed Figma position (top-224);
  // every other step is vertically centered within the 780px Hero section.
  // Phase 5.1: several existing-patient steps have a different panel size
  // for the Abroad region (per the reference screenshots) — Iran's sizes are
  // unchanged.
  const HERO_SECTION_HEIGHT = 780;
  const panelHeight = (() => {
    switch (bookingFlow.step) {
      case "new-intake":
        return 712;
      case "new-terminal":
        return 220;
      case "existing-code":
        return 280;
      case "existing-location":
        return locationPickerOpen ? 570 : 330;
      case "existing-date":
        return isAbroad ? 660 : 640;
      case "existing-time":
        return isAbroad ? 424 : 330;
      case "existing-checkout":
        return 420;
      case "existing-terminal":
        return bookingFlow.existingPatient.terminal === "success" ? 384 : 220;
      default:
        return 212;
    }
  })();
  const panelTop =
    bookingFlow.step === "entry" ? 224 : Math.round((HERO_SECTION_HEIGHT - panelHeight) / 2);

  const existingSelectedDateLabel = (() => {
    const key = bookingFlow.existingPatient.selectedDateKey;
    if (!key) return "";
    const [y, m, d] = parseDateKey(key);
    return shortDateLabel(y, m, d, jalaliToday);
  })();

  // Abroad's checkout/terminal screens show the full Jalali date plus its
  // Gregorian equivalent (public/abroad-checkout.png, abroad-success.png);
  // Iran's plain shortDateLabel-based strings below are unchanged.
  const existingFullDateLabel = (() => {
    const key = bookingFlow.existingPatient.selectedDateKey;
    if (!key) return "";
    const [y, m, d] = parseDateKey(key);
    return isAbroad ? fullDateLabelWithGregorian(y, m, d, jalaliToday) : existingSelectedDateLabel;
  })();

  // Abroad's time strings show both Iran's clinic time and the selected
  // city's local time; the exact wording/order differs between the time-slot
  // cards (handled inside ExistingPatientTimeStep itself) and the
  // checkout/terminal summary rows (handled here). The location's city name
  // is shown in English (as stored in the mock dataset), not translated to a
  // Farsi country name like the reference screenshot's "آلمان" placeholder —
  // a deliberate, disclosed choice, not a literal screenshot reproduction.
  const existingCheckoutTimeLabel = (() => {
    const hour = bookingFlow.existingPatient.selectedHour;
    if (hour == null) return "";
    if (!isAbroad) return `${toFa(hour)}:۰۰`;
    if (!selectedLocation) return `${toFa(hour)}:۰۰ ایران`;
    return `${toFa(hour)}:۰۰ ایران (${formatLocalTimeFa(hour, selectedLocation)} ${selectedLocation.city})`;
  })();

  const existingTerminalDateTimeLabel = (() => {
    const key = bookingFlow.existingPatient.selectedDateKey;
    const hour = bookingFlow.existingPatient.selectedHour;
    if (!key || hour == null) return "";
    const [y] = parseDateKey(key);
    if (isAbroad) return `${toFa(hour)}:۰۰ - ${existingFullDateLabel}`;
    return `${toFa(hour)}:۰۰ - ${existingSelectedDateLabel} ${toFa(y)}`;
  })();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "l" || e.key === "L")) {
        e.preventDefault();
        onLogin?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onLogin]);

  return (
    <div dir="rtl" className="min-h-screen bg-neutral-50">
      <header className="w-full border-b border-neutral-50 bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-[171px]">
          <img
            src="/landing-assets/logo.png"
            alt="Pourya Psychotherapy Clinic"
            className="h-[51px] w-[128px] object-contain"
          />

          <nav className="flex items-center gap-8 text-body text-black">
            <a
              href="#home"
              className="!text-black transition-colors hover:!text-primary-500 hover:!no-underline"
            >
              خانه
            </a>
            <a
              href="#services"
              className="!text-black transition-colors hover:!text-primary-500 hover:!no-underline"
            >
              خدمات
            </a>
            <a
              href="#contact"
              className="!text-black transition-colors hover:!text-primary-500 hover:!no-underline"
            >
              تماس با ما
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <a
              href="tel:+984135558008"
              className="flex items-center gap-2 text-body font-medium text-neutral-900"
            >
              <span>۰۴۱۳-۵۵۵۸۰۰۸</span>
              <img src="/landing-assets/Phone, Call.svg" alt="" className="h-6 w-6" />
            </a>
            <Button
              variant="primary"
              className="h-10 w-32"
              onClick={() =>
                document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <span className="flex items-center gap-2">
                پشتیبانی
                <img
                  src="/landing-assets/message-question-checkmark.svg"
                  alt=""
                  className="h-6 w-6"
                />
              </span>
            </Button>
          </div>
        </div>
      </header>

      <section id="home" className="relative h-[780px] w-full overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/landing-assets/Hero-background.jpg"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/landing-assets/Hero-background.mp4" type="video/mp4" />
        </video>

        <div className="relative mx-auto h-full max-w-[1440px]">
          <div className="absolute right-[168px] top-[215px] w-[555px]">
            <h1 className="text-h3 font-medium leading-[150%] text-white [text-shadow:0_6px_17px_rgba(0,0,0,0.49)]">
              آرامش روان و تحقق خویشتن شما، اولویت ماست
            </h1>
            <p className="mt-2 w-[468px] text-body font-light leading-[150%] text-white [text-shadow:0_6px_7px_rgba(0,0,0,0.65)]">
              ارائه تخصصی‌ترین خدمات روان‌درمانی با بهره‌گیری از دانش روز علم
              روان‌شناسی برای بهبود کیفیت زندگی شما.
            </p>
          </div>

          <div
            className="absolute left-[168px] w-[524px] transition-[top] duration-300 ease-in-out"
            style={{ top: `${panelTop}px` }}
          >
            <div
              className="w-[524px] overflow-hidden rounded-[8px] bg-white p-6 transition-[height] duration-300 ease-in-out"
              style={{ height: `${panelHeight}px` }}
            >
              {bookingFlow.step === "new-intake" ? (
                <NewPatientIntakeStep
                  data={bookingFlow.newPatientIntake}
                  errors={bookingFlow.newPatientIntakeErrors}
                  isSubmitting={bookingFlow.isValidatingIntake}
                  onFieldChange={setIntakeField}
                  onNext={submitNewPatientIntake}
                  onPrev={goToEntry}
                />
              ) : bookingFlow.step === "new-terminal" && bookingFlow.newPatientTerminal ? (
                <NewPatientTerminalStep
                  status={bookingFlow.newPatientTerminal}
                  onAction={() => {
                    if (bookingFlow.newPatientTerminal === "success") resetBookingFlow();
                    else if (bookingFlow.newPatientTerminal === "error") retryIntake();
                  }}
                />
              ) : bookingFlow.step === "existing-code" ? (
                <ExistingPatientCodeStep
                  code={bookingFlow.existingPatient.referenceCode}
                  error={bookingFlow.existingPatient.referenceCodeError}
                  isSubmitting={bookingFlow.isVerifyingCode}
                  onChange={setReferenceCode}
                  onNext={submitReferenceCode}
                  onPrev={goToEntry}
                />
              ) : bookingFlow.step === "existing-location" ? (
                <ExistingPatientLocationStep
                  selectedLocation={selectedLocation}
                  onSelectLocation={selectLocation}
                  onNext={goToExistingDate}
                  onPrev={goToExistingCode}
                  onOpenChange={setLocationPickerOpen}
                />
              ) : bookingFlow.step === "existing-date" ? (
                <ExistingPatientDateStep
                  region={bookingFlow.existingPatient.region}
                  viewYear={bookingFlow.existingPatient.viewYear}
                  viewMonth={bookingFlow.existingPatient.viewMonth}
                  selectedDateKey={bookingFlow.existingPatient.selectedDateKey}
                  onViewMonthChange={setViewMonth}
                  onSelectDate={selectDate}
                  onNext={goToExistingTime}
                  onPrev={isAbroad ? goToExistingLocation : goToExistingCode}
                />
              ) : bookingFlow.step === "existing-time" && bookingFlow.existingPatient.selectedDateKey ? (
                <ExistingPatientTimeStep
                  region={bookingFlow.existingPatient.region}
                  location={selectedLocation}
                  dateKey={bookingFlow.existingPatient.selectedDateKey}
                  selectedHour={bookingFlow.existingPatient.selectedHour}
                  onSelectHour={selectHour}
                  onNext={goToExistingCheckout}
                  onPrev={goToExistingDate}
                />
              ) : bookingFlow.step === "existing-checkout" &&
                bookingFlow.existingPatient.selectedDateKey &&
                bookingFlow.existingPatient.selectedHour != null ? (
                <ExistingPatientCheckoutStep
                  region={bookingFlow.existingPatient.region}
                  dateLabel={existingFullDateLabel}
                  timeLabel={existingCheckoutTimeLabel}
                  patientName={bookingFlow.existingPatient.patientName}
                  isSubmitting={bookingFlow.isSubmittingPayment}
                  onPay={submitPayment}
                  onPrev={goToExistingTime}
                />
              ) : bookingFlow.step === "existing-terminal" && bookingFlow.existingPatient.terminal ? (
                <ExistingPatientTerminalStep
                  status={bookingFlow.existingPatient.terminal}
                  dateTimeLabel={existingTerminalDateTimeLabel}
                  patientName={bookingFlow.existingPatient.patientName}
                  referenceNumber={bookingFlow.existingPatient.referenceNumber}
                  onAction={() => {
                    if (bookingFlow.existingPatient.terminal === "success") resetBookingFlow();
                    else retryPayment();
                  }}
                />
              ) : (
                <>
                  <h2 className="text-center text-h5 font-medium text-neutral-900">
                    رزرو آنلاین نوبت
                  </h2>

                  <div className="mt-6 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPersona("existing")}
                      className={cn(
                        "flex-1 rounded-[8px] border px-4 py-3 text-body font-light transition-colors",
                        bookingFlow.persona === "existing"
                          ? "border-primary-500 bg-primary-50 text-primary-500"
                          : "border-neutral-100 bg-white text-neutral-800 hover:bg-neutral-50",
                      )}
                    >
                      پرونده ثبت شده دارم
                    </button>
                    <button
                      type="button"
                      onClick={() => setPersona("new")}
                      className={cn(
                        "flex-1 rounded-[8px] border px-4 py-3 text-body font-light transition-colors",
                        bookingFlow.persona === "new"
                          ? "border-primary-500 bg-primary-50 text-primary-500"
                          : "border-neutral-100 bg-white text-neutral-800 hover:bg-neutral-50",
                      )}
                    >
                      پرونده ثبت شده ندارم
                    </button>
                  </div>

                  <Button
                    variant="primary"
                    disabled={!bookingFlow.persona}
                    className="mt-[28px] w-full"
                    onClick={() => {
                      if (bookingFlow.persona === "new") goToNewIntake();
                      else if (bookingFlow.persona === "existing") goToExistingCode();
                    }}
                  >
                    <span className="flex items-center gap-2">
                      بعدی
                      <img src="/landing-assets/Arrow.svg" alt="" className="h-6 w-6" />
                    </span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        id="about"
        className="relative h-[436px] w-full bg-[linear-gradient(180deg,_#ffffff_0%,_#CCD7FF_100%)]"
      >
        <div className="relative mx-auto h-full max-w-[1440px] px-6">
          <h2 className="absolute inset-x-0 top-[56px] text-center text-h3 font-medium leading-[150%] text-neutral-900">
            دکتر محمد مهدی اسماعیل‌زاده پوریا
          </h2>
          <p className="absolute inset-x-0 top-[124px] text-center text-h5 font-light leading-[150%] text-neutral-700">
            متخصص روان‌شناس سلامت | عضو هیئت علمی دانشگاه
          </p>
          <p className="absolute inset-x-0 top-[200px] text-center text-h5 font-light leading-[150%] text-neutral-900">
            روان‌درمانگر از سال ۱۳۸۰، با تمرکز بر:
          </p>

          <div className="absolute inset-x-0 top-[268px] mx-auto grid w-fit grid-cols-2 gap-x-24 gap-y-6">
            {ABOUT_FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <img src="/landing-assets/Check-one.svg" alt="" className="h-6 w-6" />
                <span className="text-h5 font-medium leading-[150%] text-neutral-900">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="services"
        className="relative h-[683px] w-full overflow-hidden bg-white"
      >
        <img
          src="/landing-assets/big-flower.jpg"
          alt=""
          className="pointer-events-none absolute left-[1231px] top-[-24px] h-[732px] w-[215px] object-cover"
        />
        <img
          src="/landing-assets/little-flower.jpg"
          alt=""
          className="pointer-events-none absolute left-[-13px] top-[355px] h-[339px] w-[246px] object-cover"
        />

        <div className="relative mx-auto h-full max-w-[1440px] px-6">
          <h2 className="absolute inset-x-0 top-[55px] text-center text-[40px] font-medium leading-[150%] text-neutral-900">
            خدمات تخصصی کلینیک روان‌درمانی پوریا
          </h2>
          <p className="absolute inset-x-0 top-[123px] text-center text-[24px] font-light leading-[150%] text-neutral-700">
            با بهره‌گیری از آخرین دستاوردهای علمی در حوزه روان‌شناسی، خدمات جامع
            و متنوعی را به شما ارائه می‌دهیم
          </p>

          <div className="absolute inset-x-0 top-[223px] mx-auto grid w-[1104px] grid-cols-2 gap-x-6 gap-y-6">
            {SERVICE_CARDS.map((service) => (
              <div
                key={service.title}
                role="button"
                tabIndex={0}
                onClick={() =>
                  document.getElementById("home")?.scrollIntoView({ behavior: "smooth" })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    document.getElementById("home")?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="relative h-[188px] w-[540px] cursor-pointer rounded-[8px] border border-neutral-100 bg-white shadow-[0_6px_6px_rgba(0,0,0,0.04)]"
              >
                <img
                  src={service.icon}
                  alt=""
                  className="absolute right-[24px] top-[24px] h-10 w-10"
                />
                <h3 className="absolute right-[24px] top-[72px] text-[24px] font-medium leading-[150%] text-neutral-900">
                  {service.title}
                </h3>
                <p className="absolute right-[24px] top-[116px] w-[492px] text-[16px] font-light leading-[150%] text-neutral-700">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="relative h-[642px] w-full overflow-hidden bg-[url('/landing-assets/section-background.png')] bg-cover bg-center"
      >
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative mx-auto h-full max-w-[1440px] px-6">
          <h2 className="absolute inset-x-0 top-[42px] text-center text-[40px] font-medium leading-[150%] text-white">
            در تماس باشید
          </h2>
          <p className="absolute inset-x-0 top-[110px] text-center text-[24px] font-light leading-[150%] text-white">
            پاسخگوی سوالات شما هستیم
          </p>

          <div className="absolute inset-x-0 top-[210px] mx-auto grid w-[728px] grid-cols-2 gap-x-6 gap-y-6">
            {CONTACT_CARDS.map((card) => (
              <div
                key={card.title}
                className="relative h-[152px] w-[352px] rounded-[8px] border-[0.5px] border-[#D3D7DC]/60 bg-white/[0.13] backdrop-blur-[47px]"
              >
                <div className="absolute inset-x-0 top-[16px] mx-auto flex h-8 w-8 items-center justify-center rounded-[8px] border-[0.5px] border-[#D3D7DC]/60 bg-white/[0.13]">
                  <img src={card.icon} alt="" className="h-6 w-6" />
                </div>
                <h3 className="absolute inset-x-0 top-[56px] text-center text-[16px] font-light leading-[150%] text-white">
                  {card.title}
                </h3>
                {card.rows ? (
                  <div className="absolute inset-x-0 top-[88px] flex flex-col gap-1 px-4">
                    {card.rows.map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between text-[16px] font-medium leading-[150%] text-white"
                      >
                        <span>{row.label}</span>
                        <span>{row.value}</span>
                      </div>
                    ))}
                  </div>
                ) : card.href ? (
                  <a
                    href={card.href}
                    className="absolute inset-x-0 top-[88px] mx-auto w-[319px] whitespace-pre-line text-center text-[16px] font-medium leading-[150%] text-white"
                  >
                    {card.description}
                  </a>
                ) : (
                  <p className="absolute inset-x-0 top-[88px] mx-auto w-[319px] whitespace-pre-line text-center text-[16px] font-medium leading-[150%] text-white">
                    {card.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="footer"
        className="relative mt-[15px] h-[320px] w-full bg-white"
      >
        <div className="relative mx-auto h-full max-w-[1440px] px-6">
          <img
            src="/landing-assets/logo.png"
            alt="Pourya Psychotherapy Clinic"
            className="absolute right-[80px] top-[80px] h-[51px] w-[128px] object-contain"
          />

          <nav className="absolute inset-x-0 top-[94px] mx-auto flex w-fit items-center gap-8 text-[16px] font-normal leading-[150%] text-black">
            <a
              href="#home"
              className="!text-black hover:!text-primary-500 hover:!no-underline"
            >
              خانه
            </a>
            <a
              href="#services"
              className="!text-black hover:!text-primary-500 hover:!no-underline"
            >
              خدمات
            </a>
            <a
              href="#contact"
              className="!text-black hover:!text-primary-500 hover:!no-underline"
            >
              تماس با ما
            </a>
          </nav>

          <div className="absolute left-[80px] top-[94px] flex items-center gap-3">
            <a href="#">
              <img src="/landing-assets/LinkedIn.svg" alt="" className="h-6 w-6" />
            </a>
            <a href="#">
              <img src="/landing-assets/Instagram.svg" alt="" className="h-6 w-6" />
            </a>
          </div>

          <div className="absolute inset-x-0 top-[187px] mx-auto h-0 w-[1280px] border-t border-black" />

          <p className="absolute inset-x-0 top-[219px] text-center text-[14px] font-normal leading-[150%] text-black">
            تمام حقوق وبسایت کلینیک روان‌درمانی پوریا محفوظ است.
          </p>
        </div>
      </section>
    </div>
  );
}
