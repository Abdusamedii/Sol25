import type { CreateOrderInput, Order, Payment } from '@sol25/shared';
import { eq, inArray } from 'drizzle-orm';
import type { Database } from '../../db/index.js';
import { orderItems, orders, payments, products, users } from '../../db/schema.js';
import { BadRequestError, ConflictError, NotFoundError, PaymentDeclinedError } from '../../lib/errors.js';
import type { OrderWithItemsRow } from './orders.repository.js';
import { OrdersRepository } from './orders.repository.js';

const ACCEPTED_TEST_CARD = '1111111111111111';
const DECLINED_TEST_CARD = '4444444444444444';

function normalizeCardNumber(cardNumber: string) {
  return cardNumber.replace(/\D/g, '');
}

function evaluateTestCard(cardNumber: string) {
  if (cardNumber === ACCEPTED_TEST_CARD) {
    return 'success' as const;
  }

  if (cardNumber === DECLINED_TEST_CARD) {
    return 'declined' as const;
  }

  return 'invalid' as const;
}

function toShippingAddress(row: OrderWithItemsRow) {
  return {
    line1: row.shippingAddressLine1,
    line2: row.shippingAddressLine2?.trim() || undefined,
    city: row.shippingCity,
    postalCode: row.shippingPostalCode,
    country: row.shippingCountry,
  };
}

function toPayment(row: OrderWithItemsRow): Payment | undefined {
  if (!row.paymentId || row.paymentAmount === null || !row.paymentStatus) {
    return undefined;
  }

  return {
    id: row.paymentId,
    orderId: row.orderId,
    amount: row.paymentAmount,
    status: row.paymentStatus,
    cardLast4: row.cardLast4,
    failureReason: row.failureReason,
    createdAt: row.paymentCreatedAt!.toISOString(),
    updatedAt: row.paymentUpdatedAt!.toISOString(),
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
  };
}

function toOrders(rows: OrderWithItemsRow[]): Order[] {
  const grouped = new Map<string, Order>();

  for (const row of rows) {
    const existing = grouped.get(row.orderId);
    const order =
      existing ??
      ({
        id: row.orderId,
        userId: row.userId,
        total: row.total,
        status: row.status,
        shippingAddress: toShippingAddress(row),
        createdAt: row.createdAt.toISOString(),
        items: [],
        payment: toPayment(row),
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

  async create(userId: string, input: CreateOrderInput) {
    const normalizedCard = normalizeCardNumber(input.cardNumber);
    const cardResult = evaluateTestCard(normalizedCard);

    if (cardResult === 'invalid') {
      throw new BadRequestError('Invalid test card number');
    }

    if (cardResult === 'declined') {
      throw new PaymentDeclinedError('Payment declined');
    }

    const cardLast4 = normalizedCard.slice(-4);
    const now = new Date();
    const requestedByProductId = new Map<string, number>();

    for (const item of input.items) {
      requestedByProductId.set(item.productId, (requestedByProductId.get(item.productId) ?? 0) + item.quantity);
    }

    const productIds = Array.from(requestedByProductId.keys());

    return this.db.transaction(async (tx) => {
      const user = await tx.query.users.findFirst({
        where: eq(users.id, userId),
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

      const orderTotal = Number(total.toFixed(2));

      for (const product of lockedProducts) {
        const requestedQuantity = requestedByProductId.get(product.id) ?? 0;

        await tx
          .update(products)
          .set({
            stockQuantity: product.stockQuantity - requestedQuantity,
            updatedAt: now,
          })
          .where(eq(products.id, product.id));
      }

      const [order] = await tx
        .insert(orders)
        .values({
          userId,
          total: orderTotal,
          status: 'paid',
          shippingAddressLine1: input.shippingAddress.line1,
          shippingAddressLine2: input.shippingAddress.line2,
          shippingCity: input.shippingAddress.city,
          shippingPostalCode: input.shippingAddress.postalCode,
          shippingCountry: input.shippingAddress.country,
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

      await tx.insert(payments).values({
        orderId: order.id,
        amount: orderTotal,
        status: 'succeeded',
        cardLast4,
        failureReason: null,
        updatedAt: now,
        paidAt: now,
      });

      const rows = await tx
        .select({
          orderId: orders.id,
          userId: orders.userId,
          total: orders.total,
          status: orders.status,
          shippingAddressLine1: orders.shippingAddressLine1,
          shippingAddressLine2: orders.shippingAddressLine2,
          shippingCity: orders.shippingCity,
          shippingPostalCode: orders.shippingPostalCode,
          shippingCountry: orders.shippingCountry,
          createdAt: orders.createdAt,
          itemId: orderItems.id,
          productId: products.id,
          productName: products.name,
          productSku: products.sku,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
          paymentId: payments.id,
          paymentAmount: payments.amount,
          paymentStatus: payments.status,
          cardLast4: payments.cardLast4,
          failureReason: payments.failureReason,
          paymentCreatedAt: payments.createdAt,
          paymentUpdatedAt: payments.updatedAt,
          paidAt: payments.paidAt,
        })
        .from(orders)
        .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
        .innerJoin(products, eq(products.id, orderItems.productId))
        .leftJoin(payments, eq(payments.orderId, orders.id))
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
