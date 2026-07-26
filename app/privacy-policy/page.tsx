import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Hawaiian Vacation Rents collects, uses and protects your data.",
};
export const revalidate = 3600;

export default function PrivacyPage() {
  return <StaticPage slug="privacy-policy" />;
}
