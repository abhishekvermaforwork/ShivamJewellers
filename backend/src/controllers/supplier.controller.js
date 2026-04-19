import * as supplierService from '../services/supplier.service.js';
import { ok, created } from '../utils/http.js';

export async function listSuppliers(req, res) {
  const data = await supplierService.listSuppliers(req.userId);
  ok(res, data);
}

export async function createSupplier(req, res) {
  const s = await supplierService.createSupplier(req.userId, req.body);
  created(res, s);
}

export async function updateSupplier(req, res) {
  const s = await supplierService.updateSupplier(req.userId, req.params.id, req.body);
  ok(res, s);
}

export async function deleteSupplier(req, res) {
  await supplierService.deleteSupplier(req.userId, req.params.id);
  res.status(204).send();
}

export async function listPurchases(req, res) {
  const data = await supplierService.listPurchases(req.userId, req.query.supplierId);
  ok(res, data);
}

export async function createPurchase(req, res) {
  const p = await supplierService.createPurchase(req.userId, req.body);
  created(res, p);
}

export async function updatePurchase(req, res) {
  const p = await supplierService.updatePurchase(req.userId, req.params.id, req.body);
  ok(res, p);
}

export async function deletePurchase(req, res) {
  await supplierService.deletePurchase(req.userId, req.params.id);
  res.status(204).send();
}
