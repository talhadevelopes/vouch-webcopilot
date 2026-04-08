import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container">
      <div className="card">
        <h1>Vouch Web App</h1>
        <p>Phase 1 foundation is ready. Continue to login and open dashboard.</p>
        <p>
          <Link href="/login">Go to Login</Link>
        </p>
      </div>
    </main>
  );
}
