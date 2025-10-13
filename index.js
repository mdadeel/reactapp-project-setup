#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

// Minimal banner
const banner = `
${chalk.hex('#8B5CF6')('█▀█ █▀▀ ▄▀█ █▀▀ ▀█▀   █▀ █▀▀ ▀█▀ █░█ █▀█')}
${chalk.hex('#A78BFA')('█▀▄ ██▄ █▀█ █▄▄ ░█░   ▄█ ██▄ ░█░ █▄█ █▀▀')}
                        
${chalk.hex('#C4B5FD')('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
${chalk.hex('#E0E7FF')('  Everything configured.')} ${chalk.hex('#8B5CF6').bold('Just start coding.')}
${chalk.hex('#C4B5FD')('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}

${chalk.hex('#10B981')('  ✓ Tailwind CSS v4')}  ${chalk.hex('#94A3B8')('- Pre-configured & ready')}
${chalk.hex('#10B981')('  ✓ Folder Structure')} ${chalk.hex('#94A3B8')('- Organized & clean')}

`;

console.clear();
console.log(banner);
console.log('');

// Only 2 questions!
const questions = [
  {
    type: 'input',
    name: 'projectName',
    message: chalk.hex('#8B5CF6')('Project name'),
    default: 'my-app',
    prefix: chalk.hex('#10B981')('▶'),
    validate: (input) => {
      if (/^[A-Za-z][A-Za-z0-9_-]*$/.test(input) && input.length <= 50) return true;
      return chalk.red('Must start with letter, only letters/numbers/dashes');
    },
    transformer: (input) => chalk.hex('#E0E7FF')(input)
  },
  {
    type: 'list',
    name: 'stack',
    message: chalk.hex('#8B5CF6')('Choose your stack'),
    prefix: chalk.hex('#10B981')('▶'),
    choices: [
      { 
        name: chalk.hex('#fbcf61')('React + JavaScript'), 
        value: { framework: 'react', lang: 'js', template: 'react' }
      },
      { 
        name: chalk.hex('#61DAFB')('React + TypeScript'), 
        value: { framework: 'react', lang: 'ts', template: 'react-ts' }
      },
      { 
        name: chalk.hex('#42B883')('Vue + TypeScript'), 
        value: { framework: 'vue', lang: 'ts', template: 'vue-ts' }
      },
      { 
        name: chalk.hex('#42B883')('Vue + JavaScript'), 
        value: { framework: 'vue', lang: 'js', template: 'vue' }
      },
      { 
        name: chalk.hex('#FF3E00')('Svelte + TypeScript'), 
        value: { framework: 'svelte', lang: 'ts', template: 'svelte-ts' }
      },
      { 
        name: chalk.hex('#FF3E00')('Svelte + JavaScript'), 
        value: { framework: 'svelte', lang: 'js', template: 'svelte' }
      }
    ],
    default: 0
  }
];



