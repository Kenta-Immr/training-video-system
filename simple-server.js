const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head><title>Test Server</title></head>
      <body>
        <h1>Test Server is Working!</h1>
        <p>Time: ${new Date().toISOString()}</p>
        <p>URL: ${req.url}</p>
      </body>
    </html>
  `);
});

const PORT = 3005;
server.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});