import { getBudget, createBudget, updateBudget } from '../../../lib/api.js';

export default async function handler(req, res) {
  const { month } = req.query;
  const userId = 'default-user'; // In production, get from authentication

  try {
    switch (req.method) {
      case 'GET':
        const budget = await getBudget(userId, month, 2025);
        if (!budget) {
          return res.status(404).json({ error: 'Budget not found' });
        }
        res.status(200).json(budget);
        break;

      case 'POST':
        const newBudget = await createBudget({
          userId,
          month,
          year: 2025,
          ...req.body
        });
        res.status(201).json(newBudget);
        break;

      case 'PUT':
        const existingBudget = await getBudget(userId, month, 2025);
        if (!existingBudget) {
          return res.status(404).json({ error: 'Budget not found' });
        }
        
        const updatedBudget = await updateBudget(existingBudget.id, req.body);
        res.status(200).json(updatedBudget);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Budget API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}