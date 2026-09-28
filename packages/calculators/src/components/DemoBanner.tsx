type DemoBannerProps = {
  icon?: string;
  strong: string;
  body: string;
};

/** Demo / illustrative disclaimer — text only, no HTML from CMS. */
export function DemoBanner({ icon = "ℹ️", strong, body }: DemoBannerProps) {
  return (
    <div className="lc-demo-banner" role="note">
      <span aria-hidden="true">{icon}</span>
      <div>
        <strong>{strong}</strong>
        <span>{body}</span>
      </div>
    </div>
  );
}
