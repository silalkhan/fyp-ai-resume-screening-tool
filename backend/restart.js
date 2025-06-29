// Script to restart the backend service
const { exec } = require('child_process')
const path = require('path')

console.log('Stopping any running backend processes...')

// Find and kill any running node processes for the backend
const killCommand =
  process.platform === 'win32' ? 'taskkill /F /IM node.exe' : "pkill -f 'node server.js'"

exec(killCommand, (error) => {
  if (error) {
    console.log('No running backend processes found or unable to kill them.')
  } else {
    console.log('Stopped running backend processes.')
  }

  console.log('Starting backend service...')

  // Start the backend service
  const serverPath = path.join(__dirname, 'server.js')
  const nodeProcess = exec(`node ${serverPath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting backend: ${error.message}`)
      return
    }
    if (stderr) {
      console.error(`Backend stderr: ${stderr}`)
      return
    }
    console.log(`Backend stdout: ${stdout}`)
  })

  nodeProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`)
  })

  nodeProcess.stderr.on('data', (data) => {
    console.error(`Backend error: ${data}`)
  })

  console.log('Backend service started in background.')
})
