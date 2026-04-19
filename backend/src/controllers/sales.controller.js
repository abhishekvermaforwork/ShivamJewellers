import * as salesService from '../services/sales.service.js';
import { ok } from '../utils/http.js';

export async function report(req, res) {
  const data = await salesService.getSalesReport(req.userId, req.query);
  ok(res, data);
}
