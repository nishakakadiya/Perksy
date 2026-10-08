export type LoyaltyTier = "Member" | "Silver" | "Gold" | "Platinum";

export type LoyaltyActivity = {
  id: string;
  description: string;
  points: number;
  date: string;
};

export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  memberSince: string;
  tier: LoyaltyTier;
  pointsBalance: number;
};

export type OfferCategory = "Dining" | "Shopping" | "Experiences";
export type OfferStatus = "available" | "redeemed" | "expired";

export type LoyaltyOffer = {
  id: string;
  title: string;
  description: string;
  merchant: string;
  category: OfferCategory;
  pointsCost: number;
  useBy: string;
  redeemedAt: string | null;
  redemptionCode: string | null;
};

type MockOffer = LoyaltyOffer;

export type RedemptionResult = {
  offerId: string;
  remainingPoints: number;
  redemptionCode: string;
};

let mockUserProfile: UserProfile = {
  id: "perksy-member-001",
  firstName: "Alex",
  lastName: "Morgan",
  email: "alex.morgan@example.com",
  memberSince: "2024-03-15",
  tier: "Gold",
  pointsBalance: 2450,
};

const mockOffers: MockOffer[] = [
  {
    id: "offer-coffee",
    title: "Free barista-made coffee",
    description: "Choose any regular coffee from the menu.",
    merchant: "Coffee House",
    category: "Dining",
    pointsCost: 500,
    useBy: "2027-12-31T23:59:59.999Z",
    redeemedAt: null,
    redemptionCode: null,
  },
  {
    id: "offer-lunch",
    title: "$10 off your next meal",
    description: "Enjoy a little something on us at participating cafes.",
    merchant: "Local Eats",
    category: "Dining",
    pointsCost: 900,
    useBy: "2027-10-31T23:59:59.999Z",
    redeemedAt: null,
    redemptionCode: null,
  },
  {
    id: "offer-market",
    title: "$5 shopping voucher",
    description: "Put your points toward your next shopping trip.",
    merchant: "Fresh Market",
    category: "Shopping",
    pointsCost: 650,
    useBy: "2027-06-30T23:59:59.999Z",
    redeemedAt: null,
    redemptionCode: null,
  },
  {
    id: "offer-style",
    title: "15% off your purchase",
    description: "A little extra off your next wardrobe refresh.",
    merchant: "Everyday Style",
    category: "Shopping",
    pointsCost: 1200,
    useBy: "2027-12-31T23:59:59.999Z",
    redeemedAt: null,
    redemptionCode: null,
  },
  {
    id: "offer-movies",
    title: "Two movie tickets",
    description: "Make it a movie night with a friend.",
    merchant: "City Cinemas",
    category: "Experiences",
    pointsCost: 1800,
    useBy: "2027-12-31T23:59:59.999Z",
    redeemedAt: null,
    redemptionCode: null,
  },
  {
    id: "offer-wellness",
    title: "Wellness class pass",
    description: "Try a new class at a participating local studio.",
    merchant: "Move Studio",
    category: "Experiences",
    pointsCost: 1500,
    useBy: "2025-12-31T23:59:59.999Z",
    redeemedAt: null,
    redemptionCode: null,
  },
];

export async function getCurrentUserProfile(): Promise<UserProfile> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 500);
  });
  //keep the below line
  // throw new Error("Test profile loading failure");
  return { ...mockUserProfile };
}

export async function getOffers(): Promise<LoyaltyOffer[]> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 500);
  });

  mockOffers.forEach((offer) => getOfferStatus(offer));
  return mockOffers.map((offer) => ({ ...offer }));
}

export async function redeemOffer(offerId: string): Promise<RedemptionResult> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 500);
  });

  const offer = mockOffers.find((item) => item.id === offerId);

  if (!offer) {
    throw new Error("This offer is no longer available.");
  }

  const status = getOfferStatus(offer);
  if (status !== "available") {
    throw new Error(
      status === "redeemed"
        ? "This offer has already been redeemed."
        : "This offer has expired.",
    );
  }

  if (mockUserProfile.pointsBalance < offer.pointsCost) {
    throw new Error("You don't have enough points to redeem this offer.");
  }

  offer.redeemedAt = new Date().toISOString();
  offer.redemptionCode = `PK-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
  mockUserProfile = {
    ...mockUserProfile,
    pointsBalance: mockUserProfile.pointsBalance - offer.pointsCost,
  };

  return {
    offerId: offer.id,
    remainingPoints: mockUserProfile.pointsBalance,
    redemptionCode: offer.redemptionCode,
  };
}

export function getOfferStatus(
  offer: Pick<LoyaltyOffer, "id" | "useBy" | "redeemedAt">,
  now = Date.now(),
): OfferStatus {
  if (offer.redeemedAt) {
    return "redeemed";
  }

  const useByTime = Date.parse(offer.useBy);
  if (Number.isNaN(useByTime)) {
    throw new Error(`Offer "${offer.id}" has an invalid use-by date.`);
  }

  return now >= useByTime ? "expired" : "available";
}
