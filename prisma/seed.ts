import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";
import { readFileSync } from "fs";
import path from "path";
import { CITIES, ISLANDS, AMENITIES, PROPERTY_TYPES } from "../lib/constants";

const prisma = new PrismaClient();
const DAY = 86400000;
const TIER_PRICE: Record<string, number> = { BASIC: 500, FEATURED: 2000, PREMIUM: 5000 };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['‘’ʻ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function city(slug: string) {
  const c = CITIES.find((x) => x.slug === slug);
  if (!c) throw new Error("Unknown city " + slug);
  return c;
}

function searchTextFor(title: string, citySlug: string, type: string, amenities: string[]) {
  const c = city(citySlug);
  const islandName = ISLANDS.find((i) => i.slug === c.island)?.name || c.island;
  const typeLabel = PROPERTY_TYPES.find((t) => t.key === type)?.label || type;
  const amenLabels = amenities.map((a) => AMENITIES.find((x) => x.key === a)?.label || a);
  return [title, c.name, islandName, c.island.replace("-", " "), typeLabel, ...amenLabels]
    .join(" ")
    .toLowerCase();
}

interface SeedListing {
  title: string;
  citySlug: string;
  type: string;
  price: number;
  bd: number;
  ba: number;
  guests: number;
  minNights?: number;
  amenities: string[];
  license?: string;
  desc: string;
  photos: string[];
  owner: number;
  tier?: "BASIC" | "FEATURED" | "PREMIUM";
  views: number;
  clicks: number;
  publishedDaysAgo: number;
  expiresInDays: number;
}

