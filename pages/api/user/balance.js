export default async function handler(req, res) {
  // Fallback data when database is not configured
  const fallbackBalance = 11.29;
  const fallbackLastUpdated = new Date().toISOString();

  try {
    switch (req.method) {
      case 'GET':
        // Check if database is available
        if (!process.env.DATABASE_URL) {
          return res.status(200).json({
            balance: fallbackBalance,
            lastUpdated: fallbackLastUpdated,
            note: 'Using fallback data - database not configured'
          });
        }

        // Try to get real data if database is available
        try {
          const { getUser } = await import('../../../lib/api.js');
          const user = await getUser('user@astralmoney.com');
          
          if (!user) {
            return res.status(200).json({
              balance: fallbackBalance,
              lastUpdated: fallbackLastUpdated,
              note: 'Using fallback data - user not found'
            });
          }
          
          res.status(200).json({
            balance: user.balance,
            lastUpdated: user.updatedAt
          });
        } catch (dbError) {
          console.warn('Database error, using fallback:', dbError.message);
          res.status(200).json({
            balance: fallbackBalance,
            lastUpdated: fallbackLastUpdated,
            note: 'Using fallback data - database error'
          });
        }
        break;

      case 'PUT':
        const { balance } = req.body;
        
        if (typeof balance !== 'number') {
          return res.status(400).json({ error: 'Balance must be a number' });
        }

        if (!process.env.DATABASE_URL) {
          return res.status(200).json({
            balance: balance,
            lastUpdated: new Date().toISOString(),
            note: 'Simulated update - database not configured'
          });
        }

        try {
          const { updateUserBalance } = await import('../../../lib/api.js');
          const updatedUser = await updateUserBalance('default-user', balance);
          res.status(200).json({
            balance: updatedUser.balance,
            lastUpdated: updatedUser.updatedAt
          });
        } catch (dbError) {
          console.warn('Database error during update:', dbError.message);
          res.status(200).json({
            balance: balance,
            lastUpdated: new Date().toISOString(),
            note: 'Simulated update - database error'
          });
        }
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