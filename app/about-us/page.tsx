import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "About Us",
  description: "The story of Hawaiian Vacation Rents — the Hawaii-only directory connecting travelers directly with vacation home owners.",
};
export const revalidate = 3600;

export default function AboutPage() {
  return <StaticPage slug="about-us" />;
}
