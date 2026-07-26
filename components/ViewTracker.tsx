"use client";

import { useEffect } from "react";

export function ViewTracker({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    const key = `hvr_viewed_${propertyId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, kind: "view" }),
    }).catch(() => {});
  }, [propertyId]);
  return null;
}
