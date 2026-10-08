import { configureStore } from "@reduxjs/toolkit";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { getOfferStatus } from "../mockApi";
import { profileApi } from "../profileApi";

function createTestStore() {
  return configureStore({
    reducer: {
      [profileApi.reducerPath]: profileApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(profileApi.middleware),
  });
}

describe("profileApi", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-08T00:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("loads profile and offers, then refreshes cached data after redemption", async () => {
    const store = createTestStore();
    const profileRequest = store.dispatch(
      profileApi.endpoints.getCurrentUserProfile.initiate(),
    );
    const offersRequest = store.dispatch(
      profileApi.endpoints.getOffers.initiate(),
    );
    const profileResult = profileRequest.unwrap();
    const offersResult = offersRequest.unwrap();

    await jest.advanceTimersByTimeAsync(500);

    const [profile, offers] = await Promise.all([profileResult, offersResult]);
    const offer = offers.find((item) => item.id === "offer-coffee");

    expect(offer && getOfferStatus(offer)).toBe("available");
    expect(profile.pointsBalance).toBeGreaterThanOrEqual(500);

    const redemptionRequest = store.dispatch(
      profileApi.endpoints.redeemOffer.initiate("offer-coffee"),
    );
    const redemptionResult = redemptionRequest.unwrap();
    await jest.advanceTimersByTimeAsync(500);
    const redemption = await redemptionResult;

    expect(redemption.redemptionCode).toMatch(/^PK-[A-Z0-9]+-[A-Z0-9]{6}$/);
    expect(redemption.remainingPoints).toBe(profile.pointsBalance - 500);

    const refreshedProfileRequest = store.dispatch(
      profileApi.endpoints.getCurrentUserProfile.initiate(undefined, {
        forceRefetch: true,
      }),
    );
    const refreshedOffersRequest = store.dispatch(
      profileApi.endpoints.getOffers.initiate(undefined, {
        forceRefetch: true,
      }),
    );
    const refreshedProfileResult = refreshedProfileRequest.unwrap();
    const refreshedOffersResult = refreshedOffersRequest.unwrap();
    await jest.advanceTimersByTimeAsync(500);
    const [refreshedProfile, refreshedOffers] = await Promise.all([
      refreshedProfileResult,
      refreshedOffersResult,
    ]);

    expect(refreshedProfile.pointsBalance).toBe(redemption.remainingPoints);
    const redeemedOffer = refreshedOffers.find(
      (item) => item.id === "offer-coffee",
    );
    expect(redeemedOffer && getOfferStatus(redeemedOffer)).toBe("redeemed");
    expect(redeemedOffer?.redemptionCode).toBe(redemption.redemptionCode);

    profileRequest.unsubscribe();
    offersRequest.unsubscribe();
    refreshedProfileRequest.unsubscribe();
    refreshedOffersRequest.unsubscribe();
    store.dispatch(profileApi.util.resetApiState());
  });

  it("returns a query error when redeeming an expired offer", async () => {
    const store = createTestStore();
    const redemptionRequest = store.dispatch(
      profileApi.endpoints.redeemOffer.initiate("offer-wellness"),
    );
    const redemptionResult = redemptionRequest.unwrap();
    const errorAssertion = expect(redemptionResult).rejects.toBe(
      "This offer has expired.",
    );

    await jest.advanceTimersByTimeAsync(500);
    await errorAssertion;

    redemptionRequest.reset();
    store.dispatch(profileApi.util.resetApiState());
  });
});
