# Perksy

## Overview

A small mock loyalty app built for the Signature Hospitality Group technical task. Members can view their tier and points, browse offers, open offer details, and redeem eligible offers to display a scannable barcode. Offers are also marked redeemed or expired.

## Getting started

1. Install dependencies with `npm install`.
2. Start the app with `npm start`, then open it in an iOS/Android simulator or Expo Go.
3. Run tests with `npm test`; run `npm run test:coverage` for a coverage report.
4. Run lint with `npm run lint`.

## Key decisions

- Redux Toolkit Query handles profile, offers, and redemption requests. Successful redemption invalidates profile/offer cache so points and offer status refresh.
- Shared color, typography, and spacing tokens are defined in `src/theme.tsx`.
- The mock API in `src/services/mockApi.ts` uses in-memory sample data and simulates a 500 ms delay. Redemption checks availability, expiry, and points before updating the balance and generating a code.
- Loading, error/retry, empty, available, redeemed, and expired states provide feedback at key points in the flow.
- Added additional filter in offers according to offer category.

## Trade-offs and next steps

- Data is in memory; there is no production backend, authentication, or persistence. The mock service simulates latency but does not inject random transient network failures. Error and retry UI is implemented, and redemption validation errors are covered.
- Tests focus on core service behavior and key route/component states. With more time, I would add deterministic simulated request failures, device-level flow tests, and pull-to-refresh.

## AI tools

- Copilot SDK in VS Code assisted with implementation, tests, and documentation. I reviewed the resulting changes and ran the project’s tests and checks.

## Notes for reviewers

- Deep links use the Expo Router path `/offers/<offerId>` (for example, `exp://<your-dev-server-host>:8081/--/offers/offer-coffee`).
- `npm run test:coverage` generates an HTML report in `coverage/lcov-report/index.html`; coverage output is git-ignored.
