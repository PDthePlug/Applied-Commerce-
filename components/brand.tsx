import Link from "next/link";

export function Brand({
  compact=false,
  href="/",
  subtitle="Learning Platform",
}:{compact?:boolean;href?:string;subtitle?:string}) {
  return <Link className="brand" href={href}>
    <span className="brand-mark" aria-hidden="true">AC</span>
    <span className="brand-type"><strong>Applied Commerce</strong>{!compact && <small>{subtitle}</small>}</span>
  </Link>;
}