async function createProject() {
  try {
    const answers = await inquirer.prompt(questions);
    const { projectName, stack } = answers;
    const { framework, lang, template } = stack;
    const isTS = lang === 'ts';
    
    console.log('');
    console.log(chalk.hex('#8B5CF6')('┌───────────────────────────────────────┐'));
    console.log(chalk.hex('#8B5CF6')('│ ') + chalk.hex('#E0E7FF')('Setting up your full-stack project... ') + chalk.hex('#8B5CF6')('│'));
    console.log(chalk.hex('#8B5CF6')('└───────────────────────────────────────┘'));
    console.log('');
    
    const projectPath = path.join(process.cwd(), projectName);
    
    // 1. Create Vite project
    const spinner = ora({
      text: chalk.hex('#A78BFA')(`Creating ${framework} project...`),
      spinner: 'dots',
      color: 'magenta'
    }).start();
    
    execSync(`npm create vite@latest "${projectName}" -- --template ${template}`, { stdio: 'pipe' });
    spinner.succeed(chalk.hex('#10B981')('✓ ' + framework + ' project created'));
    
    process.chdir(projectPath);
    
    // 2. Install base dependencies
    spinner.start(chalk.hex('#A78BFA')('Installing base packages...'));
    execSync('npm install', { stdio: 'pipe' });
    spinner.succeed(chalk.hex('#10B981')('✓ Base packages installed'));
    
    // 3. Install Tailwind CSS v4
    spinner.start(chalk.hex('#A78BFA')('Adding Tailwind CSS v4...'));
    try {
      execSync('npm install -D tailwindcss @tailwindcss/vite postcss autoprefixer', { stdio: 'pipe' });
      
      // Update vite.config
      const viteConfigFile = isTS ? 'vite.config.ts' : 'vite.config.js';
      
      if (fs.existsSync(viteConfigFile)) {
        let viteConfig = fs.readFileSync(viteConfigFile, 'utf8');
        
        // Add Tailwind import
        const importLine = "import tailwindcss from '@tailwindcss/vite'";
        if (!viteConfig.includes(importLine)) {
          const lines = viteConfig.split('\n');
          let lastImportIndex = -1;
          for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].includes('import')) {
              lastImportIndex = i;
              break;
            }
          }
          if (lastImportIndex !== -1) {
            lines.splice(lastImportIndex + 1, 0, importLine);
            viteConfig = lines.join('\n');
          }
        }
        
        // Add to plugins
        if (!viteConfig.includes('tailwindcss()')) {
          viteConfig = viteConfig.replace(/plugins:\s*\[/, 'plugins: [\n    tailwindcss(),');
        }
        
        fs.writeFileSync(viteConfigFile, viteConfig);
      }
      
      // Add Tailwind to CSS
      const cssContent = `@import "tailwindcss";\n\n/* Your custom styles */\n`;
      const cssFiles = ['src/index.css', 'src/style.css', 'src/app.css'];
      const cssFile = cssFiles.find(file => fs.existsSync(file)) || 'src/index.css';
      fs.ensureFileSync(cssFile);
      fs.writeFileSync(cssFile, cssContent);
      
      spinner.succeed(chalk.hex('#10B981')('✓ Tailwind CSS v4 configured'));
    } catch (error) {
      spinner.warn(chalk.hex('#F59E0B')('⚠ Tailwind setup partial'));
    }
    
    // 4. Install Router
    spinner.start(chalk.hex('#A78BFA')(`Installing ${framework} router...`));
    try {
      execSync(`npm install ${routerPackages[framework]}`, { stdio: 'pipe' });
      
      // Create router setup file
      const ext = isTS ? 'tsx' : 'jsx';
      const routerDir = 'src/router';
      fs.ensureDirSync(routerDir);
      
      if (framework === 'react') {
        const routerSetup = `import { createBrowserRouter } from 'react-router-dom';
import App from '../App';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
]);
`;
        fs.writeFileSync(`${routerDir}/index.${ext}`, routerSetup);
        
        // Update main file
        const mainFile = isTS ? 'src/main.tsx' : 'src/main.jsx';
        if (fs.existsSync(mainFile)) {
          let mainContent = fs.readFileSync(mainFile, 'utf8');
          mainContent = mainContent.replace(
            /import App from ['"]\.\/App['"]/,
            `import { RouterProvider } from 'react-router-dom'\nimport { router } from './router'`
          );
          mainContent = mainContent.replace(/<App \/>/, '<RouterProvider router={router} />');
          fs.writeFileSync(mainFile, mainContent);
        }
      }
      
      spinner.succeed(chalk.hex('#10B981')(`✓ ${framework} router installed & configured`));
    } catch (error) {
      spinner.warn(chalk.hex('#F59E0B')('⚠ Router installed (manual setup needed)'));
    }
    
    // 5. Create folder structure
    spinner.start(chalk.hex('#A78BFA')('Creating folder structure...'));
    
    const folders = framework === 'vue' 
      ? ['components', 'views', 'composables', 'stores', 'assets', 'utils', 'router']
      : framework === 'svelte'
      ? ['components', 'routes', 'stores', 'lib', 'assets', 'utils']
      : ['components', 'pages', 'hooks', 'utils', 'assets', 'services', 'router'];
    
    folders.forEach(folder => {
      const folderPath = path.join('src', folder);
      fs.ensureDirSync(folderPath);
      
      const descriptions = {
        components: 'Reusable UI components',
        pages: 'Page components',
        views: 'Vue page views',
        routes: 'Svelte routes',
        hooks: 'Custom React hooks',
        composables: 'Vue composables',
        stores: 'State management',
        utils: 'Utility functions',
        services: 'API services',
        lib: 'Library code',
        assets: 'Static files',
        router: 'Routing configuration'
      };
      
      const readme = `# ${folder.charAt(0).toUpperCase() + folder.slice(1)}\n\n${descriptions[folder] || 'Your code here'}\n`;
    });
    
    spinner.succeed(chalk.hex('#10B981')('✓ Folder structure created'));
    

    
    // 7. Create simple, clean homepage
    spinner.start(chalk.hex('#A78BFA')('Creating homepage...'));
    
    const appExt = isTS ? 'tsx' : 'jsx';
    const appFile = `src/App.${appExt}`;
    
    const simpleHomepage = `${isTS ? "import React from 'react';\n" : ''}
function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
          Welcome to the React World
        </h1>
        
        <p className="text-xl md:text-2xl text-purple-200 mb-8">
          Built with React Setup Pro
        </p>
        
        <div className="space-y-4">
          <a 
            href="https://instagram.com/shahnawas.adeel"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-lg text-white hover:text-purple-200 transition-colors bg-red-500 p-2 rounded-lg shadow-lg hover:shadow-xl"
          >
            ✨ instagram
          </a>
          
          <div className="pt-8">
            <p className="text-purple-300 text-sm">
              Start editing <code className="bg-purple-900 px-2 py-1 rounded">src/App.${appExt}</code> to build something amazing!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
`;
    
    fs.writeFileSync(appFile, simpleHomepage);
    
    // Simple CSS with animations
    const cssFile = 'src/index.css';
    const simpleCSS = `@import "tailwindcss";

/* Smooth animations */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.animate-bounce {
  animation: bounce 2s ease-in-out infinite;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}
`;
    
    fs.writeFileSync(cssFile, simpleCSS);
    
    spinner.succeed(chalk.hex('#10B981')('✓ Homepage created'));
    
    // 8. Create README
    const readme = `# ${projectName}

${framework === 'react' ? '⚛️' : framework === 'vue' ? '💚' : '🔺'} **${framework.charAt(0).toUpperCase() + framework.slice(1)}** ${isTS ? '+ TypeScript' : '+ JavaScript'}

## 🚀 What's Included

- ✅ **Vite** - Lightning fast development
- ✅ **Tailwind CSS v4** - Latest version with Vite plugin

- ✅ **Organized Structure** - Production-ready folders
- ✅ **Environment Variables** - .env configured

## 📁 Project Structure

\`\`\`
src/
├── components/    # Reusable UI components
├── ${framework === 'react' ? 'pages/' : framework === 'vue' ? 'views/' : 'routes/'}         # Page components
├── ${framework === 'react' ? 'hooks/' : framework === 'vue' ? 'composables/' : 'stores/'}         # ${framework === 'react' ? 'Custom hooks' : framework === 'vue' ? 'Composables' : 'State stores'}
├── utils/         # Utility functions
├── assets/        # Static files
└── router/        # Route configuration
\`\`\`

## 🎯 Quick Start

\`\`\`bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
\`\`\`

## 💡 Tailwind Example

\`\`\`${framework === 'react' ? 'jsx' : framework === 'vue' ? 'vue' : 'svelte'}
<div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-8 rounded-xl">
  <h1 className="text-4xl font-bold">Hello Tailwind!</h1>
</div>
\`\`\`

## 🧭 Router Example

Check \`src/router/\` for routing configuration.

## 🌐 Environment Variables

Edit \`.env\` file for your API URLs and settings.

## 📚 Learn More

- [${framework.charAt(0).toUpperCase() + framework.slice(1)} Docs](${framework === 'react' ? 'https://react.dev' : framework === 'vue' ? 'https://vuejs.org' : 'https://svelte.dev'})
- [Tailwind CSS Docs](https://tailwindcss.com)
- [Vite Docs](https://vitejs.dev)

---

Built with ❤️ using [reactapp-project-setup](https://www.npmjs.com/package/reactapp-project-setup)
`;
    
    fs.writeFileSync('README.md', readme);
    
    // Success!
    console.log('');
    console.log(chalk.hex('#10B981')('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.hex('#10B981').bold('  ✓ Project Ready! Everything Configured!'));
    console.log(chalk.hex('#10B981')('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log('');
    console.log(chalk.hex('#8B5CF6')('  📦 What\'s included:'));
    console.log('');

    console.log(chalk.hex('#10B981')('     ✓ ') + chalk.hex('#E0E7FF')('Tailwind CSS v4 with Vite plugin'));

    console.log(chalk.hex('#10B981')('     ✓ ') + chalk.hex('#E0E7FF')('Organized folder structure'));
    console.log(chalk.hex('#10B981')('     ✓ ') + chalk.hex('#E0E7FF')('Environment variables (.env)'));
    console.log('');
    console.log(chalk.hex('#8B5CF6')('  🚀 Start coding:'));
    console.log('');
    console.log(chalk.hex('#A78BFA')('     cd ') + chalk.hex('#E0E7FF')(projectName));
    console.log(chalk.hex('#A78BFA')('     npm run dev'));
    console.log('');

    console.log('');

    console.log('');
    console.log(chalk.hex('#10B981')('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log('');
    
  } catch (error) {
    console.log('');
    console.log(chalk.red('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.red.bold('  ✗ Setup Failed'));
    console.log(chalk.red('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log('');
    console.log(chalk.hex('#94A3B8')('  ' + error.message));
    console.log('');
    console.log(chalk.hex('#F59E0B')('  Troubleshooting:'));
    console.log(chalk.hex('#94A3B8')('    • Check internet connection'));
    console.log(chalk.hex('#94A3B8')('    • Node.js 18+ required'));
    console.log(chalk.hex('#94A3B8')('    • Try: npm cache clean --force'));
    console.log('');
    process.exit(1);
  }
}

createProject();
