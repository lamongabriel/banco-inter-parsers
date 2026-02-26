import { Transaction, InternalActivityType } from '../types';
import { normalizeDate } from '../utils/date-utils';
import { normalizeAmount } from '../utils/amount-utils';
import { findTicker } from '../services/ticker-service';
import { getHistoricalPrice } from '../services/price-service';
import { logger } from '../utils/logger';

async function parseTransaction(
  description: string,
  amount: number,
  date: string,
  transactionType: 'Buy' | 'Sell' | null
): Promise<Transaction | null> {
  let symbol: string;
  let unitPrice: number;
  let quantity: number;
  let name: string;
  let activityType: InternalActivityType;

  // BUY transactions
  if (transactionType === 'Buy' || description.match(/^Compra/i)) {
    activityType = 'Buy';
    const assetName = description.replace(/^Compra/i, '').trim();
    symbol = await findTicker(assetName);

    const historicalPrice = await getHistoricalPrice(symbol, date);
    if (historicalPrice) {
      unitPrice = historicalPrice;
      quantity = Math.abs(amount) / historicalPrice;
      logger.transaction(symbol, date, historicalPrice, quantity, Math.abs(amount));
    } else {
      unitPrice = Math.abs(amount);
      quantity = 1;
      logger.warn(`Using fallback for ${symbol}: $${unitPrice.toFixed(2)} x ${quantity}`);
    }
    
    name = `BUY ${quantity.toFixed(6)} of ${assetName} at $${unitPrice.toFixed(2)} each`;
  }
  // SELL transactions
  else if (transactionType === 'Sell' || description.match(/^Venda/i)) {
    activityType = 'Sell';
    const assetName = description.replace(/^Venda/i, '').trim();
    symbol = await findTicker(assetName);

    const historicalPrice = await getHistoricalPrice(symbol, date);
    if (historicalPrice) {
      unitPrice = historicalPrice;
      quantity = Math.abs(amount) / historicalPrice;
      logger.transaction(symbol, date, historicalPrice, quantity, Math.abs(amount));
    } else {
      unitPrice = Math.abs(amount);
      quantity = 1;
      logger.warn(`Using fallback for ${symbol}: $${unitPrice.toFixed(2)} x ${quantity}`);
    }
    
    name = `SELL ${quantity.toFixed(6)} of ${assetName} at $${unitPrice.toFixed(2)} each`;
  }
  // DEPOSIT transactions
  else if (
    description.match(/Depósito.*Global Account/i) ||
    description.match(/^DepósitoGlobal Account/i)
  ) {
    activityType = 'Contribution';
    symbol = '$CASH-USD';
    unitPrice = 1.0;
    quantity = Math.abs(amount);
    name = `DEPOSIT $${Math.abs(amount).toFixed(2)}`;
  }
  // WITHDRAWAL transactions
  else if (
    description.match(/Resgate.*Global Account/i) ||
    description.match(/^ResgateGlobal Account/i)
  ) {
    activityType = 'Withdrawal';
    symbol = '$CASH-USD';
    unitPrice = 1.0;
    quantity = Math.abs(amount);
    name = `WITHDRAWAL $${Math.abs(amount).toFixed(2)}`;
  }
  // DIVIDEND transactions
  else if (description.match(/^Pagamento De Dividendos/i)) {
    activityType = 'Dividend';
    const assetName = description.replace(/^Pagamento De Dividendos/i, '').trim();
    symbol = assetName ? await findTicker(assetName) : 'UNKNOWN';
    unitPrice = Math.abs(amount);
    quantity = 1;
    name = `DIVIDEND from ${assetName || 'Unknown'} - $${Math.abs(amount).toFixed(2)}`;
  }
  // TAX transactions
  else if (description.match(/^Imposto Sobre Dividendos/i)) {
    activityType = 'Tax';
    const assetName = description.replace(/^Imposto Sobre Dividendos/i, '').trim();
    symbol = '$CASH-USD'; // Tax is always a cash activity
    unitPrice = Math.abs(amount);
    quantity = 1;
    name = `TAX on ${assetName || 'Unknown'} dividends - $${Math.abs(amount).toFixed(2)}`;
  }
  // DIVIDEND transactions (alternate format)
  else if (description.match(/^Recebimento De Dividendos/i)) {
    activityType = 'Dividend';
    const assetName = description.replace(/^Recebimento De Dividendos/i, '').trim();
    symbol = assetName || 'RESIDUAL_DIVIDENDS';
    unitPrice = Math.abs(amount);
    quantity = 1;
    name = `DIVIDEND from ${assetName || 'Residual'} - $${Math.abs(amount).toFixed(2)}`;
  }
  // FEE transactions
  else if (description.match(/^CONVERT TO DRIVEWEALTH/i)) {
    activityType = 'Fee';
    symbol = '$CASH-USD';
    unitPrice = Math.abs(amount);
    quantity = 1;
    name = `FEE Platform conversion - $${Math.abs(amount).toFixed(2)}`;
  }
  // Fallback detection
  else {
    if (description.match(/dividend/i) || description.match(/divid/i)) {
      activityType = 'Dividend';
      symbol = 'UNKNOWN';
      unitPrice = Math.abs(amount);
      quantity = 1;
      name = `DIVIDEND ${description} - $${Math.abs(amount).toFixed(2)}`;
    } else if (description.match(/imposto/i) || description.match(/tax/i)) {
      activityType = 'Tax';
      symbol = '$CASH-USD'; // Tax is always a cash activity
      unitPrice = Math.abs(amount);
      quantity = 1;
      name = `TAX ${description} - $${Math.abs(amount).toFixed(2)}`;
    } else {
      activityType = 'Other';
      symbol = '$CASH-USD';
      unitPrice = Math.abs(amount);
      quantity = 1;
      name = `OTHER ${description || 'Unknown transaction'} - $${Math.abs(amount).toFixed(2)}`;
    }
  }

  // Calculate total amount based on activity type
  const totalAmount = Math.abs(amount);

  return {
    date,
    symbol,
    currency: 'USD',
    quantity: parseFloat(quantity.toFixed(6)),
    unitPrice: parseFloat(unitPrice.toFixed(4)),
    activityType,
    fee: 0, // Banco Inter doesn't provide separate fee information
    amount: parseFloat(totalAmount.toFixed(2)),
    comment: name, // Populate comment with same value as name
    name,
  };
}

