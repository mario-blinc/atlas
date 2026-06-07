import { getMockDashboardData } from '../server/mockData.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const hasGoogle = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_REFRESH_TOKEN);
  const hasTodoist = !!process.env.TODOIST_API_TOKEN;

  if (!hasGoogle && !hasTodoist) {
    return res.json({ ...getMockDashboardData(), mock: true });
  }

  // Real API calls would go here when configured
  return res.json({ ...getMockDashboardData(), mock: true });
}
