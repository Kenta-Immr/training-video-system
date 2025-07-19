// Health check endpoint
module.exports = function handler(req, res) {
  res.json({ 
    status: 'OK', 
    message: 'API is running on Vercel',
    timestamp: new Date().toISOString() 
  })
}