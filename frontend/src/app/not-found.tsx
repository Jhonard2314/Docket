import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state">
      <span className="eyebrow">404 · OFF THE PAPER TRAIL</span>
      <h1>This page is missing.</h1>
      <p>Let’s get you back to your workspace.</p>
      <Link href="/dashboard" className="button primary">
        Back to overview
      </Link>
    </div>
  );
}
