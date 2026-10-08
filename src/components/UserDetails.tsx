import { useGetCurrentUserProfileQuery } from "../services/profileApi";
import { theme } from "../theme";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export function UserDetails() {
  const { data: profile, error, isError, isLoading, refetch } =
    useGetCurrentUserProfileQuery();
  const errorMessage =
    typeof error === "string"
      ? error
      : error?.message ??
        "We couldn't load your profile. Please try again.";

  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator color={theme.colors.primary.DEFAULT} size="large" />
        <Text style={styles.stateMessage}>Loading your Perksy account...</Text>
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateTitle}>
          We couldn&apos;t load your profile
        </Text>
        <Text style={styles.stateMessage}>{errorMessage}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={refetch}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.greetingSection}>
        <Text style={styles.eyebrow}>YOUR PERKSY MEMBERSHIP</Text>
        <Text style={styles.title}>Welcome back, {profile.firstName}</Text>
        <Text style={styles.bodyText}>{profile.email}</Text>
      </View>

      <View style={styles.pointsCard}>
        <Text style={styles.cardEyebrow}>POINTS BALANCE</Text>
        <Text style={styles.pointsValue}>
          {profile.pointsBalance.toLocaleString()}
        </Text>
      </View>

      <View style={styles.membershipCard}>
        <Text style={styles.sectionTitle}>Membership</Text>
        <View style={styles.membershipRow}>
          <Text style={styles.detailLabel}>Current tier</Text>
          <Text style={styles.detailValue}>{profile.tier}</Text>
        </View>
        <View style={styles.membershipRow}>
          <Text style={styles.detailLabel}>Member since</Text>
          <Text style={styles.detailValue}>
            {new Date(profile.memberSince).toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  greetingSection: {
    marginBottom: theme.spacing["2xl"],
  },
  eyebrow: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  title: {
    color: theme.colors.primary.DEFAULT,
    fontSize: theme.typography.fontSize["2xl"],
    lineHeight: theme.typography.lineHeight.heading,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  bodyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.base,
    lineHeight: theme.typography.lineHeight.normal,
  },
  pointsCard: {
    backgroundColor: theme.colors.primary.DEFAULT,
    borderRadius: theme.spacing.lg,
    padding: theme.spacing["2xl"],
    marginBottom: theme.spacing.lg,
  },
  cardEyebrow: {
    color: theme.colors.primary[200],
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  pointsValue: {
    color: theme.colors.primary.contrast,
    fontSize: theme.typography.fontSize["4xl"],
    lineHeight: theme.typography.lineHeight.display,
    fontWeight: theme.typography.fontWeight.bold,
  },
  membershipCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.lg,
    borderWidth: 1,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing["2xl"],
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.lineHeight.relaxed,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.md,
  },
  membershipRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm,
  },
  detailLabel: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
  },
  detailValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  stateContainer: {
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.lg,
    borderWidth: 1,
    justifyContent: "center",
    marginBottom: theme.spacing["2xl"],
    padding: theme.spacing["3xl"],
  },
  stateTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
    textAlign: "center",
  },
  stateMessage: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.base,
    lineHeight: theme.typography.lineHeight.normal,
    marginTop: theme.spacing.md,
    textAlign: "center",
  },
  retryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.primary.DEFAULT,
    borderRadius: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing["2xl"],
    paddingVertical: theme.spacing.md,
  },
  retryButtonText: {
    color: theme.colors.primary.contrast,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
