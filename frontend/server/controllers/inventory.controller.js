import * as inventoryService from '../services/inventory.service.js';
import * as invoiceFormDataService from '../services/invoiceFormData.service.js';
import { ok, created } from '../utils/http.js';

export async function invoiceFormData(req, res) {
  const data = await invoiceFormDataService.getInvoiceFormData(req.userId);
  ok(res, data);
}

export async function listCategories(req, res) {
  const data = await inventoryService.listCategories(req.userId);
  ok(res, data);
}

export async function categoryDetail(req, res) {
  const data = await inventoryService.getCategoryDetail(req.userId, req.params.id);
  ok(res, data);
}

export async function createCategory(req, res) {
  const c = await inventoryService.createCategory(req.userId, req.body);
  created(res, c);
}

export async function updateCategory(req, res) {
  const c = await inventoryService.updateCategory(req.userId, req.params.id, req.body);
  ok(res, c);
}

export async function deleteCategory(req, res) {
  await inventoryService.deleteCategory(req.userId, req.params.id);
  res.status(204).send();
}

export async function createItem(req, res) {
  const item = await inventoryService.createInventoryItem(req.userId, req.body);
  created(res, item);
}

export async function updateItem(req, res) {
  const item = await inventoryService.updateInventoryItem(req.userId, req.params.id, req.body);
  ok(res, item);
}

export async function deleteItem(req, res) {
  await inventoryService.deleteInventoryItem(req.userId, req.params.id);
  res.status(204).send();
}

export async function markSold(req, res) {
  const item = await inventoryService.markItemSold(req.userId, req.params.id, req.body);
  ok(res, item);
}

export async function markUnsold(req, res) {
  const item = await inventoryService.markItemUnsold(req.userId, req.params.id);
  ok(res, item);
}

export async function createWeightStock(req, res) {
  const entry = await inventoryService.createWeightStock(req.userId, req.body);
  created(res, entry);
}

export async function deleteWeightStock(req, res) {
  await inventoryService.deleteWeightStock(req.userId, req.params.id);
  res.status(204).send();
}
