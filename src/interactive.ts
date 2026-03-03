#!/usr/bin/env node

import * as path from 'path';
import * as fs from 'fs';
import { extractTextFromPDF } from './parsers/pdf-parser';
import { parseTransactions } from './parsers/transaction-parser';
import { cleanInterCSV } from './parsers/csv-cleaner';
import { loadCache } from './services/ticker-service';
import { writeTransactionsToCSV } from './writers/csv-writer';
import { logger } from './utils/logger';
import { InteractiveMenu } from './utils/interactive-menu';

const PARSERS = {
  PDF_INVESTMENTS: {
    name: 'Inter Global Investments',
    value: 'pdf-investments',
    input: 'PDF',
    output: 'CSV',
    description: 'Converts investment PDFs to Sure/Wealthfolio format',
    formats: ['sure', 'wealthfolio'],
    defaultFormat: 'sure',
  },
  CSV_CHECKING: {
    name: 'Inter Checking Account',
    value: 'csv-checking',
    input: 'CSV',
    output: 'CSV',
    description: 'Cleans checking account exports',
    formats: [],
    defaultFormat: null,
  },
};

async function main() {
  const menu = new InteractiveMenu();

  try {
    // Display welcome banner
    console.clear();
    logger.section('BANCO INTER PARSERS LIBRARY');
    console.log('');

    // Display parsers table
    logger.table(
      ['#', 'Parser Name', 'Input', 'Output', 'Description'],
      [
        ['1', PARSERS.PDF_INVESTMENTS.name, PARSERS.PDF_INVESTMENTS.input, PARSERS.PDF_INVESTMENTS.output, PARSERS.PDF_INVESTMENTS.description],
        ['2', PARSERS.CSV_CHECKING.name, PARSERS.CSV_CHECKING.input, PARSERS.CSV_CHECKING.output, PARSERS.CSV_CHECKING.description],
      ],
      [3, 25, 8, 8, 45]
    );

    // Select parser type
    const parserType = await menu.select(
      '\nWhich parser would you like to use?',
      [
        { label: `${PARSERS.PDF_INVESTMENTS.name}`, value: PARSERS.PDF_INVESTMENTS.value },
        { label: `${PARSERS.CSV_CHECKING.name}`, value: PARSERS.CSV_CHECKING.value },
      ]
    );

    // Get input file path
    const inputPath = await menu.question('\nEnter the input file path: ');
    const resolvedInputPath = path.resolve(inputPath.trim());

    // Validate input file exists
    if (!fs.existsSync(resolvedInputPath)) {
      logger.error(`Input file not found: ${resolvedInputPath}`);
      menu.close();
      process.exit(1);
    }

    // Get output file path
    const defaultOutputName =
      parserType === PARSERS.PDF_INVESTMENTS.value ? 'transactions.csv' : 'cleaned-statement.csv';
    
    // Use repo's output folder (from where the script is run)
    const defaultOutputPath = path.join(process.cwd(), 'output', defaultOutputName);

    const outputPath = await menu.question(
      `\nEnter the output file path (default: ${defaultOutputPath}): `
    );
    const resolvedOutputPath = outputPath.trim() || defaultOutputPath;

    // Ensure output directory exists
    const outputDir = path.dirname(resolvedOutputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let format: string | null = null;
    let simplified = false;

    // Parser-specific options
    if (parserType === PARSERS.PDF_INVESTMENTS.value) {
      // Validate input is a PDF
      if (!resolvedInputPath.toLowerCase().endsWith('.pdf')) {
        logger.error('Input file must be a PDF');
        menu.close();
        process.exit(1);
      }

      // Select export format
      format = await menu.select(
        '\nSelect export format:',
        [
          { label: 'Sure (dividend tracking)', value: 'sure' },
          { label: 'Wealthfolio (portfolio management)', value: 'wealthfolio' },
        ]
      );

      // Ask about simplified mode
      simplified = await menu.confirm(
        '\nWould you like simplified mode? (only Buy/Sell transactions)'
      );
    } else if (parserType === PARSERS.CSV_CHECKING.value) {
      // Validate input is a CSV
      if (!resolvedInputPath.toLowerCase().endsWith('.csv')) {
        logger.error('Input file must be a CSV');
        menu.close();
        process.exit(1);
      }
    }

    menu.close();

    // Display configuration
    console.log('');
    logger.section('CONFIGURATION');
    console.log('');
    
    const configRows: string[][] = [
      ['Parser', parserType === PARSERS.PDF_INVESTMENTS.value 
        ? PARSERS.PDF_INVESTMENTS.name 
        : PARSERS.CSV_CHECKING.name],
      ['Input', resolvedInputPath],
      ['Output', resolvedOutputPath],
    ];
    
    if (format) {
      configRows.push(['Format', format === 'sure' ? 'Sure' : 'Wealthfolio']);
    }
    
    if (parserType === PARSERS.PDF_INVESTMENTS.value) {
      configRows.push(['Mode', simplified ? 'Simplified (Buy/Sell only)' : 'Full']);
    }
    
    logger.table(
      ['Setting', 'Value'],
      configRows,
      [15, 70]
    );
    console.log('');

    // Execute parser
    if (parserType === PARSERS.PDF_INVESTMENTS.value) {
      await processPDFInvestments(resolvedInputPath, resolvedOutputPath, format as string, simplified);
    } else if (parserType === PARSERS.CSV_CHECKING.value) {
      await processCSVChecking(resolvedInputPath, resolvedOutputPath);
    }

    logger.blank();
    logger.success('Processing complete!');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(errorMessage);
    menu.close();
    process.exit(1);
  }
}

async function processPDFInvestments(
  inputPath: string,
  outputPath: string,
  format: string,
  simplified: boolean
): Promise<void> {
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
  if (simplified) {
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
}

async function processCSVChecking(inputPath: string, outputPath: string): Promise<void> {
  logger.subsection('Cleaning CSV');
  await cleanInterCSV(inputPath, outputPath);
}

main();
