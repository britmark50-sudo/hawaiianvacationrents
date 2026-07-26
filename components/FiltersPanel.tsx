import { SlidersHorizontal } from "lucide-react";
import { AMENITIES, CITIES, ISLANDS, PROPERTY_TYPES } from "@/lib/constants";

export interface FilterValues {
  island?: string;
  city?: string;
  q?: string;
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  bedrooms?: string;
  guests?: string;
  amenities: string[];
  sort?: string;
}

export function FiltersPanel({ values }: { values: FilterValues }) {
  const cities = values.island ? CITIES.filter((c) => c.island === values.island) : CITIES;

  return (
    <details className="card group h-fit overflow-hidden lg:!block lg:open:!block" open>
      <summary className="flex cursor-pointer items-center gap-2 border-b border-deep/10 px-6 py-4 font-display text-lg font-semibold text-deep lg:cursor-default [&::-webkit-details-marker]:hidden">
        <SlidersHorizontal className="h-4 w-4 text-teal" /> Filters
      </summary>
      <form method="GET" action="/search" className="space-y-5 px-6 py-5">
        {values.sort ? <input type="hidden" name="sort" value={values.sort} /> : null}

        <div>
          <label className="label" htmlFor="f-q">Keyword</label>
          <input id="f-q" name="q" defaultValue={values.q} placeholder="Beachfront, Wailea…" className="input" />
        </div>

        <div>
          <label className="label" htmlFor="f-island">Island</label>
          <select id="f-island" name="island" defaultValue={values.island || ""} className="input">
            <option value="">Any island</option>
            {ISLANDS.map((i) => (
              <option key={i.slug} value={i.slug}>{i.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="f-city">Town / area</label>
          <select id="f-city" name="city" defaultValue={values.city || ""} className="input">
            <option value="">Any town</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="f-type">Property type</label>
          <select id="f-type" name="type" defaultValue={values.type || ""} className="input">
            <option value="">Any type</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="f-min">Min $/night</label>
            <input id="f-min" name="minPrice" type="number" min="0" defaultValue={values.minPrice} placeholder="0" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="f-max">Max $/night</label>
            <input id="f-max" name="maxPrice" type="number" min="0" defaultValue={values.maxPrice} placeholder="Any" className="input" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="f-bedrooms">Bedrooms</label>
            <select id="f-bedrooms" name="bedrooms" defaultValue={values.bedrooms || ""} className="input">
              <option value="">Any</option>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}+</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="f-guests">Guests</label>
            <select id="f-guests" name="guests" defaultValue={values.guests || ""} className="input">
              <option value="">Any</option>
              {[1, 2, 4, 6, 8, 10, 12].map((n) => (
                <option key={n} value={n}>{n}+</option>
              ))}
            </select>
          </div>
        </div>

        <fieldset>
          <legend className="label">Amenities</legend>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {AMENITIES.map((a) => (
              <label key={a.key} className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-sm text-ink/75 hover:bg-sand">
                <input
                  type="checkbox"
                  name="amenities"
                  value={a.key}
                  defaultChecked={values.amenities.includes(a.key)}
                  className="h-4 w-4 rounded border-deep/30 accent-teal"
                />
                {a.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex items-center gap-3 border-t border-deep/10 pt-5">
          <button type="submit" className="btn-primary flex-1 !py-2.5">Apply filters</button>
          <a href="/search" className="text-sm font-semibold text-ink/50 hover:text-deep">Reset</a>
        </div>
      </form>
    </details>
  );
}