const LISTINGS: SeedListing[] = [
  {
    title: "Diamond Head View Condo Steps from Waikīkī Beach",
    citySlug: "waikiki", type: "condo", price: 289, bd: 1, ba: 1, guests: 4, minNights: 3,
    amenities: ["ocean-view", "ac", "wifi", "kitchen", "lanai", "washer-dryer", "family-friendly"],
    license: "TA-038-712-3456-01",
    desc: "Wake up to Diamond Head glowing in the morning light from your private lanai on the 22nd floor. This fully renovated one-bedroom condo puts you two minutes from the sand of Waikīkī Beach, with the best of Kalākaua Avenue at your doorstep.\n\nInside you'll find a full kitchen, split AC in every room, fast Wi-Fi for remote work, and a king bed with hotel-quality linens. The building offers a heated pool, BBQ deck and secured parking. Perfect for couples or a small family who want the classic Waikīkī experience without resort fees.",
    photos: ["/seed/lanai.jpg", "/seed/bedroom.jpg", "/seed/living.jpg"],
    owner: 2, views: 742, clicks: 58, publishedDaysAgo: 9, expiresInDays: 21,
  },
  {
    title: "Lanikai-Style Beach House with Private Pool in Kailua",
    citySlug: "kailua", type: "house", price: 675, bd: 4, ba: 3, guests: 10, minNights: 4,
    amenities: ["pool", "beachfront", "ac", "wifi", "kitchen", "washer-dryer", "parking", "bbq", "beach-gear", "family-friendly"],
    license: "TA-141-882-9012-01",
    desc: "A five-minute barefoot walk from the powder-white sand of Kailua Beach, this four-bedroom island home sleeps ten across two breezy floors. The backyard is built for Hawaiʻi living: saltwater pool, covered lanai with dining for twelve, and a gas BBQ under the palms.\n\nWe stock the garage with boogie boards, beach chairs, coolers and two adult bikes — everything you need for a proper windward-side vacation. Kailua town's farmers market, coffee shops and famous macadamia pancakes are all within a short drive.",
    photos: ["/seed/pool.jpg", "/seed/living.jpg", "/seed/bedroom.jpg", "/seed/villa.jpg"],
    owner: 2, tier: "FEATURED", views: 1204, clicks: 96, publishedDaysAgo: 18, expiresInDays: 12,
  },
  {
    title: "North Shore Surf Cottage near Haleʻiwa Town",
    citySlug: "haleiwa", type: "cottage", price: 245, bd: 2, ba: 1, guests: 5,
    amenities: ["wifi", "kitchen", "parking", "bbq", "beach-gear", "pet-friendly", "lanai"],
    desc: "Our plantation-style cottage sits under mango trees a short bike ride from Haleʻiwa's food trucks and surf breaks. Winter brings world-class waves at Pipeline and Sunset; summer means glassy snorkeling at Sharks Cove.\n\nThe cottage is simple, clean and full of aloha — two bedrooms, a well-stocked kitchen, outdoor shower for sandy feet, and a lanai made for evening guitar sessions. Dogs are welcome with prior approval.",
    photos: ["/seed/cottage.jpg", "/seed/bedroom.jpg", "/seed/pool.jpg"],
    owner: 0, views: 431, clicks: 37, publishedDaysAgo: 5, expiresInDays: 25,
  },
  {
    title: "Wailea Oceanfront Villa with Infinity Pool",
    citySlug: "wailea", type: "villa", price: 1150, bd: 5, ba: 5.5, guests: 12, minNights: 5,
    amenities: ["beachfront", "ocean-view", "pool", "hot-tub", "ac", "wifi", "kitchen", "washer-dryer", "parking", "lanai", "bbq", "ev-charger", "workspace"],
    license: "STMA-2025-0448",
    desc: "Perched above the sand in Wailea's most exclusive enclave, this five-suite villa was designed to erase the line between inside and out. Pocket doors open the great room to a 60-foot infinity edge pool that seems to pour into the Pacific, with Molokini and Kahoʻolawe on the horizon.\n\nEvery suite has ocean views and a spa-grade bathroom. The chef's kitchen features double islands and Sub-Zero refrigeration; the primary suite adds an outdoor lava-rock shower. Whale season (December–April) turns the lanai into front-row seats. Concierge, private chef and in-villa massage available on request.",
    photos: ["/seed/villa.jpg", "/seed/pool.jpg", "/seed/living.jpg", "/seed/bedroom.jpg"],
    owner: 1, tier: "PREMIUM", views: 2318, clicks: 141, publishedDaysAgo: 22, expiresInDays: 8,
  },
  {
    title: "Kāʻanapali Golf Course Condo with Sunset Lanai",
    citySlug: "kaanapali", type: "condo", price: 395, bd: 2, ba: 2, guests: 6, minNights: 3,
    amenities: ["ocean-view", "pool", "ac", "wifi", "kitchen", "washer-dryer", "parking", "lanai", "family-friendly"],
    license: "TA-201-334-7788-01",
    desc: "Watch the sun drop behind Lānaʻi from your west-facing lanai overlooking the Royal Kāʻanapali golf course. This two-bedroom, two-bath condo is a five-minute stroll from Kāʻanapali Beach and Whalers Village shopping.\n\nThe resort complex offers two pools, tennis and pickleball courts, and gas grills by the koi ponds. Inside: full kitchen, AC throughout, in-unit laundry and a dedicated parking stall. Ideal for families splitting time between the beach and the fairway.",
    photos: ["/seed/lanai.jpg", "/seed/living.jpg", "/seed/pool.jpg"],
    owner: 1, views: 655, clicks: 44, publishedDaysAgo: 12, expiresInDays: 18,
  },
  {
    title: "Pāʻia Garden Studio — Walk to Baldwin Beach",
    citySlug: "paia", type: "studio", price: 179, bd: 0, ba: 1, guests: 2, minNights: 2,
    amenities: ["wifi", "kitchen", "parking", "lanai", "workspace", "beach-gear"],
    desc: "A bright private studio tucked into a tropical garden on the edge of Pāʻia, Maui's favorite bohemian beach town. You're a seven-minute walk from Baldwin Beach and two blocks from the best fish tacos on the island.\n\nThe studio has its own entrance, kitchenette, rainfall shower, fast fiber Wi-Fi and a writing desk facing the garden — a favorite with remote workers doing a Maui month. Boogie boards, towels and a cooler are in the closet. Start the Road to Hāna from your driveway.",
    photos: ["/seed/cottage.jpg", "/seed/bedroom.jpg"],
    owner: 0, views: 389, clicks: 29, publishedDaysAgo: 3, expiresInDays: 27,
  },
  {
    title: "Hanalei Bay Tropical Cottage with Mountain Views",
    citySlug: "hanalei", type: "cottage", price: 320, bd: 2, ba: 2, guests: 4, minNights: 3,
    amenities: ["wifi", "kitchen", "parking", "lanai", "bbq", "beach-gear", "family-friendly"],
    license: "TVNC-5123",
    desc: "Fall asleep to rain on a tin roof and wake to waterfalls striping the mountains behind Hanalei. Our cedar cottage sits on a quiet lane a four-minute walk from the pier end of Hanalei Bay — arguably the most beautiful beach in Hawaiʻi.\n\nTwo bedrooms with vaulted ceilings, a full kitchen with local coffee waiting, and a wraparound lanai with hammock chairs. Surfboards, SUP and beach gear included. Town's poke shops, taro fields and Tahiti Nui mai tais are all steps away.",
    photos: ["/seed/cottage.jpg", "/seed/hero.jpg", "/seed/bedroom.jpg"],
    owner: 0, tier: "FEATURED", views: 1467, clicks: 112, publishedDaysAgo: 15, expiresInDays: 15,
  },
  {
    title: "Princeville Cliffside Condo Overlooking the Pacific",
    citySlug: "princeville", type: "condo", price: 359, bd: 2, ba: 2, guests: 6, minNights: 3,
    amenities: ["ocean-view", "pool", "wifi", "kitchen", "washer-dryer", "parking", "lanai", "hot-tub"],
    license: "TVNC-4877",
    desc: "From the lanai of this bluff-top condo you can watch whales breach in winter and the sun sink into the Pacific year-round. Located in Princeville's most loved oceanfront complex, with a cliff-edge pool and hot tub shared by just a handful of units.\n\nThe condo sleeps six with a king suite, twin room and queen sofa bed. Full kitchen, washer/dryer and beach gear in the closet. Hanalei town and Queen's Bath are minutes away; the Nā Pali Coast trailhead is a scenic 15-minute drive.",
    photos: ["/seed/lanai.jpg", "/seed/hero.jpg", "/seed/living.jpg"],
    owner: 2, views: 823, clicks: 61, publishedDaysAgo: 20, expiresInDays: 10,
  },
  {
    title: "Pōipu Sunny Beach House with Pool — South Shore Kauaʻi",
    citySlug: "poipu", type: "house", price: 498, bd: 3, ba: 2.5, guests: 8, minNights: 4,
    amenities: ["pool", "ocean-view", "ac", "wifi", "kitchen", "washer-dryer", "parking", "bbq", "beach-gear", "family-friendly"],
    license: "TVNC-5310",
    desc: "Pōipu is Kauaʻi's sunniest corner, and this three-bedroom home soaks it up around a private heated pool. Monk seals and green sea turtles haul out on Pōipu Beach, a six-minute walk down the lane.\n\nThe open-plan living area flows to a covered outdoor kitchen with BBQ and bar seating. AC in every bedroom (rare for Kauaʻi!), a garage full of beach toys, and snorkel reefs, shave ice and the famous Puka Dog all within a mile.",
    photos: ["/seed/pool.jpg", "/seed/villa.jpg", "/seed/bedroom.jpg"],
    owner: 2, views: 934, clicks: 73, publishedDaysAgo: 7, expiresInDays: 23,
  },
  {
    title: "Mauna Lani Luxury Ocean Home on the Kohala Coast",
    citySlug: "waikoloa", type: "house", price: 890, bd: 4, ba: 4, guests: 10, minNights: 4,
    amenities: ["ocean-view", "pool", "hot-tub", "ac", "wifi", "kitchen", "washer-dryer", "parking", "lanai", "bbq", "ev-charger"],
    license: "STVR-19-0327",
    desc: "Lava rock, koa wood and endless ocean: this four-suite home inside the Mauna Lani resort captures everything people love about the Kohala Coast. The great room opens completely to a heated pool and spa framed by black lava gardens, with some of the best year-round weather in the state.\n\nGuests get resort beach club access, two golf championship courses next door, and manta ray night dives ten minutes away in Kona. The kitchen is chef-ready; the EV charger and owner's Tesla recommendations are a bonus.",
    photos: ["/seed/villa.jpg", "/seed/living.jpg", "/seed/pool.jpg", "/seed/bedroom.jpg"],
    owner: 1, tier: "PREMIUM", views: 1102, clicks: 84, publishedDaysAgo: 11, expiresInDays: 19,
  },
  {
    title: "Kona Coffee Country Cottage above Kealakekua Bay",
    citySlug: "captain-cook", type: "cottage", price: 199, bd: 1, ba: 1, guests: 3, minNights: 2,
    amenities: ["ocean-view", "wifi", "kitchen", "parking", "lanai", "workspace", "pet-friendly"],
    desc: "Perched at 1,400 feet on a working Kona coffee farm, this cedar cottage looks straight down the slope to Kealakekua Bay — where you'll snorkel with dolphins in the morning and taste our estate roast in the afternoon.\n\nOne airy bedroom, a full kitchen stocked with farm eggs and bananas, and a lanai built for sunset. Cooler up-slope temperatures mean no AC needed. Ten minutes to the bay, twenty to Kailua-Kona town. Well-behaved dogs welcome.",
    photos: ["/seed/cottage.jpg", "/seed/hero.jpg"],
    owner: 0, views: 356, clicks: 31, publishedDaysAgo: 4, expiresInDays: 26,
  },
  {
    title: "Volcano Rainforest Retreat near the National Park",
    citySlug: "volcano", type: "cottage", price: 165, bd: 2, ba: 1, guests: 4, minNights: 2,
    amenities: ["wifi", "kitchen", "parking", "family-friendly", "workspace"],
    desc: "Wrapped in hāpuʻu ferns and ʻōhiʻa forest, this warm timber cottage sits five minutes from the entrance to Hawaiʻi Volcanoes National Park. Spend the day at Kīlauea's crater rim and lava tubes, then come home to a wood stove, board games and the sound of native birds.\n\nTwo cozy bedrooms, full kitchen with local Volcano-grown tea, and blankets for the crisp 3,700-foot nights. If the volcano is glowing, the night-sky viewing spot is a short drive — we'll point you to it.",
    photos: ["/seed/cottage.jpg", "/seed/living.jpg"],
    owner: 1, views: 289, clicks: 22, publishedDaysAgo: 2, expiresInDays: 28,
  },
];

