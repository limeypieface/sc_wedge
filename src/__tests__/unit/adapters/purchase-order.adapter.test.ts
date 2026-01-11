/**
 * Purchase Order Adapter Tests
 *
 * Tests for the PO data adapter functions.
 * Verifies that mock data is returned correctly and
 * error handling works as expected.
 */

import {
  fetchPurchaseOrder,
  fetchPurchaseOrderHeader,
  fetchLineItems,
  fetchCharges,
  fetchVendorContact,
  getLineCharges,
  getHeaderCharges,
  calculateLineTotals,
} from '../../../app/supply/purchase-orders/_adapters/purchase-order.adapter';
import type { POCharge, LineItem } from '../../../app/supply/purchase-orders/_lib/types';

describe('Purchase Order Adapter', () => {
  describe('fetchPurchaseOrder', () => {
    it('should return purchase order data for valid PO number', async () => {
      const result = await fetchPurchaseOrder('PO-0861');

      expect(result).toBeDefined();
      expect(result.purchaseOrder).toBeDefined();
      expect(result.purchaseOrder.header).toBeDefined();
      expect(result.purchaseOrder.lineItems).toBeDefined();
      expect(Array.isArray(result.purchaseOrder.lineItems)).toBe(true);
    });

    it('should include all required PO data sections', async () => {
      const result = await fetchPurchaseOrder('PO-0861');
      const po = result.purchaseOrder;

      expect(po.header).toBeDefined();
      expect(po.lineItems).toBeDefined();
      expect(po.charges).toBeDefined();
      expect(po.discounts).toBeDefined();
      expect(po.totals).toBeDefined();
      expect(po.vendorContact).toBeDefined();
    });

    it('should return correct totals structure', async () => {
      const result = await fetchPurchaseOrder('PO-0861');
      const totals = result.purchaseOrder.totals;

      expect(typeof totals.subtotal).toBe('number');
      expect(typeof totals.totalCharges).toBe('number');
      expect(typeof totals.totalDiscounts).toBe('number');
      expect(typeof totals.taxAmount).toBe('number');
      expect(typeof totals.grandTotal).toBe('number');
    });

    it('should throw error for invalid PO number', async () => {
      await expect(fetchPurchaseOrder('INVALID-PO')).rejects.toThrow(
        'Purchase Order INVALID-PO not found'
      );
    });
  });

  describe('fetchPurchaseOrderHeader', () => {
    it('should return header for valid PO number', async () => {
      const header = await fetchPurchaseOrderHeader('PO-0861');

      expect(header).toBeDefined();
      expect(header.poNumber).toBe('PO-0861');
    });

    it('should throw error for invalid PO number', async () => {
      await expect(fetchPurchaseOrderHeader('INVALID')).rejects.toThrow();
    });
  });

  describe('fetchLineItems', () => {
    it('should return array of line items', async () => {
      const lineItems = await fetchLineItems('PO-0861');

      expect(Array.isArray(lineItems)).toBe(true);
      expect(lineItems.length).toBeGreaterThan(0);
    });

    it('should have required line item properties', async () => {
      const lineItems = await fetchLineItems('PO-0861');
      const firstItem = lineItems[0];

      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('sku');
      expect(firstItem).toHaveProperty('name');
      expect(firstItem).toHaveProperty('quantity');
      expect(firstItem).toHaveProperty('unitPrice');
    });
  });

  describe('fetchCharges', () => {
    it('should return array of charges', async () => {
      const charges = await fetchCharges('PO-0861');

      expect(Array.isArray(charges)).toBe(true);
    });
  });

  describe('fetchVendorContact', () => {
    it('should return vendor contact info', async () => {
      const contact = await fetchVendorContact('PO-0861');

      expect(contact).toBeDefined();
      expect(contact).toHaveProperty('name');
      expect(contact).toHaveProperty('email');
      expect(contact).toHaveProperty('phone');
    });
  });
});

describe('Charge Utility Functions', () => {
  const mockCharges: POCharge[] = [
    {
      id: 'CHG-001',
      type: 'shipping',
      name: 'Ground Freight',
      calculation: 'fixed',
      rate: 125,
      amount: 125,
      taxable: false,
      billable: true,
    },
    {
      id: 'CHG-002',
      type: 'expedite',
      name: 'Rush Fee',
      calculation: 'percentage',
      rate: 0.03,
      amount: 50,
      appliesToLines: [1, 2],
      taxable: true,
      billable: true,
    },
    {
      id: 'CHG-003',
      type: 'handling',
      name: 'Special Packaging',
      calculation: 'fixed',
      rate: 25,
      amount: 25,
      appliesToLines: [1],
      taxable: true,
      billable: true,
    },
  ];

  describe('getLineCharges', () => {
    it('should return charges for specific line', () => {
      const line1Charges = getLineCharges(1, mockCharges);

      expect(line1Charges).toHaveLength(2);
      expect(line1Charges.map(c => c.id)).toContain('CHG-002');
      expect(line1Charges.map(c => c.id)).toContain('CHG-003');
    });

    it('should return empty array for line with no charges', () => {
      const line3Charges = getLineCharges(3, mockCharges);

      expect(line3Charges).toHaveLength(0);
    });

    it('should return only charges that apply to that line', () => {
      const line2Charges = getLineCharges(2, mockCharges);

      expect(line2Charges).toHaveLength(1);
      expect(line2Charges[0].id).toBe('CHG-002');
    });
  });

  describe('getHeaderCharges', () => {
    it('should return charges without line assignments', () => {
      const headerCharges = getHeaderCharges(mockCharges);

      expect(headerCharges).toHaveLength(1);
      expect(headerCharges[0].id).toBe('CHG-001');
    });

    it('should not include line-specific charges', () => {
      const headerCharges = getHeaderCharges(mockCharges);
      const hasLineCharges = headerCharges.some(
        c => c.appliesToLines && c.appliesToLines.length > 0
      );

      expect(hasLineCharges).toBe(false);
    });
  });
});

describe('calculateLineTotals', () => {
  const mockLineItems = [
    { id: 1, lineTotal: 100 },
    { id: 2, lineTotal: 200 },
    { id: 3, lineTotal: 300 },
  ] as unknown as LineItem[];

  it('should calculate correct subtotal', () => {
    const result = calculateLineTotals(mockLineItems);

    expect(result.subtotal).toBe(600);
  });

  it('should return correct item count', () => {
    const result = calculateLineTotals(mockLineItems);

    expect(result.itemCount).toBe(3);
  });

  it('should handle empty array', () => {
    const result = calculateLineTotals([]);

    expect(result.subtotal).toBe(0);
    expect(result.itemCount).toBe(0);
  });
});
