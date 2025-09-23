import { updateBill, markBillPaid } from '../../../lib/api.js';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    switch (req.method) {
      case 'PUT':
        const updatedBill = await updateBill(id, req.body);
        res.status(200).json(updatedBill);
        break;

      case 'PATCH':
        // Handle bill payment status updates
        const { isPaid } = req.body;
        const bill = await markBillPaid(id, isPaid);
        res.status(200).json(bill);
        break;

      default:
        res.setHeader('Allow', ['PUT', 'PATCH']);
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Bill update API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}