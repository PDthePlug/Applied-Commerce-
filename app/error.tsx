"use client";
export default function ErrorPage({reset}:{reset:()=>void}){
  return <main className="page"><section className="empty-state"><h1>This page could not be opened.</h1><p>Your saved work has not been cleared. Try again when your connection is available.</p><button type="button" onClick={reset}>Try again</button></section></main>;
}
