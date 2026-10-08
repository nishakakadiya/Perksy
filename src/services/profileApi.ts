import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  getCurrentUserProfile,
  getOffers,
  redeemOffer,
  type LoyaltyOffer,
  type RedemptionResult,
  type UserProfile,
} from "./mockApi";

export const profileApi = createApi({
  reducerPath: "profileApi",
  baseQuery: fakeBaseQuery<string>(),
  tagTypes: ["Profile", "Offers"],
  endpoints: (builder) => ({
    getCurrentUserProfile: builder.query<UserProfile, void>({
      providesTags: ["Profile"],
      async queryFn() {
        try {
          return { data: await getCurrentUserProfile() };
        } catch (error: unknown) {
          return {
            error:
              error instanceof Error
                ? error.message
                : "We couldn't load your profile. Please try again.",
          };
        }
      },
    }),
    getOffers: builder.query<LoyaltyOffer[], void>({
      providesTags: ["Offers"],
      async queryFn() {
        try {
          return { data: await getOffers() };
        } catch (error: unknown) {
          return {
            error:
              error instanceof Error
                ? error.message
                : "We couldn't load offers. Please try again.",
          };
        }
      },
    }),
    redeemOffer: builder.mutation<RedemptionResult, string>({
      invalidatesTags: ["Profile", "Offers"],
      async queryFn(offerId) {
        try {
          return { data: await redeemOffer(offerId) };
        } catch (error: unknown) {
          return {
            error:
              error instanceof Error
                ? error.message
                : "We couldn't redeem this offer. Please try again.",
          };
        }
      },
    }),
  }),
});

export const {
  useGetCurrentUserProfileQuery,
  useGetOffersQuery,
  useRedeemOfferMutation,
} = profileApi;
