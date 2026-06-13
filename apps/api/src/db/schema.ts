import { relations, sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const userRole = pgEnum('user_role', ['admin', 'customer']);

export const orderStatus = pgEnum('order_status', [
  'pending_payment',
  'paid',
  'payment_failed',
  'cancelled',
]);

export const paymentStatus = pgEnum('payment_status', ['pending', 'succeeded', 'failed']);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    username: varchar('username', { length: 64 }).notNull(),
    passwordHash: varchar('password_hash', { length: 256 }).notNull(),
    role: userRole('role').notNull().default('customer'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('users_username_unique').on(table.username)],
);

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    sku: varchar('sku', { length: 64 }).notNull(),
    price: numeric('price', { precision: 12, scale: 2, mode: 'number' }).notNull(),
    stockQuantity: integer('stock_quantity').notNull(),
    category: varchar('category', { length: 120 }).notNull(),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('products_sku_unique').on(table.sku),
    index('products_price_idx').on(table.price),
    index('products_created_at_id_idx').on(table.createdAt, table.id),
    index('products_category_idx').on(table.category),
    check('products_price_positive', sql`${table.price} > 0`),
    check('products_stock_quantity_nonnegative', sql`${table.stockQuantity} >= 0`),
  ],
);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    total: numeric('total', { precision: 12, scale: 2, mode: 'number' }).notNull(),
    status: orderStatus('status').notNull().default('paid'),
    shippingAddressLine1: varchar('shipping_address_line1', { length: 255 }).notNull(),
    shippingAddressLine2: varchar('shipping_address_line2', { length: 255 }),
    shippingCity: varchar('shipping_city', { length: 120 }).notNull(),
    shippingPostalCode: varchar('shipping_postal_code', { length: 32 }).notNull(),
    shippingCountry: varchar('shipping_country', { length: 120 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('orders_user_id_idx').on(table.userId)],
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    amount: numeric('amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
    status: paymentStatus('status').notNull().default('pending'),
    cardLast4: varchar('card_last4', { length: 4 }),
    failureReason: text('failure_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
  },
  (table) => [
    index('payments_order_id_idx').on(table.orderId),
    check('payments_amount_positive', sql`${table.amount} > 0`),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2, mode: 'number' }).notNull(),
  },
  (table) => [
    index('order_items_order_id_idx').on(table.orderId),
    index('order_items_product_id_idx').on(table.productId),
    check('order_items_quantity_positive', sql`${table.quantity} > 0`),
    check('order_items_unit_price_positive', sql`${table.unitPrice} > 0`),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  payment: one(payments),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type PaymentRow = typeof payments.$inferSelect;
export type NewPaymentRow = typeof payments.$inferInsert;
