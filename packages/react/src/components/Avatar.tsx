import type { HTMLAttributes, ReactElement } from "react";

export type AvatarProps = HTMLAttributes<HTMLSpanElement> & {
  alt?: string;
  initials?: string;
  name: string;
  src?: string;
};

function initialsFor(name: string): string {
  return name
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Avatar({ alt, className, initials, name, src, ...props }: AvatarProps): ReactElement {
  const classNames = ["ag-avatar", className].filter(Boolean).join(" ");
  const label = alt ?? name;

  return (
    <span aria-label={label} className={classNames} role="img" {...props}>
      {src ? <img alt="" className="ag-avatar__image" src={src} /> : <span className="ag-avatar__initials">{initials ?? initialsFor(name)}</span>}
    </span>
  );
}
