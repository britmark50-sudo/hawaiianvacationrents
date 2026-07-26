import { Search } from "lucide-react";
import { ISLANDS } from "@/lib/constants";

const PRICES = [100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000];

export function SearchBar() {
  return (
    <form
      action="/search"
      method="GET"
      className="mt-9 w-full max-w-3xl rounded-2xl bg-white/95 p-2.5 text-left shadow-lift backdrop-blur"
    >
      <div className="grid items-center gap-2 sm:grid-cols-[1.2fr_1fr_1fr_auto]">
        <label className="block border-deep/10 px-3 py-1.5 sm:border-r">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-deep/45">
            Island
          </span>
          <select name="island" className="w-full bg-transparent py-1 text-sm font-medium text-deep outline-none">
            <option value="">Any island</option>
            {ISLANDS.map((i) => (
              <option key={i.slug} value={i.slug}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block border-deep/10 px-3 py-1.5 sm:border-r">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-deep/45">
            Guests
          </span>
          <select name="guests" className="w-full bg-transparent py-1 text-sm font-medium text-deep outline-none">
            <option value="">Any</option>
            {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
              <option key={n} value={n}>
                {n}+ guests
              </option>
            ))}
          </select>
        </label>
        <label className="block px-3 py-1.5">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-deep/45">
            Max price / night
          </span>
          <select name="maxPrice" className="w-full bg-transparent py-1 text-sm font-medium text-deep outline-none">
            <option value="">Any price</option>
            {PRICES.map((p) => (
              <option key={p} value={p}>
                Up to ${p}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-primary m-1 !rounded-xl !px-7 !py-3.5">
          <Search className="h-4 w-4" />
          Search
        </button>
      </div>
    </form>
  );
}
