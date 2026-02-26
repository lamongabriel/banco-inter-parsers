#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { extractTextFromPDF } from './parsers/pdf-parser';
import { parseTransactions } from './parsers/transaction-parser';
import { loadCache } from './services/ticker-service';
import { writeTransactionsToCSV } from './writers/csv-writer';
import { logger } from './utils/logger';

const program = new Command();

program
  .name('inter-pdf-parse')
  .description('Parse Banco Inter Global PDF statements into CSV format')
  .version('1.0.0')
  .requiredOption('-i, --input <path>', 'Path to the input PDF file')
  .requiredOption('-o, --output <path>', 'Path to the output CSV file')
  .option('-s, --simplified', 'Simplified mode - only include Buy and Sell transactions')
  .option('-f, --format <format>', 'Export format: "sure" or "wealthfolio"', 'sure')
  .parse();

const options = program.opts();

async function main() {
  const inputPath = path.resolve(options.input);
  const outputPath = path.resolve(options.output);

  // Validate format option
  const format = options.format.toLowerCase();
  if (format !== 'sure' && format !== 'wealthfolio') {
    logger.error(`Invalid format: ${options.format}. Use "sure" or "wealthfolio".`);
    process.exit(1);
  }

  // Validate input file exists
  if (!fs.existsSync(inputPath)) {
    logger.error(`Input file not found: ${inputPath}`);
    process.exit(1);
  }

  // Validate input is a PDF
  if (!inputPath.toLowerCase().endsWith('.pdf')) {
    logger.error('Input file must be a PDF');
    process.exit(1);
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  logger.section('BANCO INTER PDF PARSER');
  logger.data('Input', inputPath);
  logger.data('Output', outputPath);
  logger.data('Format', format === 'sure' ? 'Sure' : 'Wealthfolio');
  logger.data('Mode', options.simplified ? 'Simplified (Buy/Sell only)' : 'Full');

  try {
    // Load ticker cache
    loadCache();

    // Extract text from PDF
    logger.subsection('Extracting PDF');
    const pdfText = await extractTextFromPDF(inputPath);
    logger.success('PDF text extracted');

    // Parse transactions
    logger.subsection('Processing Transactions');
    const transactions = await parseTransactions(pdfText);

    // Filter transactions if simplified mode
    let filteredTransactions = transactions;
    if (options.simplified) {
      const originalCount = transactions.length;
      filteredTransactions = transactions.filter(
        (t) => t.activityType === 'Buy' || t.activityType === 'Sell'
      );
      const excludedCount = originalCount - filteredTransactions.length;
      logger.data('Original transactions', originalCount);
      logger.data('Buy/Sell only', filteredTransactions.length);
      logger.data('Excluded', excludedCount);
    }

    // Write to CSV
    await writeTransactionsToCSV(filteredTransactions, outputPath, format as 'sure' | 'wealthfolio');

    logger.blank();
    logger.success('Processing complete!');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(errorMessage);
    process.exit(1);
  }
}

main();
