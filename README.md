# Banco Inter Parsers

Since Banco Inter's export system sucks ass, I've decided to build a library of parsers I use to make this shitty experience less shitty.

I use this to plug data into [Sure](https://github.com/we-promise/sure) and [Wealthfolio](https://github.com/afadil/wealthfolio) to manage my gigantic wealth of 37 dollars.

## What does this thing do?

Two parsers:

**1. PDF Investments Parser** - Takes those garbage Inter Global investment PDFs and converts them into clean CSVs that Sure/Wealthfolio can actually read. Looks up tickers, grabs historical prices, does the math so you don't have to.

**2. CSV Checking Account Cleaner** - Cleans up the messy Inter checking account CSV exports. Translates to English, fixes dates, removes that stupid balance column, groups transactions, makes it actually usable.

I'm sure there's more coming since this Bank is great at making my day worse.

## How to use

```bash
npm install
npm run dev
```

Follow the prompts. It's pretty straightforward.

## What gets exported?

### PDF Parser outputs:

**Sure format** (default):
- Date, Ticker, Currency, Quantity, Price, Activity Type, Name
- Activity types: Buy, Sell, Contribution, Withdrawal, Dividend, Fee

**Wealthfolio format**:
- date, symbol, quantity, activityType, unitPrice, currency, fee, amount, comment  
- Activity types: BUY, SELL, DEPOSIT, WITHDRAWAL, DIVIDEND, TAX, FEE

Both formats work. Pick whichever app you're using.

### CSV Cleaner outputs:

Takes this mess:
```csv
Data Lançamento;Descrição;Valor;Saldo
04/02/2026;Pix enviado: "Cp :18236120-ELIAS LAMIM FERREIRA 12244765733";-30,00;1.738,33
```

Makes it clean:
```csv
Date;Description;Amount
2026-02-04;Pix - Cp :18236120-Elias Lamim Ferreira 12244765733;-30,00
```

Groups consecutive CDB withdrawals into one line (because who wants 26 separate lines for the same damn thing).

## That's it

It works. Put your files in `input/`, run the script, get clean CSVs in `output/`. Done.
