type CTAProps = {
  label: string;
  href?: string;
  note?: string;
  enabled?: boolean;
  preventDefault?: boolean;
};

const SAFE_HREF = /^(#|\/|https?:\/\/|mailto:)/i;

export function CTA({
  label,
  href = "#",
  note,
  enabled = true,
  preventDefault = true,
}: CTAProps) {
  if (!enabled) return null;
  const safeHref = SAFE_HREF.test(href) ? href : "#";

  return (
    <div className="lc-cta">
      <a
        className="lc-btn"
        href={safeHref}
        role="button"
        onClick={(e) => {
          if (preventDefault) e.preventDefault();
        }}
      >
        {label}
      </a>
      {note ? <p className="lc-cta-note">{note}</p> : null}
    </div>
  );
}
