const { spawn } = require('child_process');

// The RENDER environment variable is automatically injected by Render.com
const isRender = process.env.RENDER === 'true' || process.env.RENDER;
const isWindows = process.platform === 'win32';
const runNpm = (args, options = {}) => {
  if (isWindows) {
    return spawn('cmd.exe', ['/d', '/s', '/c', `npm ${args.join(' ')}`], options);
  }

  return spawn('npm', args, options);
};

if (isRender) {
  console.log('🌍 Detected Render Deployment! Starting Backend...');
  
  // 1. Install backend dependencies first
  console.log('📦 Installing backend dependencies...');
  const install = runNpm(['install'], {
    cwd: './backend',
    stdio: 'inherit',
  });
  
  install.on('close', (code) => {
    if (code !== 0) {
      console.error(`Backend install failed with code ${code}`);
      process.exit(code);
    }
    
    // 2. Start the backend server
    console.log('🚀 Starting Express backend...');
    spawn('node', ['server.js'], {
      cwd: './backend',
      stdio: 'inherit',
    });
  });

} else {
  // If we are developing locally, start the React frontend
  console.log('💻 Local environment detected. Starting React frontend...');
  
  runNpm(['run', 'start-react'], {
    stdio: 'inherit',
  });
}
