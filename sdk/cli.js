#!/usr/bin/env node

/**
 * TreeAI Alex CLI - Command line interface for Alex SDK
 */

const { TreeAIAlex } = require('./treeai-alex-sdk');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// CLI Colors
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log(colorize('\n🧠 TreeAI Alex SDK CLI', 'blue'));
  console.log(colorize('Universal AI Agent for TreeAI Projects\n', 'reset'));

  switch (command) {
    case 'health':
    case 'status':
      await checkHealth();
      break;
    
    case 'chat':
    case 'talk':
      await startChat();
      break;
    
    case 'demo':
    case 'examples':
      await runExamples();
      break;
    
    case 'create':
    case 'init':
      await createIntegration(args[1]);
      break;
    
    case 'lead':
      await quickLead(args.slice(1).join(' '));
      break;
    
    case 'treescore':
      await quickTreeScore(args[1], args[2], args[3]);
      break;
    
    case 'analytics':
      await quickAnalytics(args[1]);
      break;
    
    case 'version':
    case '--version':
    case '-v':
      showVersion();
      break;
    
    case 'help':
    case '--help':
    case '-h':
    default:
      showHelp();
      break;
  }
}

async function checkHealth() {
  console.log(colorize('Checking Alex health...', 'yellow'));
  
  const alex = new TreeAIAlex({ projectName: 'CLI-HealthCheck' });
  
  try {
    const isHealthy = await alex.healthCheck();
    if (isHealthy) {
      console.log(colorize('✅ Alex is online and ready!', 'green'));
      console.log(colorize('   API: https://tremendous-whale-894.convex.site', 'reset'));
    } else {
      console.log(colorize('❌ Alex is not responding', 'red'));
      console.log(colorize('   Check your internet connection', 'reset'));
    }
  } catch (error) {
    console.log(colorize('❌ Health check failed:', 'red'), error.message);
  }
}

async function startChat() {
  console.log(colorize('💬 Starting chat with Alex...', 'blue'));
  console.log(colorize('Type "quit" or "exit" to end chat\n', 'reset'));
  
  const alex = new TreeAIAlex({ projectName: 'CLI-Chat' });
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const chat = async () => {
    rl.question(colorize('You: ', 'green'), async (input) => {
      if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'exit') {
        console.log(colorize('\nGoodbye! 👋', 'blue'));
        rl.close();
        return;
      }

      if (!input.trim()) {
        chat();
        return;
      }

      try {
        console.log(colorize('Alex: ', 'blue') + 'Thinking...');
        const response = await alex.chat(input);
        
        // Clear the "thinking" line and show response
        process.stdout.write('\r\x1b[K');
        console.log(colorize('Alex: ', 'blue') + response.getText());
        console.log('');
        
        chat();
      } catch (error) {
        console.log(colorize('Alex: ', 'red') + 'Sorry, I had trouble with that: ' + error.message);
        console.log('');
        chat();
      }
    });
  };

  chat();
}

async function runExamples() {
  console.log(colorize('🚀 Running Alex SDK examples...', 'blue'));
  
  try {
    const { runAllExamples } = require('./examples');
    await runAllExamples();
  } catch (error) {
    console.log(colorize('❌ Examples failed:', 'red'), error.message);
  }
}

