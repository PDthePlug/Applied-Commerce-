import Link from "next/link";

export function Brand({compact=false}:{compact?:boolean}) {
  return <Link className="brand" href="/" aria-label="Applied Commerce home">
    <span className="brand-mark" aria-hidden="true">AC</span>
    <span className="brand-type"><strong>Applied Commerce</strong>{!compact && <small>Learning Platform</small>}</span>
  </Link>;
}
