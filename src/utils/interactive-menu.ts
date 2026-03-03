import * as readline from 'readline';

interface MenuOption {
  label: string;
  value: string;
}

export class InteractiveMenu {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * Display a menu and get user selection
   */
  async select(question: string, options: MenuOption[]): Promise<string> {
    console.log(`\n${question}`);
    options.forEach((opt, index) => {
      console.log(`  ${index + 1}. ${opt.label}`);
    });

    const answer = await this.question('\nSelect an option (number): ');
    const selection = parseInt(answer.trim());

    if (isNaN(selection) || selection < 1 || selection > options.length) {
      console.log('Invalid selection. Please try again.');
      return this.select(question, options);
    }

    return options[selection - 1].value;
  }

  /**
   * Ask a question and get user input
   */
  async question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * Ask a yes/no question
   */
  async confirm(question: string): Promise<boolean> {
    const answer = await this.question(`${question} (y/n): `);
    return answer.toLowerCase().trim() === 'y';
  }

  /**
   * Display a message
   */
  log(message: string): void {
    console.log(message);
  }

  /**
   * Close the readline interface
   */
  close(): void {
    this.rl.close();
  }
}