async function createIntegration(projectName) {
  if (!projectName) {
    console.log(colorize('❌ Please specify a project name:', 'red'));
    console.log(colorize('   alex create my-tree-project', 'yellow'));
    return;
  }

  console.log(colorize(`🏗️  Creating Alex integration for ${projectName}...`, 'blue'));

  const template = `// ${projectName} - Alex Integration
const { TreeAIAlex } = require('@treeai/alex-sdk');

// Initialize Alex for your project
const alex = new TreeAIAlex({
  projectName: '${projectName}',
  sessionId: '${projectName.toLowerCase()}-' + Date.now()
});

async function main() {
  try {
    // Check Alex health
    const isOnline = await alex.healthCheck();
    console.log('Alex Status:', isOnline ? '✅ Online' : '❌ Offline');

    // Example: Create a lead
    const response = await alex.createLead('John Doe at 123 Main Street');
    console.log('Alex Response:', response.getText());

    // Add your custom integration logic here
    // Examples:
    // - await alex.calculateTreeScore({ height: 30, crownRadius: 8, dbh: 12 })
    // - await alex.generateProposal({ customer: 'John', location: 'Main St' })
    // - await alex.getAnalytics('month')

  } catch (error) {
    console.error('Integration failed:', error.message);
  }
}

// Run the integration
main();
`;

  const fileName = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-alex-integration.js`;
  
  try {
    fs.writeFileSync(fileName, template);
    console.log(colorize(`✅ Created ${fileName}`, 'green'));
    console.log(colorize(`   Run: node ${fileName}`, 'yellow'));
  } catch (error) {
    console.log(colorize('❌ Failed to create integration:', 'red'), error.message);
  }
}

async function quickLead(customerInfo) {
  if (!customerInfo) {
    console.log(colorize('❌ Please provide customer information:', 'red'));
    console.log(colorize('   alex lead "Sarah Johnson at 456 Maple Street"', 'yellow'));
    return;
  }

  console.log(colorize('📝 Creating lead...', 'blue'));
  
  const alex = new TreeAIAlex({ projectName: 'CLI-QuickLead' });
  
  try {
    const response = await alex.createLead(customerInfo);
    console.log(colorize('✅ Lead created!', 'green'));
    console.log(response.getText());
  } catch (error) {
    console.log(colorize('❌ Lead creation failed:', 'red'), error.message);
  }
}

async function quickTreeScore(height, crownRadius, dbh) {
  if (!height || !crownRadius || !dbh) {
    console.log(colorize('❌ Please provide tree measurements:', 'red'));
    console.log(colorize('   alex treescore 45 8 24', 'yellow'));
    console.log(colorize('   (height crown-radius dbh)', 'reset'));
    return;
  }

  console.log(colorize('🌳 Calculating TreeScore...', 'blue'));
  
  const alex = new TreeAIAlex({ projectName: 'CLI-TreeScore' });
  
  try {
    const response = await alex.calculateTreeScore({
      height: parseInt(height),
      crownRadius: parseInt(crownRadius),
      dbh: parseInt(dbh)
    });
    console.log(colorize('✅ TreeScore calculated!', 'green'));
    console.log(response.getText());
  } catch (error) {
    console.log(colorize('❌ TreeScore calculation failed:', 'red'), error.message);
  }
}

async function quickAnalytics(timeframe = 'month') {
  console.log(colorize(`📊 Getting ${timeframe} analytics...`, 'blue'));
  
  const alex = new TreeAIAlex({ projectName: 'CLI-Analytics' });
  
  try {
    const response = await alex.getAnalytics(timeframe);
    console.log(colorize('✅ Analytics retrieved!', 'green'));
    console.log(response.getText());
  } catch (error) {
    console.log(colorize('❌ Analytics failed:', 'red'), error.message);
  }
}

function showVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json')));
  console.log(colorize(`TreeAI Alex SDK v${pkg.version}`, 'green'));
}

function showHelp() {
  console.log(colorize('Usage:', 'bold'));
  console.log('  alex <command> [options]\n');
  
  console.log(colorize('Commands:', 'bold'));
  console.log('  ' + colorize('health', 'green') + '                    Check Alex system status');
  console.log('  ' + colorize('chat', 'green') + '                     Start interactive chat with Alex');
  console.log('  ' + colorize('demo', 'green') + '                     Run SDK examples');
  console.log('  ' + colorize('create <project>', 'green') + '         Create integration template');
  console.log('  ' + colorize('lead <customer-info>', 'green') + '     Quick lead creation');
  console.log('  ' + colorize('treescore <h> <r> <d>', 'green') + '    Calculate TreeScore');
  console.log('  ' + colorize('analytics [timeframe]', 'green') + '    Get business analytics');
  console.log('  ' + colorize('version', 'green') + '                  Show SDK version');
  console.log('  ' + colorize('help', 'green') + '                     Show this help\n');
  
  console.log(colorize('Examples:', 'bold'));
  console.log('  alex health');
  console.log('  alex chat');
  console.log('  alex create drone-survey-app');
  console.log('  alex lead "Mike Chen at 789 Oak Street"');
  console.log('  alex treescore 45 8 24');
  console.log('  alex analytics week\n');
  
  console.log(colorize('Integration:', 'bold'));
  console.log('  npm install @treeai/alex-sdk');
  console.log('  const { TreeAIAlex } = require("@treeai/alex-sdk");\n');
}

// Handle uncaught errors gracefully
process.on('unhandledRejection', (error) => {
  console.log(colorize('❌ Unexpected error:', 'red'), error.message);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log(colorize('\n👋 Goodbye!', 'blue'));
  process.exit(0);
});

// Run CLI
main().catch((error) => {
  console.log(colorize('❌ CLI error:', 'red'), error.message);
  process.exit(1);
});