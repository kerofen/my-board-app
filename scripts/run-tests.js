#!/usr/bin/env node

/**
 * テスト実行ヘルパースクリプト
 * 各種テストコマンドを簡単に実行できるようにする
 */

const { spawn } = require('child_process');
const path = require('path');

const commands = {
  test: {
    cmd: 'npm',
    args: ['test'],
    description: '単体テストを実行',
  },
  'test:watch': {
    cmd: 'npm',
    args: ['run', 'test:watch'],
    description: '監視モードで単体テストを実行',
  },
  'test:coverage': {
    cmd: 'npm',
    args: ['run', 'test:coverage'],
    description: 'カバレッジ付きで単体テストを実行',
  },
  'test:e2e': {
    cmd: 'npm',
    args: ['run', 'test:e2e'],
    description: 'E2Eテストを実行',
  },
  'test:all': {
    cmd: 'npm',
    args: ['run', 'test:all'],
    description: 'すべてのテストを実行',
  },
};

function runCommand(commandName) {
  const command = commands[commandName];
  
  if (!command) {
    console.error(`❌ Unknown command: ${commandName}`);
    console.log('\n使用可能なコマンド:');
    Object.entries(commands).forEach(([name, config]) => {
      console.log(`  ${name.padEnd(20)} - ${config.description}`);
    });
    process.exit(1);
  }

  console.log(`\n🚀 実行中: ${command.description}`);
  console.log(`📦 コマンド: ${command.cmd} ${command.args.join(' ')}\n`);

  const child = spawn(command.cmd, command.args, {
    stdio: 'inherit',
    shell: true,
  });

  child.on('error', (error) => {
    console.error(`❌ エラー: ${error.message}`);
    process.exit(1);
  });

  child.on('exit', (code) => {
    if (code === 0) {
      console.log(`\n✅ ${command.description} が正常に完了しました`);
    } else {
      console.log(`\n❌ ${command.description} が失敗しました (終了コード: ${code})`);
    }
    process.exit(code);
  });
}

// メイン処理
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('📋 使用可能なテストコマンド:\n');
  Object.entries(commands).forEach(([name, config]) => {
    console.log(`  npm run ${name.padEnd(15)} - ${config.description}`);
  });
  console.log('\n使用例:');
  console.log('  node scripts/run-tests.js test');
  console.log('  node scripts/run-tests.js test:coverage');
  process.exit(0);
}

runCommand(args[0]);