import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import {
  getCurrentUserProfile,
  getOfferStatus,
  redeemOffer,
} from "../mockApi";

describe("getOfferStatus", () => {
  const useBy = "2026-10-08T12:00:00.000Z";
  const offer = {
    id: "offer-test",
    useBy,
    redeemedAt: null,
  };

  it("is available before its use-by deadline", () => {
    expect(getOfferStatus(offer, Date.parse(useBy) - 1)).toBe("available");
  });

  it("expires at its use-by deadline", () => {
    expect(getOfferStatus(offer, Date.parse(useBy))).toBe("expired");
  });

  it("keeps redeemed offers redeemed after their deadline", () => {
    expect(
      getOfferStatus(
        { ...offer, redeemedAt: "2026-10-01T00:00:00.000Z" },
        Date.parse(useBy),
      ),
    ).toBe("redeemed");
  });

  it("rejects invalid use-by dates", () => {
    expect(() =>
      getOfferStatus({ ...offer, useBy: "not-a-date" }, Date.now()),
    ).toThrow('Offer "offer-test" has an invalid use-by date.');
  });
});

describe("redeemOffer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-08T00:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("generates a redemption code and deducts points only once", async () => {
    const initialProfileRequest = getCurrentUserProfile();
    await jest.advanceTimersByTimeAsync(500);
    const initialProfile = await initialProfileRequest;

    const redemptionPromise = redeemOffer("offer-coffee");
    await jest.advanceTimersByTimeAsync(500);
    const redemption = await redemptionPromise;

    expect(redemption).toMatchObject({
      offerId: "offer-coffee",
      remainingPoints: initialProfile.pointsBalance - 500,
    });
    expect(redemption.redemptionCode).toMatch(/^PK-[A-Z0-9]+-[A-Z0-9]{6}$/);

    const updatedProfileRequest = getCurrentUserProfile();
    await jest.advanceTimersByTimeAsync(500);
    const updatedProfile = await updatedProfileRequest;
    expect(updatedProfile.pointsBalance).toBe(redemption.remainingPoints);

    const secondRedemption = redeemOffer("offer-coffee");
    const secondRedemptionAssertion = expect(secondRedemption).rejects.toThrow(
      "This offer has already been redeemed.",
    );
    await jest.advanceTimersByTimeAsync(500);
    await secondRedemptionAssertion;

    const unchangedProfileRequest = getCurrentUserProfile();
    await jest.advanceTimersByTimeAsync(500);
    const unchangedProfile = await unchangedProfileRequest;
    expect(unchangedProfile.pointsBalance).toBe(redemption.remainingPoints);
  });

  it("rejects an offer that has passed its use-by date", async () => {
    const expiredRedemption = redeemOffer("offer-wellness");
    const expiredRedemptionAssertion = expect(expiredRedemption).rejects.toThrow(
      "This offer has expired.",
    );
    await jest.advanceTimersByTimeAsync(500);

    await expiredRedemptionAssertion;
  });

  it("rejects an unknown offer", async () => {
    const unknownRedemption = redeemOffer("missing-offer");
    const unknownRedemptionAssertion = expect(
      unknownRedemption,
    ).rejects.toThrow("This offer is no longer available.");
    await jest.advanceTimersByTimeAsync(500);

    await unknownRedemptionAssertion;
  });
});