async function main() {
  console.log("🌺 Seeding Hawaiian Vacation Rents…");

  await prisma.report.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.property.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.page.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword("Aloha2026!");

  const admin = await prisma.user.create({
    data: {
      email: "admin@hawaiianvacationrents.com",
      name: "Platform Admin",
      role: "ADMIN",
      passwordHash,
    },
  });

  const owners = await Promise.all(
    [
      { email: "leilani@example.com", name: "Leilani Kahale", phone: "(808) 555-0142" },
      { email: "thompson@example.com", name: "Mark & Susan Thompson", phone: "(808) 555-0177" },
      { email: "nakamura@example.com", name: "David Nakamura", phone: "(808) 555-0163" },
    ].map((o) => prisma.user.create({ data: { ...o, passwordHash } }))
  );

  const now = Date.now();

  for (const l of LISTINGS) {
    const c = city(l.citySlug);
    const owner = owners[l.owner];
    const publishedAt = new Date(now - l.publishedDaysAgo * DAY);
    const expiresAt = new Date(now + l.expiresInDays * DAY);
    const property = await prisma.property.create({
      data: {
        slug: `${slugify(l.title)}-${c.slug}-${Math.random().toString(36).slice(2, 6)}`,
        title: l.title,
        description: l.desc,
        island: c.island,
        city: c.name,
        citySlug: c.slug,
        lat: c.lat + (Math.random() - 0.5) * 0.012,
        lng: c.lng + (Math.random() - 0.5) * 0.012,
        type: l.type,
        pricePerNight: l.price,
        bedrooms: l.bd,
        bathrooms: l.ba,
        maxGuests: l.guests,
        minNights: l.minNights || 1,
        amenities: JSON.stringify(l.amenities),
        licenseNumber: l.license || null,
        contactName: owner.name,
        contactEmail: owner.email,
        contactPhone: owner.phone,
        status: "ACTIVE",
        publishedAt,
        expiresAt,
        tier: l.tier || "BASIC",
        views: l.views,
        contactClicks: l.clicks,
        searchText: searchTextFor(l.title, l.citySlug, l.type, l.amenities),
        ownerId: owner.id,
        photos: {
          create: l.photos.map((url, i) => ({ url, sortOrder: i, alt: l.title })),
        },
      },
    });

    await prisma.payment.create({
      data: {
        kind: "PUBLISH",
        tier: l.tier || "BASIC",
        amountCents: TIER_PRICE[l.tier || "BASIC"],
        status: "PAID",
        paidAt: publishedAt,
        createdAt: publishedAt,
        receiptEmail: owner.email,
        userId: owner.id,
        propertyId: property.id,
        method: l.owner === 1 ? "PAYPAL" : "USDT_TRC20",
        providerRef: `demo_${property.id.slice(-8)}`,
      },
    });
    if (l.publishedDaysAgo > 14) {
      const renewedAt = new Date(now - (l.publishedDaysAgo - 14) * DAY);
      await prisma.payment.create({
        data: {
          kind: "RENEWAL",
          tier: l.tier || "BASIC",
          amountCents: TIER_PRICE[l.tier || "BASIC"],
          status: "PAID",
          paidAt: renewedAt,
          createdAt: renewedAt,
          receiptEmail: owner.email,
          userId: owner.id,
          propertyId: property.id,
          method: l.owner === 1 ? "PAYPAL" : "USDT_TRC20",
          providerRef: `demo_r_${property.id.slice(-8)}`,
        },
      });
    }

    if (l.citySlug === "haleiwa") {
      await prisma.report.create({
        data: {
          propertyId: property.id,
          reason: "inaccurate",
          details: "The listing says 5 guests but the owner told me max 4 when I called. Might want to double-check.",
          reporterEmail: "traveler88@example.com",
        },
      });
    }
    if (l.citySlug === "princeville") {
      await prisma.report.create({
        data: {
          propertyId: property.id,
          reason: "unavailable",
          details: "Emailed twice about March dates, no response in 10 days.",
          status: "RESOLVED",
          resolvedAt: new Date(now - 2 * DAY),
        },
      });
    }
  }

  // Blog posts
  const COVER_BY_CATEGORY: Record<string, string> = {
    "travel-guide": "/seed/hero.jpg",
    beaches: "/seed/lanai.jpg",
    activities: "/seed/villa.jpg",
    restaurants: "/seed/pool.jpg",
    tips: "/seed/cottage.jpg",
  };
  try {
    const posts = JSON.parse(
      readFileSync(path.join(__dirname, "content", "blog-posts.json"), "utf8")
    ) as { slug: string; title: string; excerpt: string; category: string; content: string }[];
    let daysAgo = 40;
    for (const p of posts) {
      await prisma.blogPost.create({
        data: {
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          category: p.category,
          content: p.content,
          coverImage: COVER_BY_CATEGORY[p.category] || "/seed/hero.jpg",
          published: true,
          publishedAt: new Date(now - daysAgo * DAY),
        },
      });
      daysAgo -= 8;
    }
    console.log(`  ✓ ${posts.length} blog posts`);
  } catch (e) {
    console.warn("  ! blog content missing, skipping", e);
  }

  // Legal pages
  try {
    const pages = JSON.parse(
      readFileSync(path.join(__dirname, "content", "pages.json"), "utf8")
    ) as { slug: string; title: string; content: string }[];
    for (const p of pages) {
      await prisma.page.upsert({
        where: { slug: p.slug },
        create: p,
        update: { title: p.title, content: p.content },
      });
    }
    console.log(`  ✓ ${pages.length} content pages`);
  } catch (e) {
    console.warn("  ! pages content missing, skipping", e);
  }

  await prisma.contactMessage.create({
    data: {
      name: "Rachel Kim",
      email: "rachel.kim@example.com",
      subject: "Listing multiple properties",
      message: "Aloha! I manage six condos in Kihei — is there a bulk option for listing all of them? Mahalo, Rachel",
    },
  });
  await prisma.contactMessage.create({
    data: {
      name: "Tom Beck",
      email: "tombeck@example.com",
      subject: "Great site",
      message: "Just booked a week in Hanalei directly with the owner. Saved about $400 in fees compared to the big platforms. Keep it up!",
      status: "HANDLED",
    },
  });

  console.log("  ✓ admin: admin@hawaiianvacationrents.com / Aloha2026!");
  console.log("  ✓ owner: leilani@example.com / Aloha2026! (also thompson@, nakamura@)");
  console.log(`  ✓ ${LISTINGS.length} active listings across 4 islands`);
  console.log("🌺 Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
