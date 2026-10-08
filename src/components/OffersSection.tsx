import { Link } from "expo-router";
import { useState } from "react";
import { useOfferStatus } from "../hooks/useOfferStatus";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useGetOffersQuery } from "../services/profileApi";
import type { LoyaltyOffer, OfferCategory } from "../services/mockApi";
import { theme } from "../theme";

type OfferFilter = "All" | OfferCategory;

const offerFilters: OfferFilter[] = [
  "All",
  "Dining",
  "Shopping",
  "Experiences",
];

export function OffersSection() {
  const [selectedFilter, setSelectedFilter] = useState<OfferFilter>("All");
  const {
    data: offers,
    error,
    isError,
    isLoading,
    refetch,
  } = useGetOffersQuery();
  const errorMessage =
    typeof error === "string"
      ? error
      : (error?.message ?? "We couldn't load offers. Please try again.");

  const filteredOffers =
    offers?.filter(
      (offer) => selectedFilter === "All" || offer.category === selectedFilter,
    ) ?? [];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Offers to redeem</Text>
      <Text style={styles.sectionDescription}>
        Use your points on rewards you’ll love.
      </Text>

      <ScrollView
        contentContainerStyle={styles.filtersContent}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
      >
        {offerFilters.map((filter) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: selectedFilter === filter }}
            key={filter}
            onPress={() => setSelectedFilter(filter)}
            style={StyleSheet.compose(
              styles.filterButton,
              selectedFilter === filter ? styles.selectedFilterButton : null,
            )}
          >
            <Text
              style={StyleSheet.compose(
                styles.filterText,
                selectedFilter === filter ? styles.selectedFilterText : null,
              )}
            >
              {filter}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading && (
        <View style={styles.stateContainer}>
          <ActivityIndicator
            color={theme.colors.primary.DEFAULT}
            size="large"
          />
          <Text style={styles.stateMessage}>Loading offers...</Text>
        </View>
      )}

      {isError && (
        <View style={styles.stateContainer}>
          <Text style={styles.stateMessage}>{errorMessage}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={refetch}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      )}

      {!isLoading && !isError && filteredOffers.length === 0 && (
        <Text style={styles.emptyMessage}>
          There are no offers in this category right now.
        </Text>
      )}

      {!isLoading &&
        !isError &&
        filteredOffers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
    </View>
  );
}

function OfferCard({ offer }: { offer: LoyaltyOffer }) {
  const status = useOfferStatus(offer);

  return (
    <Link
      asChild
      href={{
        pathname: "/offers/[offerId]",
        params: { offerId: offer.id },
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${status === "available" ? "View" : status} ${offer.title} offer`}
        style={StyleSheet.flatten([
          styles.offerCard,
          status !== "available" ? styles.inactiveOfferCard : null,
        ])}
      >
        <View style={styles.offerHeader}>
          <Text style={styles.offerMerchant}>{offer.merchant}</Text>
          <View style={styles.badges}>
            <Text style={styles.offerCategory}>{offer.category}</Text>
            <Text
              style={StyleSheet.compose(
                StyleSheet.compose(
                  styles.statusBadge,
                  status === "redeemed" ? styles.redeemedBadge : null,
                ),
                status === "expired" ? styles.expiredBadge : null,
              )}
            >
              {status === "available"
                ? "Available"
                : status === "redeemed"
                  ? "Redeemed"
                  : "Expired"}
            </Text>
          </View>
        </View>
        <Text style={styles.offerTitle}>{offer.title}</Text>
        <Text style={styles.offerDescription}>{offer.description}</Text>
        <Text style={styles.useBy}>
          Use by{" "}
          {new Date(offer.useBy).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </Text>
        <View style={styles.offerFooter}>
          <Text style={styles.pointsCost}>
            {offer.pointsCost.toLocaleString()} points
          </Text>
          <Text style={styles.redeemLabel}>
            {status === "available" ? "View offer" : "View details"}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: theme.spacing["2xl"],
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.xl,
    lineHeight: theme.typography.lineHeight.heading,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  sectionDescription: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.normal,
    marginTop: theme.spacing.xs,
  },
  filters: {
    flexGrow: 0,
    marginHorizontal: -theme.spacing["2xl"],
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  filtersContent: {
    paddingHorizontal: theme.spacing["2xl"],
    columnGap: theme.spacing.sm,
  },
  filterButton: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing["3xl"],
    borderWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  selectedFilterButton: {
    backgroundColor: theme.colors.primary.DEFAULT,
    borderColor: theme.colors.primary.DEFAULT,
  },
  filterText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  selectedFilterText: {
    color: theme.colors.primary.contrast,
  },
  offerCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.lg,
    borderWidth: 1,
    marginTop: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  offerHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  badges: {
    alignItems: "center",
    flexDirection: "row",
    columnGap: theme.spacing.xs,
  },
  inactiveOfferCard: {
    backgroundColor: theme.colors.surfaceSubtle,
  },
  offerMerchant: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 0.5,
  },
  offerCategory: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.spacing.xs,
    color: theme.colors.secondary.DEFAULT,
    fontSize: theme.typography.fontSize.xs,
    overflow: "hidden",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
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
  offerTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  offerDescription: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.normal,
    marginTop: theme.spacing.xs,
  },
  useBy: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.xs,
    marginTop: theme.spacing.sm,
  },
  offerFooter: {
    alignItems: "center",
    borderTopColor: theme.colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  pointsCost: {
    color: theme.colors.primary.DEFAULT,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  redeemLabel: {
    color: theme.colors.secondary.DEFAULT,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  stateContainer: {
    alignItems: "center",
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.lg,
    borderWidth: 1,
    marginTop: theme.spacing.md,
    padding: theme.spacing["2xl"],
  },
  stateMessage: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.normal,
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: theme.colors.primary.DEFAULT,
    borderRadius: theme.spacing.sm,
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  retryButtonText: {
    color: theme.colors.primary.contrast,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  emptyMessage: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.normal,
    paddingVertical: theme.spacing.xl,
    textAlign: "center",
  },
});
