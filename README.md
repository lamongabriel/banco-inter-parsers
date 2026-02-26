# Inter PDF Parse

Parse Banco Inter Global PDF statements into CSV format with automatic ticker lookup.

Compatible with **Sure** and **Wealthfolio** portfolio management apps.

## Features

- Parse Banco Inter Global PDF statements
- Automatically lookup stock/ETF tickers using Yahoo Finance
- Fetch historical prices for accurate quantity calculations
- Cache ticker mappings for future runs
- Interactive prompts when tickers cannot be found
- Export to Sure or Wealthfolio format
- Simplified mode for Buy/Sell only transactions

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Usage

### Development (no build required)

```bash
npm run dev -- -i ./input/statement.pdf -o ./output/transactions.csv
```

### Production (using built version)

First build the project:

```bash
npm run build
```

Then run:

```bash
node dist/index.js -i ./input/statement.pdf -o ./output/transactions.csv
```

Or using npm scripts:

```bash
npm start -- -i ./input/statement.pdf -o ./output/transactions.csv
```

### Options

- `-i, --input <path>` - Path to the input PDF file (required)
- `-o, --output <path>` - Path to the output CSV file (required)
- `-f, --format <format>` - Export format: "sure" or "wealthfolio" (optional, default: "sure")
- `-s, --simplified` - Simplified mode - only include Buy and Sell transactions (optional)
- `-h, --help` - Display help information
- `-V, --version` - Display version number

### Examples

```bash
# Development mode - Sure format (default)
npm run dev -- -i ./input/january-2025.pdf -o ./output/january-2025.csv

# Wealthfolio format
npm run dev -- -i ./input/january-2025.pdf -o ./output/january-2025.csv --format wealthfolio

# Production mode (built version)
node dist/index.js -i ./input/january-2025.pdf -o ./output/january-2025.csv

# Simplified mode - only Buy/Sell transactions (excludes dividends, taxes, deposits, withdrawals)
npm run dev -- -i ./input/january-2025.pdf -o ./output/january-2025.csv --simplified

# Wealthfolio format with simplified mode
npm run dev -- -i ./input/january-2025.pdf -o ./output/january-2025.csv -f wealthfolio -s
```

## How It Works

1. Extracts text from the PDF statement
2. Identifies transaction types (Buy, Sell, Contribution, Withdrawal, Dividend, Fee, etc.)
3. Looks up ticker symbols using Yahoo Finance search
4. Prompts user to confirm or manually enter tickers when uncertain
5. Fetches historical prices for the transaction dates
6. Calculates accurate quantities based on historical prices
7. Filters transactions if simplified mode is enabled (Buy/Sell only)
8. Exports all data to CSV format

## Ticker Cache

The tool maintains a ticker cache in `.ticker-cache.json` to avoid redundant lookups. This cache is automatically saved after each session and loaded at startup.

## Project Structure

```
input/                          # Place PDF statements here
output/                         # Generated CSV files
src/
├── index.ts                    # CLI entry point
├── types.ts                    # TypeScript type definitions
├── parsers/
│   ├── pdf-parser.ts          # PDF text extraction
│   └── transaction-parser.ts  # Transaction parsing logic
├── services/
│   ├── ticker-service.ts      # Ticker lookup and caching
│   └── price-service.ts       # Historical price fetching
├── writers/
│   └── csv-writer.ts          # CSV output generation
└── utils/
    ├── date-utils.ts          # Date parsing utilities
    ├── amount-utils.ts        # Amount parsing utilities
    ├── logger.ts              # Colored console logging
    └── activity-mapper.ts     # Activity type format mapping
```

## Development

Run directly with TypeScript (no build required):

```bash
npm run dev -- -i ./input/statement.pdf -o ./output/transactions.csv
```

## Output Format

The CSV format differs between Sure and Wealthfolio:

### Sure Format

Includes the following columns (title case headers):

- `Date` - Transaction date (YYYY-MM-DD format)
- `Ticker` - Stock/asset ticker symbol
- `Currency` - Always USD
- `Quantity` - Number of shares/units
- `Price` - Price per share/unit
- `Activity Type` - Operation type (Buy, Sell, Contribution, etc.)
- `Name` - Descriptive name with operation details

### Wealthfolio Format

Includes the following columns (lowercase headers):

- `date` - Transaction date (ISO-8601 format)
- `symbol` - Stock/asset ticker symbol
- `quantity` - Number of shares/units
- `activityType` - Type of transaction (BUY, SELL, DEPOSIT, etc.)
- `unitPrice` - Price per share/unit
- `currency` - Transaction currency (USD)
- `fee` - Transaction fee (always 0 for Banco Inter)
- `amount` - Total transaction amount
- `comment` - Descriptive transaction details

**Note:** For cash activities in Wealthfolio (DIVIDEND, DEPOSIT, WITHDRAWAL, TAX, FEE, INTEREST), the `amount` field is mandatory and represents the total cash impact. TAX transactions always use `$CASH-USD` as the symbol since they are cash activities.

### Activity Types

The parser automatically maps Banco Inter transactions to the appropriate format:

#### Sure Format (default)

Title case activity types compatible with Sure app:

