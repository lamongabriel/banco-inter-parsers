import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

export async function getHistoricalPrice(ticker: string, date: string): Promise<number | null> {
  try {
    const queryDate = new Date(date + 'T00:00:00.000Z');
    const nextDay = new Date(queryDate.getTime() + 24 * 60 * 60 * 1000);

    const result = await yahooFinance.chart(ticker, {
      period1: queryDate,
      period2: nextDay,
      interval: '1d',
    });

    if (result && result.quotes && result.quotes.length > 0) {
      const quote = result.quotes[0];
      if (quote.close !== null && quote.close !== undefined) {
        return quote.close;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}
