import { AppError } from '../utils/AppError.js';

/**
 * @param {import('joi').ObjectSchema} schema
 * @param {'body'|'query'|'params'} source
 */
export function applyValidation(schema, source, req) {
  const value = req[source];
  const { error, value: normalized } = schema.validate(value, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const details = error.details.map((d) => d.message).join('; ');
    throw new AppError(details, 422, 'VALIDATION_ERROR');
  }
  req[source] = normalized;
}
