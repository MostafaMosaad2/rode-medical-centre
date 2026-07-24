"use client";

type PhoneNumberProps = {
  display: string;
  tel: string;
  className?: string;
  children?: React.ReactNode;
};

/** Digits always left-to-right in both Arabic and English layouts. */
export function PhoneNumber({
  display,
  tel,
  className,
  children,
}: PhoneNumberProps) {
  return (
    <a href={`tel:${tel}`} className={className}>
      {children}
      <span className="num-ltr" dir="ltr">
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
    <span className={className ? `num-ltr ${className}` : "num-ltr"} dir="ltr">
      {display}
    </span>
  );
}
