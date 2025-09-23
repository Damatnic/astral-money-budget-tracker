import { getBills, createBill } from '../../../lib/api.js';

export default async function handler(req, res) {
  const userId = 'default-user'; // In production, get from authentication
  const { month, year } = req.query;

  try {
    switch (req.method) {
      case 'GET':
        const bills = await getBills(userId, month, year ? parseInt(year) : null);
        res.status(200).json(bills);
        break;

      case 'POST':
        const newBill = await createBill({
          userId,
          ...req.body
        });
        res.status(201).json(newBill);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Bills API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}