export function MapTocLogo({ className = "size-9" }: { className?: string }) {
  return (
    <svg className={`maptoc-vector ${className}`} width="36" height="36" viewBox="0 0 80 80" shapeRendering="geometricPrecision" aria-hidden="true">
      <g fill="none" stroke="#40af81" strokeWidth="7" strokeLinecap="round">
        <path d="M13 60L43 30L66 17M43 30L63 69" />
      </g>
      <g fill="#40af81">
        <circle cx="13" cy="60" r="11" />
        <circle cx="43" cy="30" r="11" />
        <circle cx="66" cy="17" r="11" />
        <circle cx="63" cy="69" r="11" />
      </g>
    </svg>
  );
}
