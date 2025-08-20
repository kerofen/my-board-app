#!/usr/bin/env node

/**
 * テストランナースクリプト
 * 並列実行、リトライ、結果集計を行う
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class TestRunner {
  constructor(options = {}) {
    this.options = {
      maxRetries: options.maxRetries || 2,
      parallel: options.parallel || false,
      coverage: options.coverage || false,
      verbose: options.verbose || false,
      testPattern: options.testPattern || '',
      ...options,
    };
    
    this.results = {
      passed: [],
      failed: [],
      skipped: [],
      duration: 0,
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async runCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const child = spawn(command, args, {
        stdio: this.options.verbose ? 'inherit' : 'pipe',
        shell: true,
      });

      let stdout = '';
      let stderr = '';

      if (!this.options.verbose) {
        child.stdout?.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr?.on('data', (data) => {
          stderr += data.toString();
        });
      }

      child.on('close', (code) => {
        const duration = Date.now() - startTime;
        resolve({
          code,
          stdout,
          stderr,
          duration,
        });
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async runTests() {
    this.log('🚀 Starting test runner...', 'cyan');
    const startTime = Date.now();

    try {
      // 1. 環境のクリーンアップ
      this.log('🧹 Cleaning up...', 'yellow');
      await this.cleanup();

      // 2. 依存関係のチェック
      this.log('📦 Checking dependencies...', 'yellow');
      await this.checkDependencies();

      // 3. Lintの実行
      if (!this.options.skipLint) {
        this.log('🔍 Running linter...', 'yellow');
        await this.runLint();
      }

      // 4. 単体テストの実行
      this.log('🧪 Running unit tests...', 'yellow');
      await this.runUnitTests();

      // 5. E2Eテストの実行（オプション）
      if (this.options.includeE2E) {
        this.log('🎭 Running E2E tests...', 'yellow');
        await this.runE2ETests();
      }

      // 6. カバレッジレポートの生成
      if (this.options.coverage) {
        this.log('📊 Generating coverage report...', 'yellow');
        await this.generateCoverageReport();
      }

      this.results.duration = Date.now() - startTime;
      this.printSummary();

    } catch (error) {
      this.log(`❌ Test runner failed: ${error.message}`, 'red');
      process.exit(1);
    }
  }

  async cleanup() {
    const dirs = ['.jest-cache', 'coverage', 'test-results'];
    for (const dir of dirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  }

  async checkDependencies() {
    const result = await this.runCommand('npm', ['ls', '--depth=0']);
    if (result.code !== 0 && !result.stderr.includes('extraneous')) {
      throw new Error('Dependencies check failed');
    }
  }

  async runLint() {
    const result = await this.runCommand('npm', ['run', 'lint']);
    if (result.code !== 0) {
      this.log('⚠️  Lint warnings found', 'yellow');
      if (this.options.strict) {
        throw new Error('Lint failed in strict mode');
      }
    } else {
      this.log('✅ Lint passed', 'green');
    }
  }

  async runUnitTests() {
    const args = ['test'];
    
    if (this.options.coverage) {
      args.push('--', '--coverage');
    }
    
    if (this.options.testPattern) {
      args.push('--', this.options.testPattern);
    }
    
    if (this.options.parallel) {
      args.push('--', '--maxWorkers=50%');
    }

    let attempts = 0;
    let lastResult;

    while (attempts <= this.options.maxRetries) {
      if (attempts > 0) {
        this.log(`🔄 Retry attempt ${attempts}/${this.options.maxRetries}`, 'yellow');
      }

      lastResult = await this.runCommand('npm', args);
      
      if (lastResult.code === 0) {
        this.log('✅ Unit tests passed', 'green');
        this.parseTestResults(lastResult.stdout);
        return;
      }

      attempts++;
    }

    this.log('❌ Unit tests failed after retries', 'red');
    if (this.options.verbose) {
      console.log(lastResult.stderr);
    }
    throw new Error('Unit tests failed');
  }

  async runE2ETests() {
    const result = await this.runCommand('npm', ['run', 'test:e2e:ci']);
    
    if (result.code === 0) {
      this.log('✅ E2E tests passed', 'green');
    } else {
      this.log('❌ E2E tests failed', 'red');
      if (!this.options.continueOnError) {
        throw new Error('E2E tests failed');
      }
    }
  }

  async generateCoverageReport() {
    const coveragePath = path.join(process.cwd(), 'coverage', 'lcov-report', 'index.html');
    
    if (fs.existsSync(coveragePath)) {
      this.log(`📊 Coverage report generated at: ${coveragePath}`, 'green');
      
      // カバレッジサマリーを読み込んで表示
      const summaryPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
      if (fs.existsSync(summaryPath)) {
        const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
        const total = summary.total;
        
        this.log('\n📈 Coverage Summary:', 'cyan');
        console.log(`  Lines:      ${this.formatPercentage(total.lines.pct)}%`);
        console.log(`  Statements: ${this.formatPercentage(total.statements.pct)}%`);
        console.log(`  Functions:  ${this.formatPercentage(total.functions.pct)}%`);
        console.log(`  Branches:   ${this.formatPercentage(total.branches.pct)}%`);
      }
    }
  }

  parseTestResults(output) {
    // Jest出力から結果を解析
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    const skippedMatch = output.match(/(\d+) skipped/);
    
    if (passedMatch) {
      this.results.passed = Array(parseInt(passedMatch[1])).fill('test');
    }
    if (failedMatch) {
      this.results.failed = Array(parseInt(failedMatch[1])).fill('test');
    }
    if (skippedMatch) {
      this.results.skipped = Array(parseInt(skippedMatch[1])).fill('test');
    }
  }

  formatPercentage(value) {
    const percentage = parseFloat(value);
    if (percentage >= 80) {
      return `${colors.green}${value}${colors.reset}`;
    } else if (percentage >= 60) {
      return `${colors.yellow}${value}${colors.reset}`;
    } else {
      return `${colors.red}${value}${colors.reset}`;
    }
  }

  printSummary() {
    const total = 
      this.results.passed.length + 
      this.results.failed.length + 
      this.results.skipped.length;

    this.log('\n' + '='.repeat(50), 'cyan');
    this.log('📊 Test Summary', 'cyan');
    this.log('='.repeat(50), 'cyan');
    
    console.log(`  Total Tests: ${total}`);
    console.log(`  ✅ Passed:    ${this.results.passed.length}`);
    console.log(`  ❌ Failed:    ${this.results.failed.length}`);
    console.log(`  ⏭️  Skipped:   ${this.results.skipped.length}`);
    console.log(`  ⏱️  Duration:  ${(this.results.duration / 1000).toFixed(2)}s`);
    
    this.log('='.repeat(50), 'cyan');

    if (this.results.failed.length === 0) {
      this.log('\n🎉 All tests passed!', 'green');
    } else {
      this.log('\n⚠️  Some tests failed', 'red');
      process.exit(1);
    }
  }
}

// CLIオプションの解析
const args = process.argv.slice(2);
const options = {
  coverage: args.includes('--coverage'),
  verbose: args.includes('--verbose'),
  parallel: args.includes('--parallel'),
  includeE2E: args.includes('--e2e'),
  skipLint: args.includes('--skip-lint'),
  strict: args.includes('--strict'),
  continueOnError: args.includes('--continue-on-error'),
  maxRetries: parseInt(args.find(a => a.startsWith('--retries='))?.split('=')[1] || '2'),
  testPattern: args.find(a => !a.startsWith('--')) || '',
};

// 実行
const runner = new TestRunner(options);
runner.runTests();