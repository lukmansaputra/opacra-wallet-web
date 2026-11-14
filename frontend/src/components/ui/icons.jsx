/**
 * Ikon SVG inline (gaya stroke, ala Lucide) — pengganti emoji / simbol
 * dekoratif. Semua ikon memakai stroke="currentColor" sehingga warnanya
 * mengikuti teks induk.
 */

function base({ size = 20, strokeWidth = 1.8, children, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconWallet(props) {
  return base({
    ...props,
    children: (
      <>
        <path d="M19 7V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        <path d="M16 13h.01" />
        <path d="M3 7a2 2 0 0 1 2-2h12v4H5a2 2 0 0 0-2 2v7" />
        <path d="M16 11h3a1.5 1.5 0 0 1 0 3h-3" />
      </>
    ),
  });
}

export function IconSend(props) {
  return base({
    ...props,
    children: (
      <>
        <path d="M7 17 17 7" />
        <path d="M8 7h9v9" />
      </>
    ),
  });
}

export function IconReceive(props) {
  return base({
    ...props,
    children: (
      <>
        <path d="M17 7 7 17" />
        <path d="M16 17H7V8" />
      </>
    ),
  });
}

export function IconEye(props) {
  return base({
    ...props,
    children: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  });
}

export function IconEyeOff(props) {
  return base({
    ...props,
    children: (
      <>
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3.5 7 10 7a9.59 9.59 0 0 0 5.39-1.61" />
        <path d="m2 2 20 20" />
      </>
    ),
  });
}

export function IconCopy(props) {
  return base({
    ...props,
    children: (
      <>
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </>
    ),
  });
}

export function IconCheck(props) {
  return base({
    ...props,
    children: <path d="M20 6 9 17l-5-5" />,
  });
}

export function IconRefresh(props) {
  return base({
    ...props,
    children: (
      <>
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <path d="M21 3v6h-6" />
      </>
    ),
  });
}

export function IconHome(props) {
  return base({
    ...props,
    children: (
      <>
        <path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        <path d="M9 22V12h6v10" />
      </>
    ),
  });
}

export function IconClock(props) {
  return base({
    ...props,
    children: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </>
    ),
  });
}

export function IconCpu(props) {
  return base({
    ...props,
    children: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <path d="M15 2v2M15 20v2M9 2v2M9 20v2M2 15h2M2 9h2M20 15h2M20 9h2" />
      </>
    ),
  });
}

export function IconSettings(props) {
  return base({
    ...props,
    children: (
      <>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
  });
}

export function IconLogout(props) {
  return base({
    ...props,
    children: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </>
    ),
  });
}

export function IconChevronRight(props) {
  return base({
    ...props,
    children: <path d="m9 18 6-6-6-6" />,
  });
}

export function IconChevronLeft(props) {
  return base({
    ...props,
    children: <path d="m15 18-6-6 6-6" />,
  });
}

export function IconX(props) {
  return base({
    ...props,
    children: <path d="M18 6 6 18M6 6l12 12" />,
  });
}

export function IconPlus(props) {
  return base({
    ...props,
    children: <path d="M5 12h14M12 5v14" />,
  });
}

export function IconServer(props) {
  return base({
    ...props,
    children: (
      <>
        <rect x="2" y="2" width="20" height="8" rx="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" />
        <path d="M6 6h.01M6 18h.01" />
      </>
    ),
  });
}

export function IconImport(props) {
  return base({
    ...props,
    children: (
      <>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </>
    ),
  });
}

export function IconAlertTriangle(props) {
  return base({
    ...props,
    children: (
      <>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    ),
  });
}

export function IconInfo(props) {
  return base({
    ...props,
    children: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </>
    ),
  });
}
