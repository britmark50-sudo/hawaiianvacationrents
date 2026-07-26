export const SITE_NAME = "Hawaiian Vacation Rents";
export const SITE_TAGLINE = "Hawaii vacation homes, direct from owners";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://hawaiianvacationrents.com";
export const LISTING_PRICE_CENTS = parseInt(process.env.LISTING_PRICE_CENTS || "500", 10);
export const LISTING_DURATION_DAYS = parseInt(process.env.LISTING_DURATION_DAYS || "30", 10);

export const SOCIAL_LINKS = {
  linkedin: "https://www.linkedin.com/in/mizo-titan-814515286",
} as const;
export type TierKey = "BASIC" | "FEATURED" | "PREMIUM";

export const TIER_PRICES: Record<TierKey, number> = {
  BASIC: parseInt(process.env.BASIC_PRICE_CENTS || "500", 10),
  FEATURED: parseInt(process.env.FEATURED_PRICE_CENTS || "2000", 10),
  PREMIUM: parseInt(process.env.PREMIUM_PRICE_CENTS || "5000", 10),
};

export interface TierInfo {
  key: TierKey;
  name: string;
  tagline: string;
  benefits: string[];
  highlight?: boolean;
}

export const TIERS: TierInfo[] = [
  {
    key: "BASIC",
    name: "Basic",
    tagline: "Get listed and reachable",
    benefits: [
      "Full listing page — gallery, map, amenities & direct contact",
      "Standard placement in search results",
      "View & inquiry stats in your dashboard",
    ],
  },
  {
    key: "FEATURED",
    name: "Featured",
    tagline: "Stand out from the crowd",
    highlight: true,
    benefits: [
      "Everything in Basic",
      "Gold “Featured” badge on your listing",
      "Appears above all Basic listings in search, island & town pages",
    ],
  },
  {
    key: "PREMIUM",
    name: "Premium",
    tagline: "Maximum visibility, everywhere",
    benefits: [
      "Everything in Featured",
      "“Premium” badge — top of ALL search results",
      "Homepage showcase placement",
      "First position on island & town pages",
    ],
  },
];

export function isTierKey(k: string): k is TierKey {
  return k === "BASIC" || k === "FEATURED" || k === "PREMIUM";
}
export function tierInfo(key: string | null | undefined): TierInfo {
  return TIERS.find((t) => t.key === key) || TIERS[0];
}
export function tierPriceCents(key: string): number {
  return isTierKey(key) ? TIER_PRICES[key] : TIER_PRICES.BASIC;
}
export function tierRank(key: string | null | undefined): number {
  return key === "PREMIUM" ? 2 : key === "FEATURED" ? 1 : 0;
}

export type IslandSlug = "oahu" | "maui" | "kauai" | "big-island";

export interface IslandInfo {
  slug: IslandSlug;
  name: string;
  nickname: string;
  tagline: string;
  image: string;
  description: string[];
  highlights: string[];
}

export const ISLANDS: IslandInfo[] = [
  {
    slug: "oahu",
    name: "Oʻahu",
    nickname: "The Gathering Place",
    tagline: "Waikīkī sunsets, North Shore surf and big-city energy",
    image: "/seed/lanai.jpg",
    description: [
      "Oʻahu blends the buzz of Honolulu with some of the most iconic coastline in the world. Wake up to Diamond Head views in Waikīkī, spend the afternoon snorkeling Hanauma Bay, and end the day with fresh poke as the sun drops behind the Waiʻanae range.",
      "Vacation rentals here range from high-rise condos steps from Waikīkī Beach to breezy beach houses in Kailua and surf cottages on the legendary North Shore. With the islands' best dining, nightlife and direct flights, Oʻahu is the easiest introduction to Hawaiʻi.",
    ],
    highlights: ["Waikīkī Beach & Diamond Head", "North Shore surf towns", "Kailua & Lanikai beaches", "Pearl Harbor & Honolulu dining"],
  },
  {
    slug: "maui",
    name: "Maui",
    nickname: "The Valley Isle",
    tagline: "Golden resort beaches, the Road to Hāna and Haleakalā sunrises",
    image: "/seed/villa.jpg",
    description: [
      "Maui is Hawaiʻi's honeymoon favorite for a reason: miles of swimmable golden sand on the leeward coast, humpback whales breaching offshore in winter, and a volcano summit where you can watch the sunrise above the clouds.",
      "Stay in an oceanfront condo along Kāʻanapali or Wailea, a plantation-style cottage in up-country Pāʻia, or a private villa with an infinity pool. Rent direct from owners and put the savings toward a Road to Hāna adventure.",
    ],
    highlights: ["Wailea & Kāʻanapali beaches", "Road to Hāna", "Haleakalā National Park", "Winter whale watching"],
  },
  {
    slug: "kauai",
    name: "Kauaʻi",
    nickname: "The Garden Isle",
    tagline: "Emerald cliffs, slow-paced towns and the Nā Pali coast",
    image: "/seed/hero.jpg",
    description: [
      "Kauaʻi is the Hawaiʻi of postcards: the fluted green cliffs of the Nā Pali Coast, the vast red gorge of Waimea Canyon, and one-lane bridges that force you to slow down and wave. It is the island for travelers who want nature first.",
      "Choose a tropical cottage near Hanalei Bay, a cliffside condo in Princeville, or a sunny beach house in Pōipu on the south shore. Most rentals here are owner-operated — exactly the kind of homes you will find listed on this site.",
    ],
    highlights: ["Nā Pali Coast & Hanalei Bay", "Waimea Canyon", "Pōipu Beach south shore", "Wailua River & waterfalls"],
  },
  {
    slug: "big-island",
    name: "Big Island",
    nickname: "The Island of Hawaiʻi",
    tagline: "Volcanoes, black-sand beaches and Kona coffee country",
    image: "/seed/pool.jpg",
    description: [
      "The Island of Hawaiʻi is bigger than all the other islands combined — and feels like several countries in one. Snorkel with manta rays off Kona, walk across still-steaming lava fields in Volcanoes National Park, and stargaze from the slopes of Maunakea.",
      "The sunny Kohala Coast is home to resort-quality vacation homes at down-to-earth prices, while Kona coffee country and the misty town of Volcano offer cottages with real local character.",
    ],
    highlights: ["Hawaiʻi Volcanoes National Park", "Kohala Coast beaches", "Kona coffee farms & manta dives", "Maunakea stargazing"],
  },
];

