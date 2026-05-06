type IconFill = 0 | 1;

interface IconProps {
  name: string;
  title?: string;
  fill?: IconFill;
  className?: string;
}

export function Icon({ name, title, fill = 0, className }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className ?? ''}`}
      style={{ fontVariationSettings: `'FILL' ${fill}, 'wght' 500, 'GRAD' 0, 'opsz' 24` }}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      aria-label={title}
      title={title}
    >
      {name}
    </span>
  );
}

