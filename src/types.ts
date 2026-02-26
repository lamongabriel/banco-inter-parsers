export interface Transaction {
  date: string;
  symbol: string;
  currency: string;
  quantity: number;
  unitPrice: number;
  activityType: InternalActivityType;
  fee: number;
  amount: number;
  comment: string;
  name: string;
}

// Internal activity types used during parsing
export type InternalActivityType = 
  | 'Buy' 
  | 'Sell' 
  | 'Contribution' 
  | 'Withdrawal' 
  | 'Dividend' 
  | 'Interest'
  | 'Fee'
  | 'Tax'
  | 'Other';

// Export format types
export type ExportFormat = 'sure' | 'wealthfolio';

// Sure format activity types (title case)
export type SureActivityType = 
  | 'Buy' 
  | 'Sell' 
  | 'Contribution' 
  | 'Withdrawal' 
  | 'Dividend' 
  | 'Interest'
  | 'Reinvestment'
  | 'Sweep In'
  | 'Sweep Out'
  | 'Fee'
  | 'Exchange'
  | 'Transfer'
  | 'Other';

// Wealthfolio format activity types (uppercase)
export type WealthfolioActivityType = 
  | 'BUY' 
  | 'SELL' 
  | 'DIVIDEND' 
  | 'INTEREST'
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'ADD_HOLDING'
  | 'REMOVE_HOLDING'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'FEE'
  | 'TAX'
  | 'SPLIT';

export interface TickerSearchResult {
  symbol: string;
  name: string;
  quoteType: string;
}

export interface HistoricalPriceData {
  close: number;
  date: Date;
}

export interface ParsedTransaction {
  description: string;
  amount: number;
  date: string;
}

export interface TickerCache {
  [assetName: string]: string;
}