export interface CityInfo {
  slug: string;
  name: string;
  island: IslandSlug;
  lat: number;
  lng: number;
  blurb: string;
}

export const CITIES: CityInfo[] = [
  { slug: "honolulu", name: "Honolulu", island: "oahu", lat: 21.3069, lng: -157.8583, blurb: "Hawaiʻi's capital — dining, museums and city beaches." },
  { slug: "waikiki", name: "Waikīkī", island: "oahu", lat: 21.2793, lng: -157.8292, blurb: "Iconic beachfront high-rises with Diamond Head views." },
  { slug: "kailua", name: "Kailua", island: "oahu", lat: 21.3972, lng: -157.7394, blurb: "Turquoise water and powder sand at Kailua & Lanikai." },
  { slug: "kaneohe", name: "Kāneʻohe", island: "oahu", lat: 21.4181, lng: -157.8036, blurb: "Lush windward side facing the Koʻolau cliffs." },
  { slug: "haleiwa", name: "Haleʻiwa", island: "oahu", lat: 21.5928, lng: -158.1031, blurb: "North Shore surf town of food trucks and big waves." },
  { slug: "ko-olina", name: "Ko Olina / Kapolei", island: "oahu", lat: 21.3397, lng: -158.1219, blurb: "Calm lagoons and resort living on the sunny west side." },
  { slug: "ewa-beach", name: "ʻEwa Beach", island: "oahu", lat: 21.3156, lng: -158.0072, blurb: "Quiet residential coast minutes from Ko Olina." },
  { slug: "waianae", name: "Waiʻanae", island: "oahu", lat: 21.4447, lng: -158.1897, blurb: "Local west-side coast with wild, uncrowded beaches." },
  { slug: "lahaina", name: "Lahaina", island: "maui", lat: 20.8783, lng: -156.6825, blurb: "Historic whaling town on Maui's sunny west side." },
  { slug: "kaanapali", name: "Kāʻanapali", island: "maui", lat: 20.9289, lng: -156.6944, blurb: "Resort beach famous for Black Rock snorkeling." },
  { slug: "napili", name: "Nāpili", island: "maui", lat: 20.9947, lng: -156.6672, blurb: "Crescent bay loved by families and sea turtles." },
  { slug: "kapalua", name: "Kapalua", island: "maui", lat: 20.9994, lng: -156.6664, blurb: "Upscale golf-and-beach enclave in West Maui." },
  { slug: "kihei", name: "Kīhei", island: "maui", lat: 20.7644, lng: -156.445, blurb: "Six miles of beaches and Maui's best value condos." },
  { slug: "wailea", name: "Wailea", island: "maui", lat: 20.6899, lng: -156.4422, blurb: "Manicured luxury resort coast in South Maui." },
  { slug: "paia", name: "Pāʻia", island: "maui", lat: 20.9031, lng: -156.3697, blurb: "Bohemian north-shore town at the start of the Hāna road." },
  { slug: "hana", name: "Hāna", island: "maui", lat: 20.7581, lng: -155.9903, blurb: "Remote east Maui — waterfalls, jungle and calm." },
  { slug: "lihue", name: "Līhuʻe", island: "kauai", lat: 21.9811, lng: -159.3711, blurb: "Kauaʻi's hub, close to Kalapakī Beach and the airport." },
  { slug: "kapaa", name: "Kapaʻa", island: "kauai", lat: 22.0881, lng: -159.338, blurb: "East-side coconut coast with a beachfront bike path." },
  { slug: "princeville", name: "Princeville", island: "kauai", lat: 22.2236, lng: -159.4853, blurb: "Clifftop resort community above Hanalei Bay." },
  { slug: "hanalei", name: "Hanalei", island: "kauai", lat: 22.2036, lng: -159.5017, blurb: "Storybook bay ringed by waterfalls and taro fields." },
  { slug: "poipu", name: "Pōipu", island: "kauai", lat: 21.8786, lng: -159.4657, blurb: "Sunny south shore — beaches, turtles and resorts." },
  { slug: "koloa", name: "Kōloa", island: "kauai", lat: 21.9058, lng: -159.4694, blurb: "Historic plantation town minutes from Pōipu." },
  { slug: "waimea-kauai", name: "Waimea", island: "kauai", lat: 21.9569, lng: -159.6717, blurb: "Gateway to Waimea Canyon on the quiet west side." },
  { slug: "kailua-kona", name: "Kailua-Kona", island: "big-island", lat: 19.64, lng: -155.9969, blurb: "Sunny Kona coast — coffee, snorkeling and sunsets." },
  { slug: "waikoloa", name: "Waikoloa", island: "big-island", lat: 19.9372, lng: -155.7887, blurb: "Kohala Coast resorts and A-Bay's golden sand." },
  { slug: "waimea-big-island", name: "Waimea (Kamuela)", island: "big-island", lat: 20.0214, lng: -155.6659, blurb: "Cool up-country ranch town between the coasts." },
  { slug: "hilo", name: "Hilo", island: "big-island", lat: 19.7297, lng: -155.09, blurb: "Rainforest city of waterfalls and farmers markets." },
  { slug: "volcano", name: "Volcano", island: "big-island", lat: 19.4428, lng: -155.234, blurb: "Misty fern-forest village beside the national park." },
  { slug: "captain-cook", name: "Captain Cook", island: "big-island", lat: 19.4969, lng: -155.92, blurb: "Kona coffee country above Kealakekua Bay." },
  { slug: "pahoa", name: "Pāhoa", island: "big-island", lat: 19.4942, lng: -154.945, blurb: "Off-grid charm in lush lower Puna." },
];

