import { getUser, updateUserBalance } from '../../../lib/api.js';

export default async function handler(req, res) {
  const userId = 'default-user'; // In production, get from authentication

  try {
    switch (req.method) {
      case 'GET':
        const user = await getUser('user@astralmoney.com');
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json({
          balance: user.balance,
          lastUpdated: user.updatedAt
        });
        break;

      case 'PUT':
        const { balance } = req.body;
        
        if (typeof balance !== 'number') {
          return res.status(400).json({ error: 'Balance must be a number' });
        }

        const updatedUser = await updateUserBalance(userId, balance);
        res.status(200).json({
          balance: updatedUser.balance,
          lastUpdated: updatedUser.updatedAt
        });
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('User balance API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}