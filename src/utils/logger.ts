import chalk from 'chalk';

export const logger = {
  section: (title: string) => {
    console.log('\n' + chalk.bold.cyan('═'.repeat(60)));
    console.log(chalk.bold.cyan(`  ${title}`));
    console.log(chalk.bold.cyan('═'.repeat(60)));
  },

  subsection: (title: string) => {
    console.log('\n' + chalk.bold.blue(`▸ ${title}`));
  },

  success: (message: string) => {
    console.log(chalk.green('✓ ') + message);
  },

  info: (message: string) => {
    console.log(chalk.blue('ℹ ') + message);
  },

  warn: (message: string) => {
    console.log(chalk.yellow('⚠ ') + message);
  },

  error: (message: string) => {
    console.log(chalk.red('✗ ') + message);
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
};
