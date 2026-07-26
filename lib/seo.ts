import { SITE_NAME, SITE_URL } from "@/lib/constants";

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function propertyJsonLd(p: {
  title: string;
  description: string;
  slug: string;
  city: string;
  island: string;
  lat: number | null;
  lng: number | null;
  pricePerNight: number;
  bedrooms: number;
  maxGuests: number;
  photos: { url: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    name: p.title,
    description: p.description.slice(0, 300),
    url: `${SITE_URL}/rentals/${p.slug}`,
    image: p.photos.map((ph) => (ph.url.startsWith("http") ? ph.url : `${SITE_URL}${ph.url}`)),
    address: {
      "@type": "PostalAddress",
      addressLocality: p.city,
      addressRegion: "HI",
      addressCountry: "US",
    },
    ...(p.lat && p.lng
      ? { geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng } }
      : {}),
    numberOfRooms: p.bedrooms,
    occupancy: { "@type": "QuantitativeValue", maxValue: p.maxGuests },
    offers: {
      "@type": "Offer",
      price: p.pricePerNight,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };
}

export function blogPostJsonLd(post: { title: string; excerpt: string; slug: string; publishedAt: Date; coverImage: string | null }) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    url: `${SITE_URL}/blog/${post.slug}`,
    datePublished: post.publishedAt.toISOString(),
    ...(post.coverImage ? { image: [`${SITE_URL}${post.coverImage}`] } : {}),
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
}
