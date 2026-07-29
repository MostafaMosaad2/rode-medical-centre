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

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function clampDate(value: string, min: string, max: string): string {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

type PatientAppointmentsInfo = {
  hasAnyBooking: boolean;
  hasUnconfirmedFuture: boolean;
  hideRetouch: boolean;
  lastBookingDate: string | null;
  basicLaserDate: string | null;
  basicMinDate: string | null;
  retouchMinDate: string | null;
  retouchMaxDate: string | null;
};

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
  const [noBookingAfterLookup, setNoBookingAfterLookup] = useState(false);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [lookingUp, setLookingUp] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsNonce, setSlotsNonce] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [alreadyBookedOpen, setAlreadyBookedOpen] = useState(false);
  const [apptInfo, setApptInfo] = useState<PatientAppointmentsInfo | null>(
    null,
  );
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const lookupSeq = useRef(0);
  const apptSeq = useRef(0);
  const apptLoadedForFileId = useRef<string | null>(null);

  const needsHourSlot = HOUR_TREATMENTS.has(treatmentType);
  const visibleSlots = (() => {
    if (!needsHourSlot) return slots;
    const times = new Set(slots.map((s) => s.time));
    return slots.filter((s) => hasHourAvailability(s.time, times));
  })();

  const showUserError = (message: string | undefined, fallback: string) => {
    setError(userSafeError(message, fallback));
  };

  function applyAppointmentResult(
    list: PatientOption[],
    data: Partial<PatientAppointmentsInfo> & {
      matchedFileId?: string | null;
      filesWithBooking?: string[];
    },
  ) {
    const withBooking = list.filter((p) =>
      (data.filesWithBooking ?? []).includes(p.fileId),
    );
    const matched =
      withBooking.find((p) => p.fileId === data.matchedFileId) ??
      withBooking[0] ??
      null;

    if (!data.hasAnyBooking || !matched) {
      apptLoadedForFileId.current = null;
      setPatients(list);
      setSelectedPatient(null);
      setApptInfo({
        hasAnyBooking: false,
        hasUnconfirmedFuture: false,
        hideRetouch: false,
        lastBookingDate: null,
        basicLaserDate: null,
        basicMinDate: null,
        retouchMinDate: null,
        retouchMaxDate: null,
      });
      setNoBookingAfterLookup(true);
      setLoadingAppts(false);
      return;
    }

    apptLoadedForFileId.current = matched.fileId;
    setNoBookingAfterLookup(false);
    setPatients(withBooking.length > 0 ? withBooking : list);
    setSelectedPatient(matched);
    if (data.hideRetouch) {
      setSessionType("basic");
    }
    setApptInfo({
      hasAnyBooking: true,
      hasUnconfirmedFuture: Boolean(data.hasUnconfirmedFuture),
      hideRetouch: Boolean(data.hideRetouch),
      lastBookingDate: data.lastBookingDate ?? null,
      basicLaserDate: data.basicLaserDate ?? null,
      basicMinDate: data.basicMinDate ?? null,
      retouchMinDate: data.retouchMinDate ?? null,
      retouchMaxDate: data.retouchMaxDate ?? null,
    });
    setLoadingAppts(false);
  }

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
    if (!selectedPatient) {
      return;
    }
    if (apptLoadedForFileId.current === selectedPatient.fileId) {
      return;
    }

    const seq = ++apptSeq.current;
    const patient = selectedPatient;
    setLoadingAppts(true);
    setApptInfo(null);
    setNoBookingAfterLookup(false);

    (async () => {
      let attempt = 0;
      while (seq === apptSeq.current) {
        attempt += 1;
        try {
          const res = await fetch("/api/book/appointments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileId: patient.fileId,
              phoneOrId: patient.phoneOrId,
            }),
          });
          const data = (await res.json()) as Partial<PatientAppointmentsInfo> & {
            matchedFileId?: string | null;
            filesWithBooking?: string[];
            retry?: boolean;
          };
          if (seq !== apptSeq.current) return;
          if (res.ok) {
            startTransition(() => {
              apptLoadedForFileId.current = patient.fileId;
              if (data.hideRetouch) {
                setSessionType("basic");
              }
              setApptInfo({
                hasAnyBooking: Boolean(data.hasAnyBooking),
                hasUnconfirmedFuture: Boolean(data.hasUnconfirmedFuture),
                hideRetouch: Boolean(data.hideRetouch),
                lastBookingDate: data.lastBookingDate ?? null,
                basicLaserDate: data.basicLaserDate ?? null,
                basicMinDate: data.basicMinDate ?? null,
                retouchMinDate: data.retouchMinDate ?? null,
                retouchMaxDate: data.retouchMaxDate ?? null,
              });
              setNoBookingAfterLookup(!data.hasAnyBooking);
              setLoadingAppts(false);
            });
            return;
          }
        } catch {
          // Keep trying quietly
        }
        await sleep(Math.min(1000 * attempt, 5000));
      }
    })();

    return () => {
      apptSeq.current += 1;
    };
  }, [selectedPatient]);

  useEffect(() => {
    if (apptInfo?.hideRetouch && sessionType === "retouch") {
      setSessionType("basic");
    }
  }, [apptInfo?.hideRetouch, sessionType]);

  const dateMin = (() => {
    const tomorrow = tomorrowIso();
    if (sessionType === "retouch") {
      const retouchMin = apptInfo?.retouchMinDate;
      if (!retouchMin) return tomorrow;
      return retouchMin > tomorrow ? retouchMin : tomorrow;
    }
    // أساسي: only after 21 days from last أساس (walking back past رتوش)
    const basicMin = apptInfo?.basicMinDate;
    if (!basicMin) return tomorrow;
    return basicMin > tomorrow ? basicMin : tomorrow;
  })();

  const dateMax =
    sessionType === "retouch" ? apptInfo?.retouchMaxDate ?? undefined : undefined;

  const retouchWindowOpen =
    sessionType !== "retouch" ||
    Boolean(
      apptInfo?.retouchMinDate &&
        apptInfo.retouchMaxDate &&
        apptInfo.retouchMaxDate >= tomorrowIso(),
    );

  useEffect(() => {
    if (!apptInfo) return;
    if (sessionType === "retouch") {
      if (!apptInfo.retouchMinDate || !apptInfo.retouchMaxDate) return;
      if (apptInfo.retouchMaxDate < tomorrowIso()) return;
      setDate((prev) => clampDate(prev, dateMin, apptInfo.retouchMaxDate!));
      return;
    }
    // أساسي — clamp to 21-day minimum when applicable
    setDate((prev) => (prev < dateMin ? dateMin : prev));
  }, [sessionType, apptInfo, dateMin]);

  useEffect(() => {
    if (sessionType !== "retouch" || loadingAppts || !apptInfo) return;
    if (!apptInfo.hasAnyBooking) return;
    if (!apptInfo.basicLaserDate || !apptInfo.retouchMinDate || !apptInfo.retouchMaxDate) {
      setError(t.book.errorNoBasicLaser);
      return;
    }
    if (!retouchWindowOpen) {
      setError(t.book.errorRetouchDate);
    }
  }, [
    sessionType,
    loadingAppts,
    apptInfo,
    retouchWindowOpen,
    t.book.errorNoBasicLaser,
    t.book.errorRetouchDate,
  ]);

  useEffect(() => {
    if (sessionType !== "basic" || loadingAppts || !apptInfo) return;
    if (!apptInfo.basicMinDate) return;
    if (apptInfo.basicMinDate > tomorrowIso() && date < apptInfo.basicMinDate) {
      setError(t.book.errorBasicDate);
    }
  }, [
    sessionType,
    loadingAppts,
    apptInfo,
    date,
    t.book.errorBasicDate,
  ]);

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
    setNoBookingAfterLookup(false);
    setPatients([]);
    setSelectedPatient(null);
    setApptInfo(null);
    apptLoadedForFileId.current = null;
    setError("");
    setSuccess("");
    setConfirmOpen(false);
    setAlreadyBookedOpen(false);

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
            setLookingUp(false);
            setLoadingAppts(true);

            // Check bookings across all files for this national ID / phone
            let apptAttempt = 0;
            while (seq === lookupSeq.current) {
              apptAttempt += 1;
              try {
                const apptRes = await fetch("/api/book/appointments", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    fileIds: data.patients.map((p) => p.fileId),
                    phoneOrId: data.patients[0]?.phoneOrId,
                  }),
                });
                const apptData =
                  (await apptRes.json()) as Partial<PatientAppointmentsInfo> & {
                    matchedFileId?: string | null;
                    filesWithBooking?: string[];
                    retry?: boolean;
                  };
                if (seq !== lookupSeq.current) return;
                if (apptRes.ok) {
                  startTransition(() => {
                    applyAppointmentResult(data.patients!, apptData);
                  });
                  return;
                }
              } catch {
                // retry quietly
              }
              await sleep(Math.min(1000 * apptAttempt, 5000));
            }
            return;
          }
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
    if (loadingAppts) return;

    if (apptInfo && !apptInfo.hasAnyBooking) {
      return;
    }

    if (sessionType === "basic" && apptInfo?.hasUnconfirmedFuture) {
      setAlreadyBookedOpen(true);
      return;
    }

    if (sessionType === "basic" && apptInfo?.basicMinDate) {
      if (date < apptInfo.basicMinDate) {
        showUserError(undefined, t.book.errorBasicDate);
        return;
      }
    }

    if (sessionType === "retouch") {
      if (apptInfo?.hideRetouch) {
        setSessionType("basic");
        return;
      }
      if (
        !apptInfo?.basicLaserDate ||
        !apptInfo.retouchMinDate ||
        !apptInfo.retouchMaxDate
      ) {
        showUserError(undefined, t.book.errorNoBasicLaser);
        return;
      }
      if (date < apptInfo.retouchMinDate || date > apptInfo.retouchMaxDate) {
        showUserError(undefined, t.book.errorRetouchDate);
        return;
      }
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
      const notesSession = sessionType === "basic" ? "اساسي" : "رتوش";
      const notesTreatment = (() => {
        switch (treatmentType) {
          case "full_body":
            return "فل بدي كامل الجسم";
          case "full_body_no_back_belly":
            return "فل بدي بدون ظهر وبطن";
          case "mini_limbs":
            return "ميني اطراف";
          case "small_area":
            return "منطقة صغيرة من اختيارك";
          case "large_area":
            return "منطقة كبيرة من اختيارك";
        }
      })();

      const payload = {
        clinicId: slot.clinicId,
        ss: slot.ss,
        patientToken: selectedPatient.token,
        sessionType,
        notes: `${notesSession} ${notesTreatment} ( من الموقع )`,
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
          if (data.code === "ALREADY_BOOKED") {
            setAlreadyBookedOpen(true);
            return;
          }
          if (data.code === "NO_BOOKING" || data.code === "NO_LAST_BOOKING") {
            setApptInfo((prev) =>
              prev
                ? {
                    ...prev,
                    hasAnyBooking: false,
                    hideRetouch: false,
                    lastBookingDate: null,
                    basicLaserDate: null,
                    basicMinDate: null,
                    retouchMinDate: null,
                    retouchMaxDate: null,
                  }
                : {
                    hasAnyBooking: false,
                    hasUnconfirmedFuture: false,
                    hideRetouch: false,
                    lastBookingDate: null,
                    basicLaserDate: null,
                    basicMinDate: null,
                    retouchMinDate: null,
                    retouchMaxDate: null,
                  },
            );
            return;
          }
          if (data.code === "NO_BASIC_LASER") {
            showUserError(undefined, t.book.errorNoBasicLaser);
            return;
          }
          if (data.code === "BASIC_DATE") {
            showUserError(undefined, t.book.errorBasicDate);
            return;
          }
          if (data.code === "RETOUCH_HIDDEN") {
            setSessionType("basic");
            setApptInfo((prev) =>
              prev ? { ...prev, hideRetouch: true, retouchMinDate: null, retouchMaxDate: null } : prev,
            );
            return;
          }
          if (data.code === "RETOUCH_DATE") {
            showUserError(undefined, t.book.errorRetouchDate);
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

  const canBook =
    Boolean(selectedPatient) &&
    !loadingAppts &&
    Boolean(apptInfo?.hasAnyBooking);
  const showNoFile = noFile && !selectedPatient && !lookingUp;
  const showNoBooking =
    noBookingAfterLookup ||
    (Boolean(selectedPatient) &&
      !loadingAppts &&
      apptInfo !== null &&
      !apptInfo.hasAnyBooking);
  const showCheckingBookings =
    (lookingUp === false && loadingAppts) ||
    (Boolean(selectedPatient) && loadingAppts);

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
                setNoBookingAfterLookup(false);
                setSelectedPatient(null);
                setPatients([]);
                setApptInfo(null);
                apptLoadedForFileId.current = null;
                setError("");
                setSuccess("");
                setLookingUp(false);
                setConfirmOpen(false);
                setAlreadyBookedOpen(false);
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
                  setNoBookingAfterLookup(false);
                  if (apptLoadedForFileId.current !== p.fileId) {
                    apptLoadedForFileId.current = null;
                    setApptInfo(null);
                  }
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

      {showNoBooking ? (
        <p className="booking-msg booking-msg--error">
          {t.book.noBookingYet}{" "}
          <a className="booking-msg__phone" href={`tel:${site.phoneTel}`} dir="ltr">
            {site.phoneDisplay}
          </a>
        </p>
      ) : null}

      {showCheckingBookings ? (
        <p className="booking-slots__status">{t.book.loadingSlots}</p>
      ) : null}

      {canBook ? (
      <form onSubmit={onSubmit}>
        <div className="booking-form__grid">
          <label className="booking-field booking-field--full">
            <span>{t.book.clinic}</span>
            <select
              value={clinicId}
              onChange={(e) => setClinicId(e.target.value)}
              disabled={loadingClinics || submitting}
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
              onChange={(e) => {
                const next = e.target.value as SessionType;
                if (next === "retouch" && apptInfo?.hideRetouch) return;
                setSessionType(next);
                setError("");
                setSelectedSs("");
                if (next === "basic" && apptInfo?.hasUnconfirmedFuture) {
                  setAlreadyBookedOpen(true);
                }
              }}
              disabled={submitting}
              required
            >
              <option value="basic">{t.book.sessionBasic}</option>
              {!apptInfo?.hideRetouch ? (
                <option value="retouch">{t.book.sessionRetouch}</option>
              ) : null}
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
              disabled={submitting}
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
              min={dateMin}
              max={dateMax}
              onChange={(e) => setDate(e.target.value)}
              disabled={
                submitting || (sessionType === "retouch" && !retouchWindowOpen)
              }
              required
            />
          </label>
        </div>

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

        {error && !showNoFile ? (
          <p className="booking-msg booking-msg--error">{error}</p>
        ) : null}

        <button
          type="submit"
          className="btn btn--primary btn--lg"
          disabled={
            submitting ||
            loadingSlots ||
            !selectedSs ||
            (sessionType === "retouch" && !retouchWindowOpen)
          }
        >
          {submitting ? t.book.submitting : t.book.submit}
        </button>
      </form>
      ) : null}

      {success ? <p className="booking-msg booking-msg--ok">{success}</p> : null}

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

      {alreadyBookedOpen ? (
        <div
          className="booking-confirm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-already-title"
        >
          <div className="booking-confirm__panel">
            <p id="booking-already-title" className="booking-confirm__text">
              {t.book.alreadyBooked}
            </p>
            <div className="booking-confirm__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setAlreadyBookedOpen(false)}
              >
                {t.book.alreadyBookedOk}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
