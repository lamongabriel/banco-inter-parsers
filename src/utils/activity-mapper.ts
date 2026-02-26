import { 
  InternalActivityType, 
  SureActivityType, 
  WealthfolioActivityType, 
  ExportFormat 
} from '../types';

/**
 * Maps internal activity types to Sure format
 */
export function mapToSureActivity(internal: InternalActivityType): SureActivityType {
  const mapping: Record<InternalActivityType, SureActivityType> = {
    'Buy': 'Buy',
    'Sell': 'Sell',
    'Contribution': 'Contribution',
    'Withdrawal': 'Withdrawal',
    'Dividend': 'Dividend',
    'Interest': 'Interest',
    'Fee': 'Fee',
    'Tax': 'Fee', // Sure uses Fee for taxes
    'Other': 'Other',
  };
  
  return mapping[internal];
}

/**
 * Maps internal activity types to Wealthfolio format
 */
export function mapToWealthfolioActivity(internal: InternalActivityType): WealthfolioActivityType {
  const mapping: Record<InternalActivityType, WealthfolioActivityType> = {
    'Buy': 'BUY',
    'Sell': 'SELL',
    'Contribution': 'DEPOSIT',
    'Withdrawal': 'WITHDRAWAL',
    'Dividend': 'DIVIDEND',
    'Interest': 'INTEREST',
    'Fee': 'FEE',
    'Tax': 'TAX',
    'Other': 'FEE', // Wealthfolio doesn't have 'OTHER', map to FEE
  };
  
  return mapping[internal];
}

/**
 * Maps internal activity type to the specified export format
 */
export function mapActivityType(
  internal: InternalActivityType,
  format: ExportFormat
): SureActivityType | WealthfolioActivityType {
  if (format === 'sure') {
    return mapToSureActivity(internal);
  } else {
    return mapToWealthfolioActivity(internal);
  }
}
