import * as authService from '../services/auth.service.js';
import { ok, created } from '../utils/http.js';

export async function register(req, res) {
  const result = await authService.register(req.body);
  created(res, result);
}

export async function login(req, res) {
  const result = await authService.login(req.body);
  ok(res, result);
}

export async function me(req, res) {
  const result = await authService.getMe(req.userId);
  ok(res, result);
}

export async function upsertProfile(req, res) {
  const profile = await authService.ensureBusinessProfile(req.userId, req.body);
  ok(res, profile);
}
