import { useEffect, useState } from "react";
import {
  getOfferStatus,
  type LoyaltyOffer,
  type OfferStatus,
} from "../services/mockApi";

const MAX_TIMEOUT = 2_147_483_647;

export function useOfferStatus(
  offer: LoyaltyOffer | undefined,
): OfferStatus | undefined {
  const [revision, refreshStatus] = useState(0);

  useEffect(() => {
    if (!offer || getOfferStatus(offer) !== "available") {
      return;
    }

    const timeUntilExpiry = Date.parse(offer.useBy) - Date.now();
    const timer = setTimeout(
      () => refreshStatus((revision) => revision + 1),
      Math.min(Math.max(timeUntilExpiry, 0), MAX_TIMEOUT),
    );

    return () => clearTimeout(timer);
  }, [offer, revision]);

  return offer ? getOfferStatus(offer) : undefined;
}
