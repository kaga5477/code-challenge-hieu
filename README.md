# Fancy Form
In this problem I used **Vite & React** (Typescript + SWC).

Firstly, we need to install required packages:
```
npm i
```
To run source code:
```
npm run dev
```

# Three ways to sum to n

```
var sum_to_n_a = function(n) {
    let sum = 0;
    for (let i = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
};

var sum_to_n_b = function(n) {
    return (n * (n + 1)) / 2;
};

var sum_to_n_c = function(n) {
    if (n <= 1) return n;
    return n + sum_to_n_c(n - 1);
};
```

# Messy React

## Computational inefficiencies and anti-patterns

1. `WalletBalance` is missing the blockchain field which is accessed by `balance.blockchain` in `sortedBalances` function.
2. `FormattedWalletBalance` could extend `WalletBalance` and add `formatted` field.
3. `getPriority(blockchain: any)` uses `any`. Replace `any` with `string`.
4. Moved `getPriority` outside the component to avoid re-rendering many times.
5. Remove `children` as it is not used.
```const { children, ...rest } = props; ```

6. Undefined `lhsPriority` variable in filter.
```
...
const balancePriority = getPriority(balance.blockchain);
if (lhsPriority > -99) {
...
```
7. Filtering logic is wrong. Should be `balance.amount > 0`.
8. Sorting logic has not covered equal case.
9. The code first creates `formattedBalances` by mapping over `sortedBalances`, and then it creates rows by mapping over `sortedBalances` again while `WalletRow` needs `formattedBalances`. We could combine the sorting and formatting into a single map operation and correct the row mapping with one and only `sortedAndFormattedBalances`.
```
const sortedBalances = useMemo(() => {
    return balances.filter((balance: WalletBalance) => {
    // ...
}, [balances, prices]);

const formattedBalances = sortedBalances.map((balance: WalletBalance) => {
    return {
        ...balance,
        formatted: balance.amount.toFixed()
    }
})

const rows = sortedBalances.map((balance: FormattedWalletBalance, index: number) => { // should be formattedBalances
    const usdValue = prices[balance.currency] * balance.amount;
    return (
        <WalletRow 
        // ...
```
10. `prices` is not relevant in the useMemo, should be removed from dependency.
11. Should not use `index` as a `key`. If the `sortedBalances` array changes (filtering, reordering,..), it might not correctly identify which items have changed, leading to unexpected UI behavior, performance issues, or bugs in child components.

## Refactored code

```
interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string; // Add blockchain field
}

interface FormattedWalletBalance extends WalletBalance { // Extend existing interface
  formatted: string;
}

interface Props extends BoxProps {}

const getPriority = (blockchain: string): number => { // any => string
  switch (blockchain) {
    case 'Osmosis': return 100;
    case 'Ethereum': return 50;
    case 'Arbitrum': return 30;
    case 'Zilliqa':
    case 'Neo': return 20; // Both return 20
    default: return -99;
  }
};

const WalletPage: React.FC<Props> = (props) => {
  const { ...rest } = props; // Remove children as it is not used
  const balances = useWalletBalances();
  const prices = usePrices();

// Combine formatting into the same map operation
const sortedAndFormattedBalances  = useMemo(() => {
    return balances
        .filter((balance: WalletBalance) => getPriority(balance.blockchain) > -99 && balance.amount > 0) 
        // Cleaner and correct filtering logic
        .sort((lhs: WalletBalance, rhs: WalletBalance) => getPriority(rhs.blockchain) - getPriority(lhs.blockchain))
        // Cleaner sorting implementation and cover equal priorities case
        .map((balance: WalletBalance) => {
            return {
                ...balance,
                formatted: balance.amount.toFixed(2), // Use toFixed with a parameter for consistency
            } as FormattedWalletBalance; // Assert to the extended interface
        });
}, [balances]); // prices is not relevant in this memo

const rows = sortedAndFormattedBalances.map((balance: FormattedWalletBalance) => { // Correct variable
    const usdValue = prices[balance.currency] * balance.amount;
    return (
      <WalletRow
        className={classes.row}
        // Use a stable unique key instead of index, assuming balance.currency is unique
        key={balance.currency} 
        amount={balance.amount}
        usdValue={usdValue}
        formattedAmount={balance.formatted}
      />
    );
  });

  return <div {...rest}>{rows}</div>;
};
```