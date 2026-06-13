import { z } from 'zod';
import { createProductSchema, productIdParamsSchema, productSchema, updateProductSchema } from '@sol25/shared';

export const productListResponseSchema = z.array(productSchema);
export const productResponseSchema = productSchema;
export const createProductBodySchema = createProductSchema;
export const updateProductBodySchema = updateProductSchema;
export const productParamsSchema = productIdParamsSchema;
