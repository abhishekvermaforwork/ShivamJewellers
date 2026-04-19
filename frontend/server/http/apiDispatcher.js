import { match } from 'path-to-regexp';
import { connectDatabase } from '../config/database.js';
import { AppError } from '../utils/AppError.js';
import { errorHandler } from '../middlewares/errorHandler.js';
import { buildReq } from './buildReq.js';
import { createMockRes } from './mockRes.js';
import { authenticateRequest } from './authenticateRequest.js';
import { applyValidation } from './applyValidation.js';
import { mockResToNextResponse } from './toNextResponse.js';

import * as authController from '../controllers/auth.controller.js';
import * as clientController from '../controllers/client.controller.js';
import * as invoiceController from '../controllers/invoice.controller.js';
import * as dashboardController from '../controllers/dashboard.controller.js';
import * as paymentController from '../controllers/payment.controller.js';
import * as salesController from '../controllers/sales.controller.js';
import * as inventoryController from '../controllers/inventory.controller.js';
import * as supplierController from '../controllers/supplier.controller.js';
import * as pettyController from '../controllers/pettyExpense.controller.js';
import * as advanceController from '../controllers/advancePayment.controller.js';

import {
  registerSchema,
  loginSchema,
  businessProfileSchema,
  clientWriteSchema,
  clientPatchSchema,
  invoiceCreateSchema,
  invoiceUpdateSchema,
  dueDateSchema,
  paymentCreateSchema,
  categoryWriteSchema,
  inventoryItemWriteSchema,
  markSoldSchema,
  weightStockWriteSchema,
  supplierWriteSchema,
  purchaseWriteSchema,
  pettyExpenseWriteSchema,
  advancePaymentWriteSchema,
} from '../validators/schemas.js';

const opt = { decode: decodeURIComponent };

function normalizePath(p) {
  if (!p || p === '/') return '/';
  return p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p;
}

/**
 * Order matters: more specific paths (e.g. …/pdf, …/due-date) before generic :id routes.
 */