export async function parseTransactions(pdfText: string): Promise<Transaction[]> {
  const lines = pdfText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let currentDate: string | null = null;
  const records: Transaction[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect date header
    const parsedDate = normalizeDate(line);
    if (parsedDate) {
      currentDate = parsedDate;
      continue;
    }

    // Skip lines without US$ amounts
    if (!line.includes('US$')) continue;

    const amount = normalizeAmount(line);
    if (amount === null || currentDate === null) continue;

    let description = line.replace(/([+-])US\$ .*/, '').trim();

    // Look backwards to find Compra/Venda if current line doesn't contain it
    let fullDescription = description;
    let transactionType: 'Buy' | 'Sell' | null = null;

    if (!description.match(/^(Compra|Venda)/i)) {
      for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
        const prevLine = lines[j];

        if (normalizeDate(prevLine) || prevLine.includes('US$')) break;

        if (prevLine.match(/^Compra/i)) {
          transactionType = 'Buy';
          const combinedParts: string[] = [];
          for (let k = j; k <= i; k++) {
            const part = lines[k].replace(/([+-])US\$ .*/, '').trim();
            if (part) combinedParts.push(part);
          }
          fullDescription = combinedParts.join(' ');
          break;
        } else if (prevLine.match(/^Venda/i)) {
          transactionType = 'Sell';
          const combinedParts: string[] = [];
          for (let k = j; k <= i; k++) {
            const part = lines[k].replace(/([+-])US\$ .*/, '').trim();
            if (part) combinedParts.push(part);
          }
          fullDescription = combinedParts.join(' ');
          break;
        }
      }
    }

    description = fullDescription;

    const transaction = await parseTransaction(
      description,
      amount,
      currentDate,
      transactionType
    );

    if (transaction) {
      records.push(transaction);
    }
  }

  return records;
}
