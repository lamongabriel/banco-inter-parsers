import * as fs from 'fs';
import { logger } from '../utils/logger';

interface Transaction {
  date: string;
  description: string;
  amount: string;
}

/**
 * Parse date from DD/MM/YYYY to YYYY-MM-DD
 */
function parseDate(dateStr: string): string {
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month}-${day}`;
}

/**
 * Convert text to title case (First Letter Uppercase for each word)
 */
function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Determine transaction type and format description
 */
function formatDescription(rawDescription: string): string {
  // Remove all quotes
  let desc = rawDescription.replace(/"/g, '');
  
  // Clean up multiple consecutive spaces
  desc = desc.replace(/\s+/g, ' ').trim();
  
  // Extract type and content
  const patterns = [
    { regex: /^Pix enviado:\s*(.+)$/i, type: 'Pix' },
    { regex: /^Pix recebido:\s*(.+)$/i, type: 'Pix' },
    { regex: /^Pagamento efetuado:\s*(.+)$/i, type: 'Payment' },
    { regex: /^Pagamento de Convenio:\s*(.+)$/i, type: 'Payment' },
    { regex: /^Aplicacao:\s*(.+)$/i, type: 'Investment' },
    { regex: /^Resgate:\s*(.+)$/i, type: 'Withdraw' },
    { regex: /^Credito Evento B3:\s*(.+)$/i, type: 'Credit' },
    { regex: /^Credito liberado:\s*(.+)$/i, type: 'Credit' },
    { regex: /^Cred Pontos Cashback Extra:\s*(.+)$/i, type: 'Cashback' },
    { regex: /^Cashback:\s*(.+)$/i, type: 'Cashback' },
    { regex: /^Compra no debito:\s*(.+)$/i, type: 'Debit Purchase' },
    { regex: /^Debito - Inter Tag:\s*(.+)$/i, type: 'Debit' },
    { regex: /^Deb Mensal\. Intertag:\s*(.+)$/i, type: 'Debit' },
    { regex: /^DARF NUMERADO$/i, type: 'Tax' },
    { regex: /^IOF:\s*(.+)$/i, type: 'Tax' },
  ];

  for (const pattern of patterns) {
    const match = desc.match(pattern.regex);
    if (match) {
      const content = match[1] ? toTitleCase(match[1].trim()) : '';
      return content ? `${pattern.type} - ${content}` : pattern.type;
    }
  }

  // If no pattern matches, just title case the whole thing
  return toTitleCase(desc);
}

/**
 * Parse a single CSV line respecting semicolon delimiter
 */
function parseCsvLine(line: string): string[] {
  return line.split(';').map(field => field.trim());
}

/**
 * Clean the Inter CSV file
 */
export async function cleanInterCSV(inputPath: string, outputPath: string): Promise<void> {
  logger.info('Reading CSV file...');
  const content = fs.readFileSync(inputPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  // Find the header line (starts with "Data Lançamento")
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('Data Lançamento') || lines[i].startsWith('Data Lancamento')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error('Could not find header line in CSV');
  }

  logger.info('Parsing transactions...');
  const dataLines = lines.slice(headerIndex + 1);
  const transactions: Transaction[] = [];

  for (const line of dataLines) {
    if (!line.trim()) continue;
    
    const fields = parseCsvLine(line);
    if (fields.length < 3) continue;

    const [date, description, amount] = fields;
    
    try {
      transactions.push({
        date: parseDate(date),
        description: formatDescription(description),
        amount: amount,
      });
    } catch (error) {
      logger.warn(`Skipping invalid line: ${line}`);
    }
  }

  logger.info('Grouping consecutive withdrawals...');
  // Group consecutive "Withdraw - Cdb Porq Obj Banco Inter" transactions
  const groupedTransactions: Transaction[] = [];
  let i = 0;
  
  while (i < transactions.length) {
    const current = transactions[i];
    
    // Check if this is a CDB withdrawal and if there are consecutive ones
    if (current.description.match(/^Withdraw - Cdb Porq Obj Banco Inter/i)) {
      const sameDate = current.date;
      let totalAmount = parseFloat(current.amount.replace(',', '.'));
      let consecutiveCount = 1;
      
      // Look ahead for consecutive CDB withdrawals on the same date
      while (i + consecutiveCount < transactions.length) {
        const next = transactions[i + consecutiveCount];
        if (next.date === sameDate && next.description.match(/^Withdraw - Cdb Porq Obj Banco Inter/i)) {
          totalAmount += parseFloat(next.amount.replace(',', '.'));
          consecutiveCount++;
        } else {
          break;
        }
      }
      
      // If we found consecutive withdrawals, group them
      if (consecutiveCount > 1) {
        groupedTransactions.push({
          date: sameDate,
          description: current.description,
          amount: totalAmount.toFixed(2).replace('.', ','),
        });
        i += consecutiveCount;
      } else {
        groupedTransactions.push(current);
        i++;
      }
    } else {
      groupedTransactions.push(current);
      i++;
    }
  }

  logger.info('Writing cleaned CSV...');
  // Write output with English headers
  const outputLines = ['Date;Description;Amount'];
  
  for (const transaction of groupedTransactions) {
    outputLines.push(`${transaction.date};${transaction.description};${transaction.amount}`);
  }

  fs.writeFileSync(outputPath, outputLines.join('\n'), 'utf-8');
  logger.success(`Cleaned CSV written to: ${outputPath}`);
  logger.info(`Total transactions: ${groupedTransactions.length} (grouped from ${transactions.length})`);
}
