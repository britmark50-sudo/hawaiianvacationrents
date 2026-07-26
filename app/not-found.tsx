import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell flex flex-col items-center justify-center py-32 text-center">
      <p className="font-display text-7xl font-semibold text-teal">404</p>
      <h1 className="mt-4 font-display text-3xl font-semibold text-deep">
        This wave washed away.
      </h1>
      <p className="mt-3 max-w-md text-ink/60">
        The page you are looking for does not exist — maybe the listing expired, or the
        address changed.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn-primary">Back home</Link>
        <Link href="/search" className="btn-outline">Browse rentals</Link>
      </div>
    </div>
  );
}
