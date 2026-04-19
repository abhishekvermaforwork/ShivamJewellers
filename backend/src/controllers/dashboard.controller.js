import * as dashboardService from '../services/dashboard.service.js';
import { ok } from '../utils/http.js';

export async function summary(req, res) {
  const data = await dashboardService.getDashboard(req.userId);
  ok(res, data);
}
