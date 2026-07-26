import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Important information about how Hawaiian Vacation Rents works and what travelers should verify before booking.",
};
export const revalidate = 3600;

export default function DisclaimerPage() {
  return <StaticPage slug="disclaimer" />;
}
