"use client";

import { useEffect } from "react";
import { logEvent } from "@/app/actions/analytics";

interface AnalyticsTrackerProps {
  eventType: string;
  productId?: string;
  batchId?: string;
  pageUrl?: string;
}

export function AnalyticsTracker({ eventType, productId, batchId, pageUrl }: AnalyticsTrackerProps) {
  useEffect(() => {
    // Invoke the logEvent server action asynchronously
    logEvent(eventType, { productId, batchId, pageUrl }).catch((err) => {
      console.error("Analytics tracking failed:", err);
    });
  }, [eventType, productId, batchId, pageUrl]);

  return null;
}
