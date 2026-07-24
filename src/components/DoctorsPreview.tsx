"use client";

import Link from "next/link";
import { DoctorCard } from "@/components/DoctorCard";
import { featuredDoctors } from "@/lib/doctors";
import { useI18n } from "@/lib/i18n";

export function DoctorsPreview() {
  const { t } = useI18n();
  const preview = featuredDoctors.slice(0, 6);

  return (
    <section className="section section--soft">
      <div className="section__intro reveal">
        <p className="section__eyebrow">{t.home.doctorsEyebrow}</p>
        <h2>{t.home.doctorsTitle}</h2>
        <p>{t.home.doctorsSupport}</p>
      </div>
      <div className="doctor-grid">
        {preview.map((doctor, index) => (
          <DoctorCard key={doctor.id} doctor={doctor} index={index} />
        ))}
      </div>
      <div className="section__cta reveal">
        <Link className="btn btn--ghost" href="/doctors">
          {t.cta.viewDoctors}
        </Link>
      </div>
    </section>
  );
}
