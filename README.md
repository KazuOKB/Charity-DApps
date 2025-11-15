# Charity Bet DApps

This is a Sui-based dApp that collects funds before a match and automatically sends the pooled money to predefined addresses depending on the match result.

## Directory structure

- `contracts`: Sui Move contracts. Build, test, and deploy the on-chain logic here.
- `site_donation`: Frontend application for the charity betting experience.

## How to run frontend

```
cd site_donation
npm install
npm run dev
```

## How to build and run Move contracts

```
cd contracts
sui move build
```

# publish & call examples
```
sui client publish --gas-budget <GAS_BUDGET>
```
# Example: call `bet`
```
sui client call \
  --package <PACKAGE_ID> \
  --module charity_bet \
  --function bet \
  --args <ARGUMENTS_FOR_BET> \
  --gas-budget <GAS_BUDGET>
```

# Example: call `settle`
```
sui client call \
  --package <PACKAGE_ID> \
  --module charity_bet \
  --function settle \
  --args <ARGUMENTS_FOR_SETTLE> \
  --gas-budget <GAS_BUDGET>
```

## Recommended environment
- Node.js 18 or later
- Package manager: `pnpm`（a `pnpm-lock.yaml` is included in this repository）
- Sui CLI

