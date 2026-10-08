import {
  Children,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import OfferDetailScreen from "../[offerId]";
import {
  useGetCurrentUserProfileQuery,
  useGetOffersQuery,
  useRedeemOfferMutation,
} from "../../../services/profileApi";
import { useOfferStatus } from "../../../hooks/useOfferStatus";
import type {
  LoyaltyOffer,
  UserProfile,
} from "../../../services/mockApi";

jest.mock("react", () => ({
  Children: {
    forEach: (
      children: ReactNode,
      callback: (child: ReactNode) => void,
    ) => {
      for (const child of Array.isArray(children) ? children : [children]) {
        callback(child);
      }
    },
    toArray: (children: ReactNode) =>
      Array.isArray(children) ? children : children == null ? [] : [children],
  },
  useState: () => [false, () => undefined],
}));

jest.mock("react/jsx-runtime", () => ({
  Fragment: Symbol.for("react.fragment"),
  jsx: (type: unknown, props: object, key: string | undefined) => ({
    type,
    props,
    key,
  }),
  jsxs: (type: unknown, props: object, key: string | undefined) => ({
    type,
    props,
    key,
  }),
}));

jest.mock("expo-router", () => ({
  Link: "Link",
  Stack: { Screen: "StackScreen" },
  useLocalSearchParams: () => ({ offerId: "offer-coffee" }),
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: "StatusBar",
}));

jest.mock("react-native-barcode-svg", () => "Barcode");

jest.mock("react-native", () => ({
  ActivityIndicator: "ActivityIndicator",
  Pressable: "Pressable",
  ScrollView: "ScrollView",
  StyleSheet: {
    compose: (style: object, additionalStyle: object | null) =>
      additionalStyle ? { ...style, ...additionalStyle } : style,
    create: (styles: unknown) => styles,
    hairlineWidth: 1,
  },
  Text: "Text",
  View: "View",
}));

jest.mock("../../../services/profileApi", () => ({
  useGetCurrentUserProfileQuery: jest.fn(),
  useGetOffersQuery: jest.fn(),
  useRedeemOfferMutation: jest.fn(),
}));

jest.mock("../../../hooks/useOfferStatus", () => ({
  useOfferStatus: jest.fn(),
}));

const offer: LoyaltyOffer = {
  id: "offer-coffee",
  title: "Free barista-made coffee",
  description: "Choose any regular coffee from the menu.",
  merchant: "Coffee House",
  category: "Dining",
  pointsCost: 500,
  useBy: "2027-12-31T23:59:59.999Z",
  redeemedAt: null,
  redemptionCode: null,
};

const profile: UserProfile = {
  id: "perksy-member-001",
  firstName: "Alex",
  lastName: "Morgan",
  email: "alex.morgan@example.com",
  memberSince: "2024-03-15",
  tier: "Gold",
  pointsBalance: 2450,
};

const refetchOffers = jest.fn();
const refetchProfile = jest.fn();
const redeemOffer = jest.fn();

type TestElement = ReactElement<{
  children?: ReactNode;
  [key: string]: unknown;
}>;

function configureScreen({
  offers = [offer],
  userProfile = profile,
  offersLoading = false,
  profileLoading = false,
  offersError = false,
  profileError = false,
  redemption = {},
  status = "available",
}: {
  offers?: LoyaltyOffer[];
  userProfile?: UserProfile | undefined;
  offersLoading?: boolean;
  profileLoading?: boolean;
  offersError?: boolean;
  profileError?: boolean;
  redemption?: Record<string, unknown>;
  status?: "available" | "redeemed" | "expired" | undefined;
} = {}) {
  jest.mocked(useGetOffersQuery).mockReturnValue({
    data: offers,
    error: undefined,
    isError: offersError,
    isLoading: offersLoading,
    refetch: refetchOffers,
  } as ReturnType<typeof useGetOffersQuery>);
  jest.mocked(useGetCurrentUserProfileQuery).mockReturnValue({
    data: userProfile,
    error: undefined,
    isError: profileError,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } as ReturnType<typeof useGetCurrentUserProfileQuery>);
  jest.mocked(useRedeemOfferMutation).mockReturnValue([
    redeemOffer,
    {
      isError: false,
      isLoading: false,
      reset: jest.fn(),
      ...redemption,
    },
  ] as unknown as ReturnType<typeof useRedeemOfferMutation>);
  jest.mocked(useOfferStatus).mockReturnValue(status);

  return OfferDetailScreen() as TestElement;
}

function descendants(node: ReactNode): TestElement[] {
  const result: TestElement[] = [];
  Children.forEach(node, (child) => {
    if (child && typeof child === "object" && "props" in child) {
      const element = child as TestElement;
      result.push(element, ...descendants(element.props.children));
    }
  });
  return result;
}

function visibleText(element: TestElement) {
  return descendants(element)
    .filter((node) => node.type === "Text" || node.type === "Link")
    .map((node) =>
      Children.toArray(node.props.children as ReactNode).join(""),
    );
}

describe("OfferDetailScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configureScreen();
  });

  it("shows a loading state while offer data is loading", () => {
    const screen = configureScreen({ offersLoading: true });
    const nodes = descendants(screen);

    expect(nodes.some((node) => node.type === "ActivityIndicator")).toBe(true);
    expect(visibleText(screen)).toContain("Loading offer details...");
  });

  it("shows a helpful message when the offer does not exist", () => {
    const screen = configureScreen({ offers: [] });
    const text = visibleText(screen);

    expect(text).toContain("Offer not found");
    expect(text).toContain("Back to Perksy");
  });

  it("shows offer and member details and dispatches redemption", () => {
    const screen = configureScreen();
    const nodes = descendants(screen);
    const redeemButton = nodes.find(
      (node) =>
        node.type === "Pressable" &&
        visibleText(node).includes("Redeem offer"),
    );

    expect(visibleText(screen)).toContain("Free barista-made coffee");
    expect(visibleText(screen)).toContain("Alex Morgan");
    expect(visibleText(screen)).toContain("2,450 pts");
    expect(redeemButton).toBeDefined();

    (redeemButton?.props.onPress as () => void)();
    expect(redeemOffer).toHaveBeenCalledWith("offer-coffee");
  });

  it("shows an existing redemption code and marks the offer redeemed", () => {
    const screen = configureScreen({
      offers: [{ ...offer, redemptionCode: "PK-ABC-123456" }],
      status: "redeemed",
    });
    const text = visibleText(screen);
    const barcode = descendants(screen).find((node) => node.type === "Barcode");

    expect(text).toContain("Redeemed");
    expect(text).toContain("You have already redeemed this offer.");
    expect(text).toContain("PK-ABC-123456");
    expect(barcode?.props.value).toBe("PK-ABC-123456");
  });
});
