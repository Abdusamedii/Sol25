import { z } from 'zod';

export const productCategories = [
  'Grocery',
  'Kitchen',
  'Electronics',
  'Clothing',
  'Sports',
  'Beauty',
  'Home',
  'Garden',
  'Toys',
  'Books',
  'Automotive',
  'Health',
] as const;

export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  sku: z.string().min(1),
  price: z.coerce.number().positive(),
  stockQuantity: z.number().int().min(0),
  category: z.string().min(1),
  imageUrl: z.string().url().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createProductSchema = productSchema
  .pick({
    name: true,
    sku: true,
    price: true,
    stockQuantity: true,
    category: true,
  })
  .extend({
    stockQuantity: z.number().int().min(0),
    imageUrl: z.string().url().nullish(),
  });

export const updateProductSchema = createProductSchema.partial();

export const productIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const productSortFieldSchema = z.enum(['createdAt', 'price', 'name', 'sku']);

export const productSortOrderSchema = z.enum(['asc', 'desc']);

export const productListQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    q: z.string().trim().optional(),
    category: z.string().trim().optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    sortBy: productSortFieldSchema.default('createdAt'),
    sortOrder: productSortOrderSchema.default('asc'),
  })
  .refine(
    (query) => query.minPrice === undefined || query.maxPrice === undefined || query.minPrice <= query.maxPrice,
    {
      message: 'minPrice must be less than or equal to maxPrice',
      path: ['minPrice'],
    },
  );

export const paginatedProductsSchema = z.object({
  data: z.array(productSchema),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export type Product = z.infer<typeof productSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductIdParams = z.infer<typeof productIdParamsSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type ProductListQueryInput = z.input<typeof productListQuerySchema>;
export type PaginatedProducts = z.infer<typeof paginatedProductsSchema>;
export type ProductSortField = z.infer<typeof productSortFieldSchema>;
export type ProductSortOrder = z.infer<typeof productSortOrderSchema>;
