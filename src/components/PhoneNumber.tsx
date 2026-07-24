"use client";

type PhoneNumberProps = {
  display: string;
  tel: string;
  className?: string;
  children?: React.ReactNode;
};

/** Keeps digit order readable right-to-left in both AR and EN layouts. */
export function PhoneNumber({
  display,
  tel,
  className,
  children,
}: PhoneNumberProps) {
  return (
    <a href={`tel:${tel}`} className={className}>
      {children}
      <span className="phone-rtl" dir="rtl">
        {display}
      </span>
    </a>
  );
}

export function PhoneText({
  display,
  className,
}: {
  display: string;
  className?: string;
}) {
  return (
    <span className={className ? `phone-rtl ${className}` : "phone-rtl"} dir="rtl">
      {display}
    </span>
  );
}
