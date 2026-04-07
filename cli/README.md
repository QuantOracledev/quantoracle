# quantoracle-cli

63 quant computation tools in your terminal. Zero dependencies.

```
npm install -g quantoracle-cli
```

Or run without installing:

```
npx quantoracle-cli bs --spot 185 --strike 190 --expiry 0.25 --vol 0.25
```

## Quick Start

```bash
# Black-Scholes with 10 Greeks
quantoracle bs --spot 185 --strike 190 --expiry 0.25 --vol 0.25

# Kelly criterion
quantoracle kelly --win-rate 0.55 --avg-win 120 --avg-loss 100

# Monte Carlo simulation
quantoracle mc --value 80000 --return 0.10 --vol 0.18 --years 2

# Implied volatility
quantoracle iv --spot 195 --strike 200 --expiry 0.5 --price 12.50

# Bond pricing
quantoracle bond --coupon 0.05 --ytm 0.04 --years 10

# CAGR
quantoracle cagr --start 80000 --end 120000 --years 3

# Liquidation price
quantoracle liq --entry 50000 --collateral 5000 --size 50000 --leverage 10 --direction long
```

## JSON Output

Pipe to `jq` for scripting:

```bash
quantoracle bs --spot 185 --strike 190 --expiry 0.25 --vol 0.25 --json | jq '.greeks.delta'

quantoracle kelly --win-rate 0.55 --avg-win 120 --avg-loss 100 --json | jq '.half_kelly'
```

## Data Input

```bash
# Inline comma-separated
quantoracle stats sharpe --returns "0.01,-0.005,0.008,-0.012,0.015"

# From file (one value per line)
quantoracle risk portfolio --returns @returns.txt

# CSV file (header = asset names, columns = returns)
quantoracle optimize --file portfolio.csv
```

## All Commands

| Category | Commands |
|----------|----------|
| **Options** | `price` (bs), `iv`, `strategy`, `payoff` |
| **Derivatives** | `binomial`, `barrier`, `asian`, `lookback`, `parity`, `chain`, `volsurf` |
| **Risk** | `portfolio` (risk), `kelly`, `size`, `drawdown`, `correlation`, `var`, `stress`, `txcost` |
| **Indicators** | `technical` (ta), `regime`, `crossover`, `bollinger`, `fibonacci`, `atr` |
| **Stats** | `regression`, `poly`, `cointegration`, `hurst`, `garch`, `zscore`, `distfit`, `corrmatrix`, `realvol`, `normal`, `sharpe`, `psharpe` |
| **Portfolio** | `optimize`, `riskparity` |
| **Simulate** | `mc` |
| **Fixed Income** | `bond`, `amort`, `yieldcurve`, `credit` |
| **Crypto** | `il`, `apy`, `liquidation` (liq), `funding`, `slippage`, `vesting`, `rebalance` |
| **FX** | `irp`, `ppp`, `forward`, `carry` |
| **Macro** | `inflation`, `taylor`, `realyield` |
| **TVM** | `pv`, `fv`, `irr`, `npv`, `cagr` |

## Global Flags

```
--json          Raw JSON output (for piping)
--api-key KEY   API key (or QUANTORACLE_API_KEY env var)
--url URL       Override API base URL
--verbose       Show request/response details
--no-color      Disable colors
```

## Scripting Examples

```bash
# Backtest loop
for month in jan feb mar apr; do
  returns=$(cat returns_${month}.csv | tr '\n' ',')
  quantoracle kelly --returns "$returns" --json | jq '.half_kelly'
done

# Portfolio scan
for mode in max_sharpe min_vol risk_parity; do
  echo "=== $mode ==="
  quantoracle optimize --file returns.csv --mode $mode
done

# Conditional trade sizing
rsi=$(quantoracle ta --prices "$(cat spy.txt | tr '\n' ',')" --json | jq '.rsi')
if (( $(echo "$rsi < 30" | bc -l) )); then
  quantoracle size --account 80000 --entry 440 --stop 430
fi
```

## Pricing

1,000 free API calls/day. After that, x402 micropayments (USDC on Base): $0.002-$0.015/call.

## Links

- API: https://quantoracle.dev
- GitHub: https://github.com/QuantOracledev/quantoracle
- MCP Server: `npm install -g @quantoracle/mcp-server`