| Activity Type | Banco Inter Transaction | Description |
|--------------|------------------------|-------------|
| Buy | Compra | Purchase of securities |
| Sell | Venda | Sale of securities |
| Contribution | Depósito | Money added to the investment account |
| Withdrawal | Resgate | Money removed from the investment account |
| Dividend | Pagamento/Recebimento de Dividendos | Dividend payments received |
| Interest | - | Interest earned |
| Fee | Taxas, Impostos | Account or transaction fees |
| Other | - | Miscellaneous transactions |

#### Wealthfolio Format

Uppercase activity types compatible with Wealthfolio:

| Activity Type | Banco Inter Transaction | Description |
|--------------|------------------------|-------------|
| BUY | Compra | Purchase of a security or other asset |
| SELL | Venda | Disposal of a security or other asset |
| DEPOSIT | Depósito | Incoming funds from outside |
| WITHDRAWAL | Resgate | Outgoing funds to external account |
| DIVIDEND | Pagamento/Recebimento de Dividendos | Cash dividend paid into account |
| INTEREST | - | Interest earned on cash or fixed-income |
| FEE | Taxas | Stand-alone brokerage or platform fee |
| TAX | Imposto sobre Dividendos | Tax paid from the account |

### Name Format Examples

The `Name` field includes operation type and details for easy identification:

- **BUY** - `BUY 10.500000 of Apple Inc at $150.25 each`
- **SELL** - `SELL 5.250000 of Microsoft Corporation at $380.50 each`
- **DEPOSIT** - `DEPOSIT $1000.00`
- **WITHDRAWAL** - `WITHDRAWAL $500.00`
- **DIVIDEND** - `DIVIDEND from Apple Inc - $25.50`
- **TAX** - `TAX on Apple Inc dividends - $3.83`
- **FEE** - `FEE Platform conversion - $10.00`

### Example CSV Output

#### Sure Format
```csv
Date,Ticker,Currency,Quantity,Price,Activity Type,Name
2024-01-15,AAPL,USD,10.500000,150.25,Buy,BUY 10.500000 of Apple Inc at $150.25 each
2024-01-16,MSFT,USD,5.250000,380.50,Sell,SELL 5.250000 of Microsoft Corporation at $380.50 each
2024-01-17,$CASH-USD,USD,1000.00,1.00,Contribution,DEPOSIT $1000.00
2024-01-18,AAPL,USD,1,25.50,Dividend,DIVIDEND from Apple Inc - $25.50
2024-01-19,AAPL,USD,1,3.83,Fee,TAX on Apple Inc dividends - $3.83
```

#### Wealthfolio Format
```csv
date,symbol,quantity,activityType,unitPrice,currency,fee,amount,comment
2024-01-15,AAPL,10.500000,BUY,150.25,USD,0,1577.63,BUY 10.500000 of Apple Inc at $150.25 each
2024-01-16,MSFT,5.250000,SELL,380.50,USD,0,1997.63,SELL 5.250000 of Microsoft Corporation at $380.50 each
2024-01-17,$CASH-USD,1.00,DEPOSIT,1.00,USD,0,1000.00,DEPOSIT $1000.00
2024-01-18,AAPL,1,DIVIDEND,25.50,USD,0,25.50,DIVIDEND from Apple Inc - $25.50
2024-01-19,$CASH-USD,1,TAX,3.83,USD,0,3.83,TAX on Apple Inc dividends - $3.83
```

## Format Comparison

### Key Differences

| Aspect | Sure Format | Wealthfolio Format |
|--------|-------------|-------------------|
| **Headers** | Title Case (e.g., `Date`, `Ticker`) | lowercase (e.g., `date`, `symbol`) |
| **Activity Type Case** | Title Case (e.g., `Buy`, `Sell`) | UPPERCASE (e.g., `BUY`, `SELL`) |
| **Column Order** | Date, Ticker, Currency, Quantity, Price, Activity Type, Name | date, symbol, quantity, activityType, unitPrice, currency, fee, amount, comment |
| **Deposits** | `Contribution` | `DEPOSIT` |
| **Withdrawals** | `Withdrawal` | `WITHDRAWAL` |
| **Tax Treatment** | Mapped to `Fee` | Explicit `TAX` type |
| **Tax Symbol** | N/A | Always `$CASH-USD` (cash activity) |
| **Platform Fees** | `Fee` | `FEE` |
| **Name Column** | Included (descriptive details) | Not included |
| **Comment Column** | Not included | Included (descriptive details) |
| **Fee Column** | Not included | Included (always 0) |
| **Amount Column** | Not included | Included (mandatory for cash activities) |

### Which Format Should I Use?

- **Use Sure format** (`--format sure`) if you're importing into the Sure portfolio management app
- **Use Wealthfolio format** (`--format wealthfolio`) if you're importing into Wealthfolio

The Wealthfolio format follows their CSV import specification exactly, with lowercase column names and the exact column order expected by their import tool.

### Simplified Mode

Adding the `--simplified` flag works with both formats and filters out:
- Deposits/Contributions
- Withdrawals
- Dividends
- Fees
- Taxes

Only **Buy** and **Sell** transactions are included in the output.
