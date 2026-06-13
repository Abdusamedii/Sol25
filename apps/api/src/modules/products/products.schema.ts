import { z } from 'zod';
import {
  createProductSchema,
  paginatedProductsSchema,
  productIdParamsSchema,
  productListQuerySchema,
  productSchema,
  updateProductSchema,
} from '@sol25/shared';

export const productListQueryParamsSchema = productListQuerySchema;
export const productListResponseSchema = paginatedProductsSchema;
export const productResponseSchema = productSchema;
export const createProductBodySchema = createProductSchema;
export const updateProductBodySchema = updateProductSchema;
export const productParamsSchema = productIdParamsSchema;
