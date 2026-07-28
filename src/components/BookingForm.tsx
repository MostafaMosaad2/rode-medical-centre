"use client";

import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { userSafeError } from "@/lib/bookingErrors";
import { hasHourAvailability } from "@/lib/imdad/hours";
import { useI18n } from "@/lib/i18n";
import { site } from "@/lib/site";

type ClinicOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  periodAr: string | null;
  periodEn: string | null;
  device: string | null;
};

type SlotOption = {
  ss: string;
  clinicId: string;
  time: string;
  label: string;
};

type PatientOption = {
  token: string;
  name: string;
  fileId: string;
  phoneOrId: string;
};

type SessionType = "basic" | "retouch";

type TreatmentType =
  | "full_body"
  | "full_body_no_back_belly"
  | "mini_limbs"
  | "small_area"
  | "large_area";

const HOUR_TREATMENTS: ReadonlySet<TreatmentType> = new Set([
  "full_body",
  "full_body_no_back_belly",
]);

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function clinicLabel(c: ClinicOption, locale: "ar" | "en"): string {
  const base = locale === "ar" ? c.nameAr : c.nameEn;
  const period = locale === "ar" ? c.periodAr : c.periodEn;
  if (period && c.device) {
    return `${base} (${period})`;
  }
  return base;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function BookingForm() {
  const { t, locale } = useI18n();
  const [clinics, setClinics] = useState<ClinicOption[]>([]);
  const [clinicId, setClinicId] = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("basic");
  const [treatmentType, setTreatmentType] =
    useState<TreatmentType>("full_body");
  const [date, setDate] = useState(tomorrowIso);
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [selectedSs, setSelectedSs] = useState("");
  const [lookup, setLookup] = useState("");
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(
    null,
  );
  const [noFile, setNoFile] = useState(false);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [lookingUp, setLookingUp] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsNonce, setSlotsNonce] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const lookupSeq = useRef(0);

  const sessionLabel =
    sessionType === "basic" ? t.book.sessionBasic : t.book.sessionRetouch;

  const treatmentLabel = (() => {
    switch (treatmentType) {
      case "full_body":
        return t.book.treatmentFullBody;
      case "full_body_no_back_belly":
        return t.book.treatmentFullBodyNoBackBelly;
      case "mini_limbs":
        return t.book.treatmentMiniLimbs;
      case "small_area":
        return t.book.treatmentSmallArea;
      case "large_area":
        return t.book.treatmentLargeArea;
    }
  })();

  const needsHourSlot = HOUR_TREATMENTS.has(treatmentType);
  const visibleSlots = (() => {
    if (!needsHourSlot) return slots;
    const times = new Set(slots.map((s) => s.time));
    return slots.filter((s) => hasHourAvailability(s.time, times));
  })();

  const showUserError = (message: string | undefined, fallback: string) => {
    setError(userSafeError(message, fallback));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let attempt = 0;
      while (!cancelled) {
        attempt += 1;
        try {
          const res = await fetch("/api/book/clinics");
          if (!res.ok) throw new Error("retry");
          const data = (await res.json()) as { clinics?: ClinicOption[] };
          if (cancelled) return;
          const list = data.clinics ?? [];
          startTransition(() => {
            setClinics(list);
            if (list[0]) setClinicId(list[0].id);
            setLoadingClinics(false);
          });
          return;
        } catch {
          // Keep trying quietly
        }
        await sleep(Math.min(1000 * attempt, 4000));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!clinicId || !date || !selectedPatient) {
      setSlots([]);
      setSelectedSs("");
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSs("");

    (async () => {
      let attempt = 0;
      while (!cancelled) {
        attempt += 1;
        try {
          const res = await fetch(
            `/api/book/slots?clinicId=${encodeURIComponent(clinicId)}&date=${encodeURIComponent(date)}`,
          );
          const data = (await res.json()) as { slots?: SlotOption[] };
          if (cancelled) return;
          if (res.ok) {
            startTransition(() => {
              setSlots(data.slots ?? []);
              setLoadingSlots(false);
            });
            return;
          }
        } catch {
          // Keep trying quietly — patient only sees loading
        }
        await sleep(Math.min(1000 * attempt, 5000));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clinicId, date, selectedPatient, slotsNonce]);

  useEffect(() => {
    if (!selectedSs) return;
    const times = new Set(slots.map((s) => s.time));
    const stillValid = slots.some((s) => {
      if (s.ss !== selectedSs) return false;
      if (!needsHourSlot) return true;
      return hasHourAvailability(s.time, times);
    });
    if (!stillValid) setSelectedSs("");
  }, [slots, selectedSs, needsHourSlot]);

  async function onLookup(e?: FormEvent) {
    e?.preventDefault();
    const seq = ++lookupSeq.current;

    setNoFile(false);
    setPatients([]);
    setSelectedPatient(null);
    setError("");
    setSuccess("");
    setConfirmOpen(false);

    const q = lookup.trim();
    if (!q) {
      showUserError(undefined, t.book.errorLookup);
      return;
    }

    setLookingUp(true);
    try {
      let attempt = 0;
      while (seq === lookupSeq.current) {
        attempt += 1;
        try {
          const res = await fetch("/api/book/patient", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: q }),
          });
          const data = (await res.json()) as {
            found?: boolean;
            patients?: PatientOption[];
            error?: string;
            code?: string;
            retry?: boolean;
          };

          if (seq !== lookupSeq.current) return;

          // Validation only — never show technical/network text
          if (res.status === 400 && data.code === "INVALID") {
            showUserError(undefined, t.book.errorLookup);
            return;
          }

          if (res.ok) {
            if (!data.found || !data.patients?.length) {
              setSelectedPatient(null);
              setPatients([]);
              setNoFile(true);
              return;
            }
            setNoFile(false);
            setError("");
            setPatients(data.patients);
            if (data.patients.length === 1) {
              setSelectedPatient(data.patients[0]!);
            }
            return;
          }

          // 503 / retry — keep checking quietly
        } catch {
          // fetch failed — keep checking quietly
        }

        await sleep(Math.min(1000 * attempt, 5000));
      }
    } finally {
      if (seq === lookupSeq.current) {
        setLookingUp(false);
      }
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedPatient) {
      showUserError(undefined, t.book.errorNoFile);
      return;
    }
    const slot = visibleSlots.find((s) => s.ss === selectedSs);
    if (!slot) {
      showUserError(undefined, t.book.errorPickSlot);
      return;
    }

    setConfirmOpen(true);
  }

  async function confirmBooking() {
    setConfirmOpen(false);
    setError("");
    setSuccess("");

    if (!selectedPatient) {
      showUserError(undefined, t.book.errorNoFile);
      return;
    }
    const slot = visibleSlots.find((s) => s.ss === selectedSs);
    if (!slot) {
      showUserError(undefined, t.book.errorPickSlot);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        clinicId: slot.clinicId,
        ss: slot.ss,
        patientToken: selectedPatient.token,
        notes: `جلسة: ${sessionLabel} | الخدمة: ${treatmentLabel} | حجز من موقع مجمع رود الطبي`,
      };

      for (let attempt = 1; ; attempt += 1) {
        try {
          const res = await fetch("/api/book/reserve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = (await res.json()) as {
            ok?: boolean;
            error?: string;
            code?: string;
            retry?: boolean;
          };

          if (res.ok) {
            setSuccess(t.book.success);
            setSelectedSs("");
            setLookup("");
            setPatients([]);
            setSelectedPatient(null);
            setNoFile(false);
            setSlots([]);
            setSessionType("basic");
            setTreatmentType("full_body");
            return;
          }

          if (data.code === "NO_FILE") {
            setNoFile(true);
            setSelectedPatient(null);
            setPatients([]);
            showUserError(undefined, t.book.errorNoFile);
            return;
          }
          if (data.code === "SLOT_GONE") {
            showUserError(undefined, t.book.errorSlotGone);
            setSelectedSs("");
            setSlotsNonce((n) => n + 1);
            return;
          }
          if (data.code === "INVALID") {
            showUserError(data.error, t.book.errorReserve);
            return;
          }

          // Network / clinic busy — retry silently
        } catch {
          // fetch failed — retry silently
        }

        await sleep(Math.min(1000 * attempt, 5000));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const canBook = Boolean(selectedPatient);
  const showNoFile = noFile && !selectedPatient && !lookingUp;

  return (
    <div className="booking-form">
      <form className="booking-lookup" onSubmit={onLookup}>
        <label className="booking-field booking-field--full">
          <span>{t.book.lookup}</span>
          <div className="booking-lookup__row">
            <input
              type="text"
              value={lookup}
              onChange={(e) => {
                lookupSeq.current += 1;
                setLookup(e.target.value);
                setNoFile(false);
                setSelectedPatient(null);
                setPatients([]);
                setError("");
                setSuccess("");
                setLookingUp(false);
                setConfirmOpen(false);
              }}
              inputMode="numeric"
              dir="ltr"
              placeholder={t.book.lookupPlaceholder}
              disabled={lookingUp || submitting}
              required
            />
            <button
              type="submit"
              className="btn btn--primary"
              disabled={lookingUp || submitting}
            >
              {lookingUp ? t.book.lookingUp : t.book.checkFile}
            </button>
          </div>
        </label>
      </form>

      {showNoFile ? (
        <p className="booking-msg booking-msg--error" key={`nofile-${lookup}`}>
          {t.book.noFile}{" "}
          <a className="booking-msg__phone" href={`tel:${site.phoneTel}`} dir="ltr">
            {site.phoneDisplay}
          </a>
        </p>
      ) : null}

      {patients.length > 1 && !selectedPatient ? (
        <div className="booking-patients">
          <p className="booking-slots__label">{t.book.chooseFile}</p>
          <div className="booking-patients__list">
            {patients.map((p) => (
              <button
                key={p.token}
                type="button"
                className="booking-patient"
                onClick={() => {
                  setNoFile(false);
                  setSelectedPatient(p);
                }}
                disabled={submitting}
              >
                <strong>{p.name}</strong>
                <span dir="ltr">
                  {p.phoneOrId} · #{p.fileId}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {selectedPatient ? (
        <p className="booking-msg booking-msg--ok">
          {t.book.fileFound}: <strong>{selectedPatient.name}</strong>
          <span className="booking-file-meta" dir="ltr">
            {" "}
            ({selectedPatient.phoneOrId})
          </span>
        </p>
      ) : null}

      <form onSubmit={onSubmit}>
        <div className="booking-form__grid">
          <label className="booking-field booking-field--full">
            <span>{t.book.clinic}</span>
            <select
              value={clinicId}
              onChange={(e) => setClinicId(e.target.value)}
              disabled={!canBook || loadingClinics || submitting}
              required
            >
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {clinicLabel(c, locale)}
                </option>
              ))}
            </select>
          </label>

          <label className="booking-field">
            <span>{t.book.session}</span>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value as SessionType)}
              disabled={!canBook || submitting}
              required
            >
              <option value="basic">{t.book.sessionBasic}</option>
              <option value="retouch">{t.book.sessionRetouch}</option>
            </select>
          </label>

          <label className="booking-field">
            <span>{t.book.treatment}</span>
            <select
              value={treatmentType}
              onChange={(e) => {
                setTreatmentType(e.target.value as TreatmentType);
                setSelectedSs("");
              }}
              disabled={!canBook || submitting}
              required
            >
              <option value="full_body">{t.book.treatmentFullBody}</option>
              <option value="full_body_no_back_belly">
                {t.book.treatmentFullBodyNoBackBelly}
              </option>
              <option value="mini_limbs">{t.book.treatmentMiniLimbs}</option>
              <option value="small_area">{t.book.treatmentSmallArea}</option>
              <option value="large_area">{t.book.treatmentLargeArea}</option>
            </select>
          </label>

          <label className="booking-field booking-field--full">
            <span>{t.book.date}</span>
            <input
              type="date"
              value={date}
              min={tomorrowIso()}
              onChange={(e) => setDate(e.target.value)}
              disabled={!canBook || submitting}
              required
            />
          </label>
        </div>

        {canBook ? (
          <div className="booking-slots">
            <p className="booking-slots__label">{t.book.time}</p>
            {loadingSlots ? (
              <p className="booking-slots__status">{t.book.loadingSlots}</p>
            ) : visibleSlots.length === 0 ? (
              <p className="booking-slots__status">{t.book.noSlots}</p>
            ) : (
              <div
                className="booking-slots__list"
                role="radiogroup"
                aria-label={t.book.time}
              >
                {visibleSlots.map((slot) => {
                  const active = selectedSs === slot.ss;
                  return (
                    <button
                      key={slot.ss}
                      type="button"
                      className={`booking-slot${active ? " is-active" : ""}`}
                      onClick={() => setSelectedSs(slot.ss)}
                      disabled={submitting}
                      aria-pressed={active}
                    >
                      <span dir="ltr">{slot.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <p className="booking-slots__status">{t.book.lookupFirst}</p>
        )}

        {error && !showNoFile ? (
          <p className="booking-msg booking-msg--error">{error}</p>
        ) : null}
        {success ? <p className="booking-msg booking-msg--ok">{success}</p> : null}

        <button
          type="submit"
          className="btn btn--primary btn--lg"
          disabled={!canBook || submitting || loadingSlots || !selectedSs}
        >
          {submitting ? t.book.submitting : t.book.submit}
        </button>
      </form>

      {confirmOpen ? (
        <div
          className="booking-confirm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-confirm-title"
        >
          <div className="booking-confirm__panel">
            <p id="booking-confirm-title" className="booking-confirm__text">
              {t.book.confirmNotice}
            </p>
            <div className="booking-confirm__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
              >
                {t.book.confirmCancel}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => void confirmBooking()}
                disabled={submitting}
              >
                {t.book.confirmContinue}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
