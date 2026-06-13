import type { CreateOrderInput, Order } from '@sol25/shared';
import { eq, inArray } from 'drizzle-orm';
import type { Database } from '../../db/index.js';
import { orderItems, orders, products, users } from '../../db/schema.js';
import { ConflictError, NotFoundError } from '../../lib/errors.js';
import { OrdersRepository } from './orders.repository.js';

type OrderRow = Awaited<ReturnType<OrdersRepository['list']>>[number];

function toOrders(rows: OrderRow[]): Order[] {
  const grouped = new Map<string, Order>();

  for (const row of rows) {
    const existing = grouped.get(row.orderId);
    const order =
      existing ??
      ({
        id: row.orderId,
        userId: row.userId,
        total: row.total,
        status: 'placed',
        createdAt: row.createdAt.toISOString(),
        items: [],
      } satisfies Order);

    order.items.push({
      id: row.itemId,
      orderId: row.orderId,
      productId: row.productId,
      productName: row.productName,
      productSku: row.productSku,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      lineTotal: Number((row.unitPrice * row.quantity).toFixed(2)),
    });

    grouped.set(row.orderId, order);
  }

  return Array.from(grouped.values());
}

export class OrdersService {
  constructor(
    private readonly db: Database,
    private readonly ordersRepository: OrdersRepository,
  ) {}

  async list() {
    const rows = await this.ordersRepository.list();
    return toOrders(rows);
  }

  async findById(id: string) {
    const rows = await this.ordersRepository.findWithItems(id);

    if (rows.length === 0) {
      throw new NotFoundError('Order not found');
    }

    const [order] = toOrders(rows);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return order;
  }

  async create(input: CreateOrderInput) {
    const requestedByProductId = new Map<string, number>();

    for (const item of input.items) {
      requestedByProductId.set(item.productId, (requestedByProductId.get(item.productId) ?? 0) + item.quantity);
    }

    const productIds = Array.from(requestedByProductId.keys());

    return this.db.transaction(async (tx) => {
      const user = await tx.query.users.findFirst({
        where: eq(users.id, input.userId),
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const lockedProducts = await tx.select().from(products).where(inArray(products.id, productIds)).for('update');

      if (lockedProducts.length !== productIds.length) {
        throw new NotFoundError('One or more products were not found');
      }

      let total = 0;

      for (const product of lockedProducts) {
        const requestedQuantity = requestedByProductId.get(product.id) ?? 0;

        if (product.stockQuantity < requestedQuantity) {
          throw new ConflictError('Insufficient stock', {
            productId: product.id,
            sku: product.sku,
            requestedQuantity,
            availableQuantity: product.stockQuantity,
          });
        }

        total += product.price * requestedQuantity;
      }

      const [order] = await tx
        .insert(orders)
        .values({
          userId: input.userId,
          total: Number(total.toFixed(2)),
        })
        .returning();

      if (!order) {
        throw new Error('Order creation failed');
      }

      await tx.insert(orderItems).values(
        lockedProducts.map((product) => ({
          orderId: order.id,
          productId: product.id,
          quantity: requestedByProductId.get(product.id) ?? 0,
          unitPrice: product.price,
        })),
      );

      for (const product of lockedProducts) {
        const requestedQuantity = requestedByProductId.get(product.id) ?? 0;

        await tx
          .update(products)
          .set({
            stockQuantity: product.stockQuantity - requestedQuantity,
            updatedAt: new Date(),
          })
          .where(eq(products.id, product.id));
      }

      const rows = await tx
        .select({
          orderId: orders.id,
          userId: orders.userId,
          total: orders.total,
          status: orders.status,
          createdAt: orders.createdAt,
          itemId: orderItems.id,
          productId: products.id,
          productName: products.name,
          productSku: products.sku,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
        })
        .from(orders)
        .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
        .innerJoin(products, eq(products.id, orderItems.productId))
        .where(eq(orders.id, order.id))
        .orderBy(orderItems.id);

      const [createdOrder] = toOrders(rows);

      if (!createdOrder) {
        throw new Error('Order lookup failed');
      }

      return createdOrder;
    });
  }
}
