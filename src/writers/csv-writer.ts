import { createObjectCsvWriter } from 'csv-writer';
import { Transaction, ExportFormat } from '../types';
import { mapActivityType } from '../utils/activity-mapper';
import { logger } from '../utils/logger';

export async function writeTransactionsToCSV(
  transactions: Transaction[], 
  outputPath: string,
  format: ExportFormat = 'sure'
): Promise<void> {
  // Map transactions to the target format
  const mappedTransactions = transactions.map(t => ({
    date: t.date,
    symbol: t.symbol,
    currency: t.currency,
    quantity: t.quantity,
    unitPrice: t.unitPrice,
    activityType: mapActivityType(t.activityType, format),
    fee: t.fee,
    amount: t.amount,
    comment: t.comment,
    name: t.name,
  }));

  // Different CSV format for Wealthfolio vs Sure
  const csvWriter = format === 'wealthfolio' 
    ? createObjectCsvWriter({
        path: outputPath,
        header: [
          { id: 'date', title: 'date' },
          { id: 'symbol', title: 'symbol' },
          { id: 'quantity', title: 'quantity' },
          { id: 'activityType', title: 'activityType' },
          { id: 'unitPrice', title: 'unitPrice' },
          { id: 'currency', title: 'currency' },
          { id: 'fee', title: 'fee' },
          { id: 'amount', title: 'amount' },
          { id: 'comment', title: 'comment' },
        ],
      })
    : createObjectCsvWriter({
        path: outputPath,
        header: [
          { id: 'date', title: 'Date' },
          { id: 'symbol', title: 'Ticker' },
          { id: 'currency', title: 'Currency' },
          { id: 'quantity', title: 'Quantity' },
          { id: 'unitPrice', title: 'Price' },
          { id: 'activityType', title: 'Activity Type' },
          { id: 'name', title: 'Name' },
        ],
      });

  await csvWriter.writeRecords(mappedTransactions);
  
  logger.subsection('Export Complete');
  logger.data('File', outputPath);
  logger.data('Records', transactions.length);
  logger.data('Format', format === 'sure' ? 'Sure' : 'Wealthfolio');
}
