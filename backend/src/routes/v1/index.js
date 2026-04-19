import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

import * as authController from '../../controllers/auth.controller.js';
import * as clientController from '../../controllers/client.controller.js';
import * as invoiceController from '../../controllers/invoice.controller.js';
import * as dashboardController from '../../controllers/dashboard.controller.js';
import * as paymentController from '../../controllers/payment.controller.js';
import * as salesController from '../../controllers/sales.controller.js';
import * as inventoryController from '../../controllers/inventory.controller.js';
import * as supplierController from '../../controllers/supplier.controller.js';
import * as pettyController from '../../controllers/pettyExpense.controller.js';
import * as advanceController from '../../controllers/advancePayment.controller.js';

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
} from '../../validators/schemas.js';

export const apiV1Router = Router();

/* ── Public ───────────────────────────────────────── */
apiV1Router.post('/auth/register', validate(registerSchema), asyncHandler(authController.register));
apiV1Router.post('/auth/login', validate(loginSchema), asyncHandler(authController.login));
apiV1Router.get('/public/invoices/:token', asyncHandler(invoiceController.publicByToken));

/* ── Authenticated ──────────────────────────────── */
apiV1Router.use(requireAuth);

apiV1Router.get('/auth/me', asyncHandler(authController.me));
apiV1Router.patch('/auth/profile', validate(businessProfileSchema), asyncHandler(authController.upsertProfile));

apiV1Router.get('/dashboard', asyncHandler(dashboardController.summary));

apiV1Router.get('/clients', asyncHandler(clientController.list));
apiV1Router.get('/clients/:id', asyncHandler(clientController.getOne));
apiV1Router.post('/clients', validate(clientWriteSchema), asyncHandler(clientController.create));
apiV1Router.put('/clients/:id', validate(clientWriteSchema), asyncHandler(clientController.replace));
apiV1Router.patch('/clients/:id', validate(clientPatchSchema), asyncHandler(clientController.update));
apiV1Router.delete('/clients/:id', asyncHandler(clientController.remove));

apiV1Router.get('/invoices', asyncHandler(invoiceController.list));
apiV1Router.get('/invoices/:id/pdf', asyncHandler(invoiceController.downloadPdf));
apiV1Router.get('/invoices/:id', asyncHandler(invoiceController.getOne));
apiV1Router.post('/invoices', validate(invoiceCreateSchema), asyncHandler(invoiceController.create));
apiV1Router.put('/invoices/:id', validate(invoiceUpdateSchema), asyncHandler(invoiceController.replace));
apiV1Router.patch('/invoices/:id', validate(invoiceUpdateSchema), asyncHandler(invoiceController.update));
apiV1Router.delete('/invoices/:id', asyncHandler(invoiceController.remove));
apiV1Router.patch(
  '/invoices/:id/due-date',
  validate(dueDateSchema),
  asyncHandler(invoiceController.updateDueDate),
);

apiV1Router.get('/payments/history', asyncHandler(paymentController.history));
apiV1Router.post(
  '/invoices/:invoiceId/payments',
  validate(paymentCreateSchema),
  asyncHandler(paymentController.add),
);
apiV1Router.post('/invoices/:invoiceId/mark-paid', asyncHandler(paymentController.markPaid));
apiV1Router.post('/invoices/:invoiceId/mark-unpaid', asyncHandler(paymentController.markUnpaid));

apiV1Router.get('/sales/report', asyncHandler(salesController.report));

apiV1Router.get('/inventory/invoice-form-data', asyncHandler(inventoryController.invoiceFormData));
apiV1Router.get('/inventory/categories', asyncHandler(inventoryController.listCategories));
apiV1Router.get('/inventory/categories/:id', asyncHandler(inventoryController.categoryDetail));
apiV1Router.post('/inventory/categories', validate(categoryWriteSchema), asyncHandler(inventoryController.createCategory));
apiV1Router.patch('/inventory/categories/:id', validate(categoryWriteSchema), asyncHandler(inventoryController.updateCategory));
apiV1Router.delete('/inventory/categories/:id', asyncHandler(inventoryController.deleteCategory));

apiV1Router.post('/inventory/items', validate(inventoryItemWriteSchema), asyncHandler(inventoryController.createItem));
apiV1Router.patch('/inventory/items/:id', validate(inventoryItemWriteSchema), asyncHandler(inventoryController.updateItem));
apiV1Router.delete('/inventory/items/:id', asyncHandler(inventoryController.deleteItem));
apiV1Router.post('/inventory/items/:id/mark-sold', validate(markSoldSchema), asyncHandler(inventoryController.markSold));
apiV1Router.post('/inventory/items/:id/mark-unsold', asyncHandler(inventoryController.markUnsold));

apiV1Router.post('/inventory/weight-stock', validate(weightStockWriteSchema), asyncHandler(inventoryController.createWeightStock));
apiV1Router.delete('/inventory/weight-stock/:id', asyncHandler(inventoryController.deleteWeightStock));

apiV1Router.get('/suppliers', asyncHandler(supplierController.listSuppliers));
apiV1Router.post('/suppliers', validate(supplierWriteSchema), asyncHandler(supplierController.createSupplier));
apiV1Router.patch('/suppliers/:id', validate(supplierWriteSchema), asyncHandler(supplierController.updateSupplier));
apiV1Router.delete('/suppliers/:id', asyncHandler(supplierController.deleteSupplier));

apiV1Router.get('/purchases', asyncHandler(supplierController.listPurchases));
apiV1Router.post('/purchases', validate(purchaseWriteSchema), asyncHandler(supplierController.createPurchase));
apiV1Router.patch('/purchases/:id', validate(purchaseWriteSchema), asyncHandler(supplierController.updatePurchase));
apiV1Router.delete('/purchases/:id', asyncHandler(supplierController.deletePurchase));

apiV1Router.get('/petty-expenses', asyncHandler(pettyController.list));
apiV1Router.post('/petty-expenses', validate(pettyExpenseWriteSchema), asyncHandler(pettyController.create));
apiV1Router.delete('/petty-expenses/:id', asyncHandler(pettyController.remove));

apiV1Router.get('/advance-payments', asyncHandler(advanceController.list));
apiV1Router.post('/advance-payments', validate(advancePaymentWriteSchema), asyncHandler(advanceController.create));
apiV1Router.delete('/advance-payments/:id', asyncHandler(advanceController.remove));
