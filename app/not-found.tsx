import Link from "next/link";
export default function NotFound(){return <div className="page empty-state"><h1>That learning page was not found.</h1><p>The curriculum route may not exist in the supplied learner-book map.</p><Link className="primary-button" href="/learn">Back to curriculum</Link></div>}
