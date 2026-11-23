"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state">
      <h2>Something interrupted your workspace.</h2>
      <p>Please try again in a moment.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
