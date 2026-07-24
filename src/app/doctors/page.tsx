"use client";

import { DoctorCard } from "@/components/DoctorCard";
import { doctorDepartments, doctors } from "@/lib/doctors";
import { useI18n } from "@/lib/i18n";

export default function DoctorsPage() {
  const { t, locale } = useI18n();

  return (
    <>
      <section className="page-hero reveal">
        <p className="section__eyebrow">{t.nav.doctors}</p>
        <h1>{t.doctors.title}</h1>
        <p>{t.doctors.support}</p>
      </section>

      <section className="section" style={{ paddingTop: "1.5rem" }}>
        <div className="doctor-directory">
          {doctorDepartments.map((department) => {
            const members = doctors.filter(
              (doctor) => doctor.department === department.id,
            );
            if (members.length === 0) return null;

            return (
              <div key={department.id} className="doctor-department reveal">
                <div className="doctor-department__head">
                  <h2>
                    {locale === "ar" ? department.titleAr : department.titleEn}
                  </h2>
                  <p>
                    {members.length}{" "}
                    {locale === "ar" ? t.doctors.membersAr : t.doctors.membersEn}
                  </p>
                </div>
                <div className="doctor-grid">
                  {members.map((doctor, index) => (
                    <DoctorCard
                      key={doctor.id}
                      doctor={doctor}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
