require('dotenv').config()
const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')
const os = require('os')
const app = require('./server')

const PORT = process.env.PORT || 3000
const isProd = process.env.NODE_ENV === 'production'

function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces))
    for (const iface of interfaces[name])
      if (iface.family === 'IPv4' && !iface.internal) return iface.address
  return 'localhost'
}

let server
if (isProd) {
  server = http.createServer(app)
} else {
  const ssl = {
    key: fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem'))
  }
  server = https.createServer(ssl, app)
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`FitNova API running on port ${PORT}`)
  if (!isProd) console.log(`Network: https://${getLocalIP()}:${PORT}`)
})

module.exports = server