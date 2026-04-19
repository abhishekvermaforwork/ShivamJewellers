import * as clientService from '../services/client.service.js';
import { ok, created } from '../utils/http.js';

export async function list(req, res) {
  const data = await clientService.listClients(req.userId, req.query);
  ok(res, data);
}

export async function getOne(req, res) {
  const data = await clientService.getClient(req.userId, req.params.id);
  ok(res, data);
}

export async function create(req, res) {
  const client = await clientService.createClient(req.userId, req.body);
  created(res, client);
}

export async function update(req, res) {
  const client = await clientService.updateClient(req.userId, req.params.id, req.body);
  ok(res, client);
}

export async function replace(req, res) {
  const client = await clientService.updateClient(req.userId, req.params.id, req.body);
  ok(res, client);
}

export async function remove(req, res) {
  await clientService.deleteClient(req.userId, req.params.id);
  res.status(204).send();
}
