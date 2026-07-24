import { DoctorsPreview } from "@/components/DoctorsPreview";
import { Hero } from "@/components/Hero";
import { Reviews } from "@/components/Reviews";
import { ServicesPreview } from "@/components/ServicesPreview";
import { VisitCta } from "@/components/VisitCta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesPreview />
      <DoctorsPreview />
      <Reviews />
      <VisitCta />
    </>
  );
}
