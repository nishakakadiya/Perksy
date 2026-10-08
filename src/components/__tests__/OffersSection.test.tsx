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
import { OffersSection } from "../OffersSection";
import { useGetOffersQuery } from "../../services/profileApi";
import { useOfferStatus } from "../../hooks/useOfferStatus";
import type { LoyaltyOffer } from "../../services/mockApi";

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
  useState: () => ["All", () => undefined],
}));

jest.mock("react/jsx-runtime", () => ({
  Fragment: Symbol.for("react.fragment"),
  jsx: (type: unknown, props: object, key: string | undefined) =>
    typeof type === "function"
      ? type(props)
      : {
          type,
          props,
          key,
        },
  jsxs: (type: unknown, props: object, key: string | undefined) =>
    typeof type === "function"
      ? type(props)
      : {
          type,
          props,
          key,
        },
}));

jest.mock("expo-router", () => ({
  Link: "Link",
}));

jest.mock("react-native", () => ({
  ActivityIndicator: "ActivityIndicator",
  Pressable: "Pressable",
  ScrollView: "ScrollView",
  StyleSheet: {
    compose: (style: object, additionalStyle: object | null) =>
      additionalStyle ? { ...style, ...additionalStyle } : style,
    create: (styles: unknown) => styles,
    flatten: (style: unknown) =>
      Array.isArray(style) ? Object.assign({}, ...style) : style,
    hairlineWidth: 1,
  },
  Text: "Text",
  View: "View",
}));

jest.mock("../../services/profileApi", () => ({
  useGetOffersQuery: jest.fn(),
}));

jest.mock("../../hooks/useOfferStatus", () => ({
  useOfferStatus: jest.fn(),
}));

const offers: LoyaltyOffer[] = [
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
];

type TestElement = ReactElement<{
  children?: ReactNode;
  [key: string]: unknown;
}>;

function renderOffers({
  data = offers,
  isLoading = false,
  isError = false,
  error,
  refetch = jest.fn(),
}: {
  data?: LoyaltyOffer[];
  isLoading?: boolean;
  isError?: boolean;
  error?: string | { message: string };
  refetch?: () => void;
} = {}) {
  jest.mocked(useGetOffersQuery).mockReturnValue({
    data,
    error,
    isError,
    isLoading,
    refetch,
  } as unknown as ReturnType<typeof useGetOffersQuery>);
  jest.mocked(useOfferStatus).mockImplementation((offer) =>
    offer?.id === "offer-market" ? "expired" : "available",
  );
  return OffersSection() as TestElement;
}

function descendants(node: ReactNode): TestElement[] {
  const result: TestElement[] = [];
  if (Array.isArray(node)) {
    return node.flatMap((child) => descendants(child));
  }
  Children.forEach(node, (child) => {
    if (Array.isArray(child)) {
      result.push(...descendants(child));
      return;
    }
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

describe("OffersSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists offers with their status and links to the matching detail route", () => {
    const screen = renderOffers();
    const nodes = descendants(screen);
    const links = nodes.filter((node) => node.type === "Link");

    expect(visibleText(screen)).toContain("Offers to redeem");
    expect(visibleText(screen)).toContain("Free barista-made coffee");
    expect(visibleText(screen)).toContain("Available");
    expect(visibleText(screen)).toContain("$5 shopping voucher");
    expect(visibleText(screen)).toContain("Expired");
    expect(links.map((link) => link.props.href)).toEqual([
      {
        pathname: "/offers/[offerId]",
        params: { offerId: "offer-coffee" },
      },
      {
        pathname: "/offers/[offerId]",
        params: { offerId: "offer-market" },
      },
    ]);
  });

  it("shows loading feedback while offers are being fetched", () => {
    const screen = renderOffers({ data: [], isLoading: true });

    expect(
      descendants(screen).some((node) => node.type === "ActivityIndicator"),
    ).toBe(true);
    expect(visibleText(screen)).toContain("Loading offers...");
  });

  it("shows the query error and retries when requested", () => {
    const refetch = jest.fn();
    const screen = renderOffers({
      data: [],
      error: { message: "Network unavailable" },
      isError: true,
      refetch,
    });
    const retry = descendants(screen).find(
      (node) =>
        node.type === "Pressable" && visibleText(node).includes("Try again"),
    );

    expect(visibleText(screen)).toContain("Network unavailable");
    (retry?.props.onPress as () => void)();
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
