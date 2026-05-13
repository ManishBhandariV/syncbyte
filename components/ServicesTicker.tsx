"use client";

import { usePathname } from "next/navigation";

const SERVICES_TEXT =
  "We offer Sales, Service & Support for Biometric Attendance, " +
  "Access Control, Gates Automation, Intrusion Systems, Security Systems, " +
  "CCTV, Biometric & Hotel Locks, Attendance Software, Payroll Software, " +
  "HRMS Software, PMS Software & EPBX.";

export function ServicesTicker() {
  const pathname = usePathname() ?? "/";
  if (pathname.startsWith("/admin")) return null;

  return (
    <div className="services-ticker" aria-label="Services we offer">
      <div className="services-ticker-track">
        {/* duplicated so the marquee loops seamlessly */}
        <span className="services-ticker-item">{SERVICES_TEXT}</span>
        <span className="services-ticker-item" aria-hidden="true">
          {SERVICES_TEXT}
        </span>
      </div>
    </div>
  );
}