export const PROPERTY_TYPES = [
  { key: "house", label: "House" },
  { key: "condo", label: "Condo" },
  { key: "villa", label: "Villa" },
  { key: "cottage", label: "Cottage" },
  { key: "studio", label: "Studio" },
  { key: "townhouse", label: "Townhouse" },
] as const;

export const AMENITIES = [
  { key: "beachfront", label: "Beachfront" },
  { key: "ocean-view", label: "Ocean view" },
  { key: "pool", label: "Private pool" },
  { key: "hot-tub", label: "Hot tub" },
  { key: "ac", label: "Air conditioning" },
  { key: "wifi", label: "Fast Wi-Fi" },
  { key: "kitchen", label: "Full kitchen" },
  { key: "washer-dryer", label: "Washer & dryer" },
  { key: "parking", label: "Free parking" },
  { key: "lanai", label: "Lanai / balcony" },
  { key: "bbq", label: "BBQ grill" },
  { key: "beach-gear", label: "Beach gear included" },
  { key: "ev-charger", label: "EV charger" },
  { key: "pet-friendly", label: "Pet friendly" },
  { key: "family-friendly", label: "Family friendly" },
  { key: "workspace", label: "Dedicated workspace" },
] as const;

export const REPORT_REASONS = [
  { key: "scam", label: "Suspected scam or fraud" },
  { key: "inaccurate", label: "Inaccurate or misleading listing" },
  { key: "unavailable", label: "Property not actually available" },
  { key: "inappropriate", label: "Inappropriate content or photos" },
  { key: "other", label: "Other" },
] as const;

export const BLOG_CATEGORIES = [
  { key: "travel-guide", label: "Travel Guides" },
  { key: "beaches", label: "Beaches" },
  { key: "activities", label: "Activities" },
  { key: "restaurants", label: "Food & Restaurants" },
  { key: "tips", label: "Travel Tips" },
] as const;

export const LEGAL_SLUGS = ["about-us", "privacy-policy", "terms-of-service", "disclaimer"] as const;

export function islandBySlug(slug: string): IslandInfo | undefined {
  return ISLANDS.find((i) => i.slug === slug);
}
export function citiesForIsland(island: string): CityInfo[] {
  return CITIES.filter((c) => c.island === island);
}
export function cityBySlug(slug: string): CityInfo | undefined {
  return CITIES.find((c) => c.slug === slug);
}
export function amenityLabel(key: string): string {
  return AMENITIES.find((a) => a.key === key)?.label || key;
}
export function typeLabel(key: string): string {
  return PROPERTY_TYPES.find((t) => t.key === key)?.label || key;
}
export function categoryLabel(key: string): string {
  return BLOG_CATEGORIES.find((c) => c.key === key)?.label || key;
}
export function isIslandSlug(s: string): s is IslandSlug {
  return ISLANDS.some((i) => i.slug === s);
}
