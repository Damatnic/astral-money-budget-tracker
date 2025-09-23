import { getFinancialHealthScore } from '../../../lib/api.js';

export default async function handler(req, res) {
  const userId = 'default-user'; // In production, get from authentication

  try {
    switch (req.method) {
      case 'GET':
        const healthScore = await getFinancialHealthScore(userId);
        
        // Calculate health status
        let status = 'excellent';
        let message = 'Great financial health!';
        
        if (healthScore < 30) {
          status = 'critical';
          message = 'Critical - Action needed immediately';
        } else if (healthScore < 50) {
          status = 'poor';
          message = 'Poor - Needs attention';
        } else if (healthScore < 70) {
          status = 'fair';
          message = 'Fair - Room for improvement';
        } else if (healthScore < 85) {
          status = 'good';
          message = 'Good - Keep it up!';
        }

        res.status(200).json({
          score: healthScore,
          status,
          message,
          timestamp: new Date().toISOString()
        });
        break;

      default:
        res.setHeader('Allow', ['GET']);
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Health score API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}