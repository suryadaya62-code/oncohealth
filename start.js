const { spawn } = require('child_process');

// The RENDER environment variable is automatically injected by Render.com
const isRender = process.env.RENDER === 'true' || process.env.RENDER;

if (isRender) {
  console.log('🌍 Detected Render Deployment! Starting Backend...');
  
  // Start the backend server directly (dependencies are installed during build)
  console.log('🚀 Starting Express backend...');
  const child = spawn('node', ['server.js'], { cwd: './backend', stdio: 'inherit' });
  
  child.on('error', (err) => {
    console.error('Failed to start backend server:', err);
  });

} else {
  // If we are developing locally, start the React frontend
  console.log('💻 Local environment detected. Starting React frontend...');
  
  const cmd = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
  spawn(cmd, ['run', 'start-react'], { stdio: 'inherit' });
}
