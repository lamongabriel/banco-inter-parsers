import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import YahooFinance from 'yahoo-finance2';
import { TickerCache } from '../types';
import { logger } from '../utils/logger';

const CACHE_FILE = path.join(process.cwd(), '.ticker-cache.json');
const yahooFinance = new YahooFinance();

let tickerCache: TickerCache = {};

export function loadCache(): void {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf-8');
      tickerCache = JSON.parse(data);
      const count = Object.keys(tickerCache).length;
      if (count > 0) {
        logger.info(`Loaded ${count} cached ticker${count === 1 ? '' : 's'}`);
      }
    }
  } catch (error) {
    logger.warn('Failed to load ticker cache');
  }
}

function saveCache(): void {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(tickerCache, null, 2));
  } catch (error) {
    logger.warn('Failed to save ticker cache');
  }
}

async function confirmTicker(
  assetName: string,
  ticker: string,
  name: string
): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      `Is "${ticker}" (${name}) correct for "${assetName}"? (y/n): `,
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      }
    );
  });
}

async function promptForTicker(assetName: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      `Could not find ticker for "${assetName}". Please enter the correct ticker symbol: `,
      (answer) => {
        rl.close();
        const ticker = answer.trim().toUpperCase();
        logger.success(`Saved: "${assetName}" -> ${ticker}`);
        resolve(ticker);
      }
    );
  });
}

export async function findTicker(assetName: string): Promise<string> {
  const cleanName = assetName.trim();

  // Check cache first
  if (tickerCache[cleanName]) {
    return tickerCache[cleanName];
  }

  // Try searching Yahoo Finance
  try {
    logger.info(`Searching: "${cleanName}"`);
    const searchResult = await yahooFinance.search(cleanName, {
      quotesCount: 10,
      newsCount: 0,
    });

    if (searchResult?.quotes && searchResult.quotes.length > 0) {
      // Prefer ETFs and stocks
      const bestMatch = searchResult.quotes.find(
        (q) => q.quoteType === 'ETF' || q.quoteType === 'EQUITY'
      ) || searchResult.quotes[0];

      const ticker = String(bestMatch.symbol || '');
      const name = String(bestMatch.longname || bestMatch.shortname || '');

      if (!ticker) {
        logger.warn('No ticker symbol found in search result');
      } else {
        logger.success(`Found: ${ticker} (${name})`);
        
        // Ask user to confirm
        const confirmed = await confirmTicker(cleanName, ticker, name);
        
        if (confirmed) {
          tickerCache[cleanName] = ticker;
          saveCache();
          return ticker;
        }
      }
    }
  } catch (error) {
    logger.warn('Ticker search failed');
  }

  // If search failed or user rejected, ask for manual input
  const manualTicker = await promptForTicker(cleanName);
  tickerCache[cleanName] = manualTicker;
  saveCache();
  return manualTicker;
}

export function getCache(): TickerCache {
  return { ...tickerCache };
}
