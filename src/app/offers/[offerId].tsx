import { Link, Stack, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Barcode from "react-native-barcode-svg";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  useGetCurrentUserProfileQuery,
  useGetOffersQuery,
  useRedeemOfferMutation,
} from "../../services/profileApi";
import { useOfferStatus } from "../../hooks/useOfferStatus";
import { theme } from "../../theme";

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "string") {
    return error;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
}

export default function OfferDetailScreen() {
  const { offerId } = useLocalSearchParams<{ offerId: string }>();
  const {
    data: offers,
    error: offersError,
    isError: isOffersError,
    isLoading: isOffersLoading,
    refetch: refetchOffers,
  } = useGetOffersQuery();
  const {
    data: profile,
    error: profileError,
    isError: isProfileError,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useGetCurrentUserProfileQuery();
  const [redeemOffer, redemption] = useRedeemOfferMutation();
  const [barcodeError, setBarcodeError] = useState(false);
  const offer = offers?.find((item) => item.id === offerId);
  const redemptionCode =
    redemption.data?.redemptionCode ?? offer?.redemptionCode;
  const offerStatus = useOfferStatus(offer);
  const isLoading = isOffersLoading || isProfileLoading;
  const isError = isOffersError || isProfileError;
  const isAvailable = offerStatus === "available";
  const canAfford =
    profile && offer
      ? isAvailable && profile.pointsBalance >= offer.pointsCost
      : false;
  const errorMessage = isOffersError
    ? getErrorMessage(offersError, "We couldn't load this offer.")
    : getErrorMessage(profileError, "We couldn't load your member details.");

  return (
    <>
      <Stack.Screen options={{ title: offer?.merchant ?? "Offer details" }} />
      <StatusBar style="dark" />

      {isLoading && (
        <View style={styles.stateContainer}>
          <ActivityIndicator
            color={theme.colors.primary.DEFAULT}
            size="large"
          />
          <Text style={styles.stateMessage}>Loading offer details...</Text>
        </View>
      )}

      {isError && (
        <View style={styles.stateContainer}>
          <Text style={styles.stateTitle}>Unable to load offer details</Text>
          <Text style={styles.stateMessage}>{errorMessage}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (isOffersError) {
                refetchOffers();
              }
              if (isProfileError) {
                refetchProfile();
              }
            }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Try again</Text>
          </Pressable>
        </View>
      )}

      {!isLoading && !isError && !offer && (
        <View style={styles.stateContainer}>
          <Text style={styles.stateTitle}>Offer not found</Text>
          <Text style={styles.stateMessage}>
            This offer may no longer be available.
          </Text>
          <Link href="/" style={styles.backLink}>
            Back to Perksy
          </Link>
        </View>
      )}

      {!isLoading && !isError && offer && profile && (
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.offerCard}>
            <View style={styles.badgeRow}>
              <Text style={styles.offerCategory}>{offer.category}</Text>
              <Text
                style={StyleSheet.compose(
                  StyleSheet.compose(
                    styles.statusBadge,
                    offerStatus === "redeemed"
                      ? styles.redeemedBadge
                      : null,
                  ),
                  offerStatus === "expired" ? styles.expiredBadge : null,
                )}
              >
                {offerStatus === "available"
                  ? "Available"
                  : offerStatus === "redeemed"
                    ? "Redeemed"
                    : "Expired"}
              </Text>
            </View>
            <Text style={styles.merchant}>{offer.merchant}</Text>
            <Text style={styles.offerTitle}>{offer.title}</Text>
            <Text style={styles.description}>{offer.description}</Text>
            <Text style={styles.useBy}>
              Use by{" "}
              {new Date(offer.useBy).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
            <View style={styles.pointsCostRow}>
              <Text style={styles.pointsCostLabel}>Points required</Text>
              <Text style={styles.pointsCost}>
                {offer.pointsCost.toLocaleString()} pts
              </Text>
            </View>
          </View>

          <View style={styles.memberCard}>
            <Text style={styles.memberTitle}>Your membership</Text>
            <View style={styles.memberRow}>
              <Text style={styles.memberLabel}>Member</Text>
              <Text style={styles.memberValue}>
                {profile.firstName} {profile.lastName}
              </Text>
            </View>
            <View style={styles.memberRow}>
              <Text style={styles.memberLabel}>Available points</Text>
              <Text style={styles.memberValue}>
                {profile.pointsBalance.toLocaleString()} pts
              </Text>
            </View>
            {offerStatus === "available" && !canAfford && (
              <Text style={styles.insufficientPoints}>
                You need{" "}
                {(offer.pointsCost - profile.pointsBalance).toLocaleString()}{" "}
                more points to redeem this offer.
              </Text>
            )}
            {offerStatus === "redeemed" && (
              <Text style={styles.statusMessage}>
                You have already redeemed this offer.
              </Text>
            )}
            {offerStatus === "expired" && (
              <Text style={styles.statusMessage}>
                This offer has expired and can no longer be redeemed.
              </Text>
            )}
          </View>

          {redemptionCode && (
            <View style={styles.successMessage}>
              <Text style={styles.successMessageText}>
                Your offer is ready to scan at {offer.merchant}.
              </Text>
              {!barcodeError ? (
                <View style={styles.barcodeContainer}>
                  <Barcode
                    backgroundColor={theme.colors.surface}
                    format="CODE128"
                    height={88}
                    lineColor={theme.colors.textPrimary}
                    maxWidth={280}
                    onError={() => setBarcodeError(true)}
                    singleBarWidth={2}
                    value={redemptionCode}
                  />
                </View>
              ) : (
                <Text style={styles.barcodeFallback}>
                  Barcode unavailable. Show this code to the cashier.
                </Text>
              )}
              <Text selectable style={styles.redemptionCode}>
                {redemptionCode}
              </Text>
              <Text style={styles.remainingPoints}>
                {redemption.data?.remainingPoints.toLocaleString() ??
                  profile.pointsBalance.toLocaleString()}{" "}
                points remaining
              </Text>
            </View>
          )}

          {redemption.isError && (
            <Text style={styles.errorMessage}>
              {getErrorMessage(
                redemption.error,
                "We couldn't redeem this offer. Please try again.",
              )}
            </Text>
          )}

          <Pressable
            accessibilityRole="button"
            disabled={!canAfford || redemption.isLoading || !!redemption.data}
            onPress={() => {
              void redeemOffer(offer.id);
            }}
            style={StyleSheet.compose(
              styles.primaryButton,
              !canAfford || redemption.isLoading || redemption.data
                ? styles.disabledButton
                : null,
            )}
          >
            {redemption.isLoading ? (
              <ActivityIndicator color={theme.colors.primary.contrast} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {redemption.data || offerStatus === "redeemed"
                  ? "Offer redeemed"
                  : offerStatus === "expired"
                    ? "Offer expired"
                    : "Redeem offer"}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing["2xl"],
    paddingBottom: theme.spacing["4xl"],
  },
  offerCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.lg,
    borderWidth: 1,
    padding: theme.spacing["2xl"],
  },
  offerCategory: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.spacing.xs,
    color: theme.colors.secondary.DEFAULT,
    fontSize: theme.typography.fontSize.xs,
    overflow: "hidden",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  badgeRow: {
    alignItems: "center",
    flexDirection: "row",
    columnGap: theme.spacing.sm,
  },
  statusBadge: {
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.spacing.xs,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.xs,
    overflow: "hidden",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  redeemedBadge: {
    backgroundColor: theme.colors.successSubtle,
    color: theme.colors.success,
  },
  expiredBadge: {
    backgroundColor: theme.colors.primary[100],
    color: theme.colors.textMuted,
  },
  merchant: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    marginTop: theme.spacing.lg,
  },
  offerTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize["2xl"],
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: theme.typography.lineHeight.heading,
    marginTop: theme.spacing.sm,
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.base,
    lineHeight: theme.typography.lineHeight.relaxed,
    marginTop: theme.spacing.sm,
  },
  useBy: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.sm,
    marginTop: theme.spacing.md,
  },
  pointsCostRow: {
    alignItems: "center",
    borderTopColor: theme.colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing["2xl"],
    paddingTop: theme.spacing.lg,
  },
  pointsCostLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
  },
  pointsCost: {
    color: theme.colors.primary.DEFAULT,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  memberCard: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  memberTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
  },
  memberLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
  },
  memberValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  insufficientPoints: {
    color: theme.colors.warning,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.normal,
    marginTop: theme.spacing.sm,
  },
  statusMessage: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.normal,
    marginTop: theme.spacing.sm,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.primary.DEFAULT,
    borderRadius: theme.spacing.sm,
    justifyContent: "center",
    marginTop: theme.spacing.lg,
    minHeight: theme.spacing["3xl"],
    paddingHorizontal: theme.spacing["2xl"],
    paddingVertical: theme.spacing.md,
  },
  primaryButtonText: {
    color: theme.colors.primary.contrast,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  disabledButton: {
    opacity: 0.5,
  },
  successMessage: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.success,
    borderRadius: theme.spacing.sm,
    borderWidth: 1,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  successMessageText: {
    color: theme.colors.success,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.normal,
    textAlign: "center",
  },
  barcodeContainer: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.sm,
    marginTop: theme.spacing.md,
    overflow: "hidden",
    padding: theme.spacing.sm,
  },
  barcodeFallback: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginTop: theme.spacing.md,
    textAlign: "center",
  },
  redemptionCode: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 1,
    marginTop: theme.spacing.md,
    textAlign: "center",
  },
  remainingPoints: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.xs,
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },
  errorMessage: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.normal,
    marginTop: theme.spacing.lg,
  },
  stateContainer: {
    alignItems: "center",
    backgroundColor: theme.colors.background,
    flex: 1,
    justifyContent: "center",
    padding: theme.spacing["3xl"],
  },
  stateTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: "center",
  },
  stateMessage: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.base,
    lineHeight: theme.typography.lineHeight.normal,
    marginTop: theme.spacing.md,
    textAlign: "center",
  },
  backLink: {
    color: theme.colors.primary.DEFAULT,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    marginTop: theme.spacing.lg,
  },
});
