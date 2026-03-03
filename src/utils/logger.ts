import chalk from 'chalk';

export const logger = {
  section: (title: string) => {
    console.log('\n' + chalk.bold.cyan('═'.repeat(60)));
    console.log(chalk.bold.cyan(`  ${title}`));
    console.log(chalk.bold.cyan('═'.repeat(60)));
  },

  subsection: (title: string) => {
    console.log('\n' + chalk.bold.blue(`> ${title}`));
  },

  success: (message: string) => {
    console.log(chalk.green('[OK] ') + message);
  },

  info: (message: string) => {
    console.log(chalk.blue('[INFO] ') + message);
  },

  warn: (message: string) => {
    console.log(chalk.yellow('[WARN] ') + message);
  },

  error: (message: string) => {
    console.log(chalk.red('[ERROR] ') + message);
  },

  data: (label: string, value: string | number) => {
    console.log(chalk.gray(`  ${label}: `) + chalk.white(value));
  },

  transaction: (symbol: string, date: string, price: number, quantity: number, amount: number) => {
    console.log(
      chalk.gray('  ') +
      chalk.bold.white(symbol.padEnd(6)) +
      chalk.gray(' │ ') +
      chalk.cyan(date) +
      chalk.gray(' │ ') +
      chalk.green(`$${price.toFixed(2)}`.padEnd(10)) +
      chalk.gray(' × ') +
      chalk.yellow(quantity.toFixed(4).padEnd(10)) +
      chalk.gray(' = ') +
      chalk.white(`$${amount.toFixed(2)}`)
    );
  },

  prompt: (message: string) => {
    console.log(chalk.magenta('? ') + chalk.bold(message));
  },

  blank: () => {
    console.log();
  },

  table: (headers: string[], rows: string[][], columnWidths?: number[]) => {
    // Calculate column widths if not provided
    if (!columnWidths) {
      columnWidths = headers.map((header, i) => {
        const maxRowWidth = Math.max(...rows.map(row => row[i]?.length || 0));
        return Math.max(header.length, maxRowWidth);
      });
    }

    // Draw top border
    const topBorder = '╔' + columnWidths.map(w => '═'.repeat(w + 2)).join('╦') + '╗';
    console.log(chalk.cyan(topBorder));

    // Draw headers
    const headerRow = '║' + headers.map((h, i) => {
      return ' ' + chalk.bold.white(h.padEnd(columnWidths![i])) + ' ';
    }).join(chalk.cyan('║')) + chalk.cyan('║');
    console.log(headerRow);

    // Draw separator
    const separator = '╠' + columnWidths.map(w => '═'.repeat(w + 2)).join('╬') + '╣';
    console.log(chalk.cyan(separator));

    // Draw rows
    rows.forEach((row, rowIndex) => {
      const rowStr = '║' + row.map((cell, i) => {
        return ' ' + chalk.white(cell.padEnd(columnWidths![i])) + ' ';
      }).join(chalk.cyan('║')) + chalk.cyan('║');
      console.log(rowStr);
      
      // Draw row separator except for last row
      if (rowIndex < rows.length - 1) {
        const rowSeparator = '╟' + columnWidths.map(w => '─'.repeat(w + 2)).join('┼') + '╢';
        console.log(chalk.cyan(rowSeparator));
      }
    });

    // Draw bottom border
    const bottomBorder = '╚' + columnWidths.map(w => '═'.repeat(w + 2)).join('╩') + '╝';
    console.log(chalk.cyan(bottomBorder));
  },
};