const ROUTES = [
  { method: 'POST', auth: false, validate: [registerSchema, 'body'], match: match('/auth/register', opt), handler: authController.register },
  { method: 'POST', auth: false, validate: [loginSchema, 'body'], match: match('/auth/login', opt), handler: authController.login },
  { method: 'GET', auth: false, match: match('/public/invoices/:token', opt), handler: invoiceController.publicByToken },

  { method: 'GET', auth: true, match: match('/auth/me', opt), handler: authController.me },
  { method: 'PATCH', auth: true, validate: [businessProfileSchema, 'body'], match: match('/auth/profile', opt), handler: authController.upsertProfile },

  { method: 'GET', auth: true, match: match('/dashboard', opt), handler: dashboardController.summary },

  { method: 'GET', auth: true, match: match('/clients', opt), handler: clientController.list },
  { method: 'GET', auth: true, match: match('/clients/:id', opt), handler: clientController.getOne },
  { method: 'POST', auth: true, validate: [clientWriteSchema, 'body'], match: match('/clients', opt), handler: clientController.create },
  { method: 'PUT', auth: true, validate: [clientWriteSchema, 'body'], match: match('/clients/:id', opt), handler: clientController.replace },
  { method: 'PATCH', auth: true, validate: [clientPatchSchema, 'body'], match: match('/clients/:id', opt), handler: clientController.update },
  { method: 'DELETE', auth: true, match: match('/clients/:id', opt), handler: clientController.remove },

  { method: 'GET', auth: true, match: match('/invoices', opt), handler: invoiceController.list },
  { method: 'GET', auth: true, match: match('/invoices/:id/pdf', opt), handler: invoiceController.downloadPdf },
  { method: 'GET', auth: true, match: match('/invoices/:id', opt), handler: invoiceController.getOne },
  { method: 'POST', auth: true, validate: [invoiceCreateSchema, 'body'], match: match('/invoices', opt), handler: invoiceController.create },
  { method: 'PUT', auth: true, validate: [invoiceUpdateSchema, 'body'], match: match('/invoices/:id', opt), handler: invoiceController.replace },
  { method: 'PATCH', auth: true, validate: [invoiceUpdateSchema, 'body'], match: match('/invoices/:id', opt), handler: invoiceController.update },
  { method: 'DELETE', auth: true, match: match('/invoices/:id', opt), handler: invoiceController.remove },
  { method: 'PATCH', auth: true, validate: [dueDateSchema, 'body'], match: match('/invoices/:id/due-date', opt), handler: invoiceController.updateDueDate },

  { method: 'GET', auth: true, match: match('/payments/history', opt), handler: paymentController.history },
  { method: 'POST', auth: true, validate: [paymentCreateSchema, 'body'], match: match('/invoices/:invoiceId/payments', opt), handler: paymentController.add },
  { method: 'POST', auth: true, match: match('/invoices/:invoiceId/mark-paid', opt), handler: paymentController.markPaid },
  { method: 'POST', auth: true, match: match('/invoices/:invoiceId/mark-unpaid', opt), handler: paymentController.markUnpaid },

  { method: 'GET', auth: true, match: match('/sales/report', opt), handler: salesController.report },

  { method: 'GET', auth: true, match: match('/inventory/invoice-form-data', opt), handler: inventoryController.invoiceFormData },
  { method: 'GET', auth: true, match: match('/inventory/categories', opt), handler: inventoryController.listCategories },
  { method: 'GET', auth: true, match: match('/inventory/categories/:id', opt), handler: inventoryController.categoryDetail },
  { method: 'POST', auth: true, validate: [categoryWriteSchema, 'body'], match: match('/inventory/categories', opt), handler: inventoryController.createCategory },
  { method: 'PATCH', auth: true, validate: [categoryWriteSchema, 'body'], match: match('/inventory/categories/:id', opt), handler: inventoryController.updateCategory },
  { method: 'DELETE', auth: true, match: match('/inventory/categories/:id', opt), handler: inventoryController.deleteCategory },

  { method: 'POST', auth: true, validate: [inventoryItemWriteSchema, 'body'], match: match('/inventory/items', opt), handler: inventoryController.createItem },
  { method: 'PATCH', auth: true, validate: [inventoryItemWriteSchema, 'body'], match: match('/inventory/items/:id', opt), handler: inventoryController.updateItem },
  { method: 'DELETE', auth: true, match: match('/inventory/items/:id', opt), handler: inventoryController.deleteItem },
  { method: 'POST', auth: true, validate: [markSoldSchema, 'body'], match: match('/inventory/items/:id/mark-sold', opt), handler: inventoryController.markSold },
  { method: 'POST', auth: true, match: match('/inventory/items/:id/mark-unsold', opt), handler: inventoryController.markUnsold },

  { method: 'POST', auth: true, validate: [weightStockWriteSchema, 'body'], match: match('/inventory/weight-stock', opt), handler: inventoryController.createWeightStock },
  { method: 'DELETE', auth: true, match: match('/inventory/weight-stock/:id', opt), handler: inventoryController.deleteWeightStock },

  { method: 'GET', auth: true, match: match('/suppliers', opt), handler: supplierController.listSuppliers },
  { method: 'POST', auth: true, validate: [supplierWriteSchema, 'body'], match: match('/suppliers', opt), handler: supplierController.createSupplier },
  { method: 'PATCH', auth: true, validate: [supplierWriteSchema, 'body'], match: match('/suppliers/:id', opt), handler: supplierController.updateSupplier },
  { method: 'DELETE', auth: true, match: match('/suppliers/:id', opt), handler: supplierController.deleteSupplier },

  { method: 'GET', auth: true, match: match('/purchases', opt), handler: supplierController.listPurchases },
  { method: 'POST', auth: true, validate: [purchaseWriteSchema, 'body'], match: match('/purchases', opt), handler: supplierController.createPurchase },
  { method: 'PATCH', auth: true, validate: [purchaseWriteSchema, 'body'], match: match('/purchases/:id', opt), handler: supplierController.updatePurchase },
  { method: 'DELETE', auth: true, match: match('/purchases/:id', opt), handler: supplierController.deletePurchase },

  { method: 'GET', auth: true, match: match('/petty-expenses', opt), handler: pettyController.list },
  { method: 'POST', auth: true, validate: [pettyExpenseWriteSchema, 'body'], match: match('/petty-expenses', opt), handler: pettyController.create },
  { method: 'DELETE', auth: true, match: match('/petty-expenses/:id', opt), handler: pettyController.remove },

  { method: 'GET', auth: true, match: match('/advance-payments', opt), handler: advanceController.list },
  { method: 'POST', auth: true, validate: [advancePaymentWriteSchema, 'body'], match: match('/advance-payments', opt), handler: advanceController.create },
  { method: 'DELETE', auth: true, match: match('/advance-payments/:id', opt), handler: advanceController.remove },
];

function findRoute(method, pathname) {
  const path = normalizePath(pathname);
  for (const route of ROUTES) {
    if (route.method !== method) continue;
    const result = route.match(path);
    if (result !== false && result != null) {
      return { route, params: result.params || {} };
    }
  }
  return null;
}

export async function dispatchApi({ method, pathname, searchParams, headers, body }) {
  await connectDatabase();

  const path = normalizePath(pathname);
  const req = buildReq({
    method,
    pathname: path,
    searchParams,
    headers,
    body,
    params: {},
  });
  const res = createMockRes();

  try {
    const found = findRoute(method, pathname);
    if (!found) {
      throw new AppError(`Not found: ${method} ${path}`, 404, 'NOT_FOUND');
    }
    Object.assign(req.params, found.params);

    if (found.route.auth) {
      await authenticateRequest(req);
    }
    if (found.route.validate) {
      const [schema, src] = found.route.validate;
      applyValidation(schema, src, req);
    }

    await Promise.resolve(found.route.handler(req, res));
    if (!res._finished) {
      throw new Error('Handler did not send a response');
    }
    return mockResToNextResponse(res);
  } catch (err) {
    const resErr = createMockRes();
    errorHandler(err, req, resErr, () => {});
    return mockResToNextResponse(resErr);
  }
}
