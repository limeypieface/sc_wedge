/**
 * SO Fulfillment Mock Data
 *
 * Manufacturing orders, component status, and fulfillment tracking for sales orders.
 */

import {
  ManufacturingOrder,
  MOComponent,
  MOOperation,
  SOLineFulfillmentStatus,
  SOFulfillmentSummary,
} from "@/types/manufacturing-order.types";

// ============================================================================
// MANUFACTURING ORDERS FOR SO-2024-00142
// ============================================================================

// MO 1: Premium Widget Assembly (100 units for SO line 1)
// 60 complete, 40 remaining - some component shortages
const mo001Components: MOComponent[] = [
  {
    id: "MO001-C1",
    lineNumber: 1,
    sku: "CTRL-UNIT-A",
    name: "Control Unit Alpha",
    description: "Primary control module",
    quantityRequired: 100,
    quantityOnHand: 45,
    quantityAllocated: 40,
    quantityIssued: 60,
    quantityShort: 0,
    quantityOnOrder: 0,
    status: "issued",
    unitOfMeasure: "EA",
    unitCost: 12.50,
    extendedCost: 1250.00,
  },
  {
    id: "MO001-C2",
    lineNumber: 2,
    sku: "HSG-PREM-100",
    name: "Premium Housing",
    description: "Aluminum housing with coating",
    quantityRequired: 100,
    quantityOnHand: 85,
    quantityAllocated: 40,
    quantityIssued: 60,
    quantityShort: 0,
    quantityOnOrder: 0,
    status: "allocated",
    unitOfMeasure: "EA",
    unitCost: 8.75,
    extendedCost: 875.00,
  },
  {
    id: "MO001-C3",
    lineNumber: 3,
    sku: "SENSOR-TEMP-01",
    name: "Temperature Sensor",
    description: "High precision temp sensor",
    quantityRequired: 100,
    quantityOnHand: 22,
    quantityAllocated: 22,
    quantityIssued: 60,
    quantityShort: 18,
    quantityOnOrder: 25,
    expectedReceiptDate: "Jan 28, 2026",
    purchaseOrders: [
      {
        poNumber: "PO-0861",
        quantity: 25,
        expectedDate: "Jan 28, 2026",
        status: "partial",
      },
    ],
    status: "short",
    unitOfMeasure: "EA",
    unitCost: 4.25,
    extendedCost: 425.00,
  },
  {
    id: "MO001-C4",
    lineNumber: 4,
    sku: "PCB-MAIN-V2",
    name: "Main Circuit Board",
    description: "v2 main PCB assembly",
    quantityRequired: 100,
    quantityOnHand: 0,
    quantityAllocated: 0,
    quantityIssued: 60,
    quantityShort: 40,
    quantityOnOrder: 50,
    expectedReceiptDate: "Feb 5, 2026",
    purchaseOrders: [
      {
        poNumber: "PO-0858",
        quantity: 50,
        expectedDate: "Feb 5, 2026",
        status: "open",
      },
    ],
    status: "short",
    unitOfMeasure: "EA",
    unitCost: 15.00,
    extendedCost: 1500.00,
  },
  {
    id: "MO001-C5",
    lineNumber: 5,
    sku: "CONN-SET-A",
    name: "Connector Set A",
    description: "Standard connector package",
    quantityRequired: 100,
    quantityOnHand: 150,
    quantityAllocated: 40,
    quantityIssued: 60,
    quantityShort: 0,
    quantityOnOrder: 0,
    status: "allocated",
    unitOfMeasure: "SET",
    unitCost: 2.10,
    extendedCost: 210.00,
  },
];

const mo001Operations: MOOperation[] = [
  {
    id: "MO001-OP10",
    operationNumber: 10,
    name: "SMT Assembly",
    workCenter: "SMT-01",
    setupHours: 0.5,
    runHoursPerUnit: 0.08,
    totalHours: 8.5,
    hoursComplete: 5.3,
    quantityComplete: 60,
    quantityInProcess: 0,
    quantityScrapped: 0,
    status: "in_progress",
    scheduledStart: "Jan 20, 2026",
    scheduledEnd: "Jan 24, 2026",
    actualStart: "Jan 20, 2026",
  },
  {
    id: "MO001-OP20",
    operationNumber: 20,
    name: "Final Assembly",
    workCenter: "ASSY-02",
    setupHours: 0.25,
    runHoursPerUnit: 0.15,
    totalHours: 15.25,
    hoursComplete: 9.25,
    quantityComplete: 60,
    quantityInProcess: 0,
    quantityScrapped: 0,
    status: "in_progress",
    scheduledStart: "Jan 24, 2026",
    scheduledEnd: "Jan 28, 2026",
    actualStart: "Jan 24, 2026",
  },
  {
    id: "MO001-OP30",
    operationNumber: 30,
    name: "Test & QC",
    workCenter: "TEST-01",
    setupHours: 0,
    runHoursPerUnit: 0.1,
    totalHours: 10,
    hoursComplete: 6,
    quantityComplete: 60,
    quantityInProcess: 0,
    quantityScrapped: 0,
    status: "in_progress",
    scheduledStart: "Jan 28, 2026",
    scheduledEnd: "Jan 30, 2026",
    actualStart: "Jan 26, 2026",
  },
  {
    id: "MO001-OP40",
    operationNumber: 40,
    name: "Pack & Label",
    workCenter: "PACK-01",
    setupHours: 0,
    runHoursPerUnit: 0.05,
    totalHours: 5,
    hoursComplete: 3,
    quantityComplete: 60,
    quantityInProcess: 0,
    quantityScrapped: 0,
    status: "in_progress",
    scheduledStart: "Jan 30, 2026",
    scheduledEnd: "Jan 31, 2026",
    actualStart: "Jan 28, 2026",
  },
];

const manufacturingOrder001: ManufacturingOrder = {
  id: "mo-001",
  moNumber: "MO-2026-00147",
  itemSku: "WDG-100",
  itemName: "Premium Widget Assembly",
  itemDescription: "High-quality widget assembly for industrial use",
  quantityOrdered: 100,
  quantityComplete: 60,
  quantityInProcess: 0,
  quantityScrapped: 0,
  status: "in_progress",
  percentComplete: 60,
  releaseDate: "Jan 18, 2026",
  scheduledStart: "Jan 20, 2026",
  scheduledEnd: "Jan 31, 2026",
  requiredDate: "Feb 1, 2026",
  projectedCompletion: "Feb 8, 2026",
  actualStart: "Jan 20, 2026",
  deliveryRisk: "at_risk",
  riskReasons: [
    "PCB shortage: 40 units short, PO-0858 expected Feb 5",
    "Temp sensor shortage: 18 units short, PO-0861 partial receipt expected Jan 28",
  ],
  salesOrderNumber: "SO-2024-00142",
  salesOrderLine: 1,
  components: mo001Components,
  operations: mo001Operations,
  hasShortages: true,
  shortageCount: 2,
  criticalShortages: 1,
  totalMaterialCost: 4260.00,
  totalLaborHours: 38.75,
  laborHoursComplete: 23.55,
};

// MO 2: Standard Widget Kit (50 units for SO line 2) - COMPLETE
const mo002Components: MOComponent[] = [
  {
    id: "MO002-C1",
    lineNumber: 1,
    sku: "KIT-BASE-STD",
    name: "Standard Base Kit",
    quantityRequired: 50,
    quantityOnHand: 0,
    quantityAllocated: 0,
    quantityIssued: 50,
    quantityShort: 0,
    quantityOnOrder: 0,
    status: "issued",
    unitOfMeasure: "EA",
    unitCost: 6.50,
    extendedCost: 325.00,
  },
  {
    id: "MO002-C2",
    lineNumber: 2,
    sku: "WIDGET-CORE-B",
    name: "Widget Core B",
    quantityRequired: 50,
    quantityOnHand: 0,
    quantityAllocated: 0,
    quantityIssued: 50,
    quantityShort: 0,
    quantityOnOrder: 0,
    status: "issued",
    unitOfMeasure: "EA",
    unitCost: 11.00,
    extendedCost: 550.00,
  },
  {
    id: "MO002-C3",
    lineNumber: 3,
    sku: "FASTENER-KIT",
    name: "Fastener Kit",
    quantityRequired: 50,
    quantityOnHand: 0,
    quantityAllocated: 0,
    quantityIssued: 50,
    quantityShort: 0,
    quantityOnOrder: 0,
    status: "issued",
    unitOfMeasure: "SET",
    unitCost: 1.75,
    extendedCost: 87.50,
  },
];

const mo002Operations: MOOperation[] = [
  {
    id: "MO002-OP10",
    operationNumber: 10,
    name: "Kit Assembly",
    workCenter: "ASSY-01",
    setupHours: 0.25,
    runHoursPerUnit: 0.12,
    totalHours: 6.25,
    hoursComplete: 6.25,
    quantityComplete: 50,
    quantityInProcess: 0,
    quantityScrapped: 0,
    status: "complete",
    scheduledStart: "Jan 15, 2026",
    scheduledEnd: "Jan 17, 2026",
    actualStart: "Jan 15, 2026",
    actualEnd: "Jan 16, 2026",
  },
  {
    id: "MO002-OP20",
    operationNumber: 20,
    name: "Quality Check",
    workCenter: "QC-01",
    setupHours: 0,
    runHoursPerUnit: 0.05,
    totalHours: 2.5,
    hoursComplete: 2.5,
    quantityComplete: 50,
    quantityInProcess: 0,
    quantityScrapped: 0,
    status: "complete",
    scheduledStart: "Jan 17, 2026",
    scheduledEnd: "Jan 18, 2026",
    actualStart: "Jan 16, 2026",
    actualEnd: "Jan 17, 2026",
  },
];

const manufacturingOrder002: ManufacturingOrder = {
  id: "mo-002",
  moNumber: "MO-2026-00145",
  itemSku: "WDG-200",
  itemName: "Standard Widget Kit",
  itemDescription: "Standard widget kit with all components",
  quantityOrdered: 50,
  quantityComplete: 50,
  quantityInProcess: 0,
  quantityScrapped: 0,
  status: "complete",
  percentComplete: 100,
  releaseDate: "Jan 12, 2026",
  scheduledStart: "Jan 15, 2026",
  scheduledEnd: "Jan 18, 2026",
  requiredDate: "Jan 25, 2026",
  projectedCompletion: "Jan 17, 2026",
  actualStart: "Jan 15, 2026",
  actualEnd: "Jan 17, 2026",
  deliveryRisk: "on_track",
  salesOrderNumber: "SO-2024-00142",
  salesOrderLine: 2,
  components: mo002Components,
  operations: mo002Operations,
  hasShortages: false,
  shortageCount: 0,
  criticalShortages: 0,
  totalMaterialCost: 962.50,
  totalLaborHours: 8.75,
  laborHoursComplete: 8.75,
};

// MO 3: Widget Deluxe Combo (75 units for SO line 3) - Released, not started
const mo003Components: MOComponent[] = [
  {
    id: "MO003-C1",
    lineNumber: 1,
    sku: "CTRL-UNIT-A",
    name: "Control Unit Alpha",
    quantityRequired: 75,
    quantityOnHand: 45,
    quantityAllocated: 45,
    quantityIssued: 0,
    quantityShort: 30,
    quantityOnOrder: 0,
    status: "short",
    unitOfMeasure: "EA",
    unitCost: 12.50,
    extendedCost: 937.50,
  },
  {
    id: "MO003-C2",
    lineNumber: 2,
    sku: "HSG-DLX-200",
    name: "Deluxe Housing",
    quantityRequired: 75,
    quantityOnHand: 80,
    quantityAllocated: 75,
    quantityIssued: 0,
    quantityShort: 0,
    quantityOnOrder: 0,
    status: "allocated",
    unitOfMeasure: "EA",
    unitCost: 14.25,
    extendedCost: 1068.75,
  },
  {
    id: "MO003-C3",
    lineNumber: 3,
    sku: "PCB-MAIN-V2",
    name: "Main Circuit Board",
    quantityRequired: 75,
    quantityOnHand: 0,
    quantityAllocated: 0,
    quantityIssued: 0,
    quantityShort: 75,
    quantityOnOrder: 50,
    expectedReceiptDate: "Feb 5, 2026",
    purchaseOrders: [
      {
        poNumber: "PO-0858",
        quantity: 50,
        expectedDate: "Feb 5, 2026",
        status: "open",
      },
    ],
    status: "short",
    unitOfMeasure: "EA",
    unitCost: 15.00,
    extendedCost: 1125.00,
  },
  {
    id: "MO003-C4",
    lineNumber: 4,
    sku: "DISPLAY-OLED",
    name: "OLED Display Module",
    quantityRequired: 75,
    quantityOnHand: 60,
    quantityAllocated: 60,
    quantityIssued: 0,
    quantityShort: 15,
    quantityOnOrder: 20,
    expectedReceiptDate: "Feb 10, 2026",
    purchaseOrders: [
      {
        poNumber: "PO-0862",
        quantity: 20,
        expectedDate: "Feb 10, 2026",
        status: "open",
      },
    ],
    status: "short",
    unitOfMeasure: "EA",
    unitCost: 22.00,
    extendedCost: 1650.00,
  },
];

const mo003Operations: MOOperation[] = [
  {
    id: "MO003-OP10",
    operationNumber: 10,
    name: "SMT Assembly",
    workCenter: "SMT-01",
    setupHours: 0.5,
    runHoursPerUnit: 0.1,
    totalHours: 8.0,
    hoursComplete: 0,
    quantityComplete: 0,
    quantityInProcess: 0,
    quantityScrapped: 0,
    status: "pending",
    scheduledStart: "Feb 8, 2026",
    scheduledEnd: "Feb 10, 2026",
  },
  {
    id: "MO003-OP20",
    operationNumber: 20,
    name: "Display Integration",
    workCenter: "ASSY-03",
    setupHours: 0.25,
    runHoursPerUnit: 0.2,
    totalHours: 15.25,
    hoursComplete: 0,
    quantityComplete: 0,
    quantityInProcess: 0,
    quantityScrapped: 0,
    status: "pending",
    scheduledStart: "Feb 10, 2026",
    scheduledEnd: "Feb 14, 2026",
  },
  {
    id: "MO003-OP30",
    operationNumber: 30,
    name: "Final Assembly",
    workCenter: "ASSY-02",
    setupHours: 0.25,
    runHoursPerUnit: 0.15,
    totalHours: 11.5,
    hoursComplete: 0,
    quantityComplete: 0,
    quantityInProcess: 0,
    quantityScrapped: 0,
    status: "pending",
    scheduledStart: "Feb 14, 2026",
    scheduledEnd: "Feb 17, 2026",
  },
  {
    id: "MO003-OP40",
    operationNumber: 40,
    name: "Test & Calibration",
    workCenter: "TEST-02",
    setupHours: 0.5,
    runHoursPerUnit: 0.25,
    totalHours: 19.25,
    hoursComplete: 0,
    quantityComplete: 0,
    quantityInProcess: 0,
    quantityScrapped: 0,
    status: "pending",
    scheduledStart: "Feb 17, 2026",
    scheduledEnd: "Feb 21, 2026",
  },
];

const manufacturingOrder003: ManufacturingOrder = {
  id: "mo-003",
  moNumber: "MO-2026-00152",
  itemSku: "WDG-DLX",
  itemName: "Widget Deluxe Combo",
  itemDescription: "Premium widget with OLED display",
  quantityOrdered: 75,
  quantityComplete: 0,
  quantityInProcess: 0,
  quantityScrapped: 0,
  status: "released",
  percentComplete: 0,
  releaseDate: "Jan 22, 2026",
  scheduledStart: "Feb 8, 2026",
  scheduledEnd: "Feb 21, 2026",
  requiredDate: "Feb 15, 2026",
  projectedCompletion: "Feb 21, 2026",
  deliveryRisk: "late",
  riskReasons: [
    "Material shortages delaying start: PCB (75 short), Control Unit (30 short), Display (15 short)",
    "PO-0858 for PCB expected Feb 5, but only 50 units (25 still short)",
    "Projected completion Feb 21 is 6 days past required date Feb 15",
  ],
  salesOrderNumber: "SO-2024-00142",
  salesOrderLine: 3,
  components: mo003Components,
  operations: mo003Operations,
  hasShortages: true,
  shortageCount: 3,
  criticalShortages: 2,
  totalMaterialCost: 4781.25,
  totalLaborHours: 54.0,
  laborHoursComplete: 0,
};

// ============================================================================
// DATA ACCESS FUNCTIONS
// ============================================================================

const manufacturingOrdersData: Record<string, ManufacturingOrder[]> = {
  "SO-2024-00142": [manufacturingOrder001, manufacturingOrder002, manufacturingOrder003],
};

export function getManufacturingOrdersForSO(soNumber: string): ManufacturingOrder[] {
  return manufacturingOrdersData[soNumber] || [];
}

export function getManufacturingOrder(moNumber: string): ManufacturingOrder | undefined {
  for (const orders of Object.values(manufacturingOrdersData)) {
    const mo = orders.find((m) => m.moNumber === moNumber);
    if (mo) return mo;
  }
  return undefined;
}

export function getSOFulfillmentSummary(soNumber: string): SOFulfillmentSummary | null {
  const manufacturingOrders = getManufacturingOrdersForSO(soNumber);
  if (manufacturingOrders.length === 0) return null;

  // Build line-level summaries
  const lineMap = new Map<number, SOLineFulfillmentStatus>();

  manufacturingOrders.forEach((mo) => {
    const existing = lineMap.get(mo.salesOrderLine);
    if (existing) {
      existing.manufacturingOrders.push(mo);
      existing.quantityInProduction += mo.quantityOrdered - mo.quantityComplete;
      // Aggregate risk (worst wins)
      if (mo.deliveryRisk === "late") existing.deliveryRisk = "late";
      else if (mo.deliveryRisk === "at_risk" && existing.deliveryRisk !== "late") {
        existing.deliveryRisk = "at_risk";
      }
    } else {
      lineMap.set(mo.salesOrderLine, {
        lineNumber: mo.salesOrderLine,
        sku: mo.itemSku,
        itemName: mo.itemName,
        quantityOrdered: mo.quantityOrdered,
        quantityAvailable: mo.quantityComplete,
        quantityInProduction: mo.quantityOrdered - mo.quantityComplete,
        quantityOnOrder: mo.components.reduce((sum, c) => sum + c.quantityOnOrder, 0),
        quantityShipped: 0, // Would come from SO data
        quantityOpen: mo.quantityOrdered - mo.quantityComplete,
        fulfillmentMethod: "make",
        deliveryRisk: mo.deliveryRisk,
        manufacturingOrders: [mo],
        promisedDate: mo.requiredDate,
        projectedShipDate: mo.projectedCompletion,
        daysVariance: calculateDaysVariance(mo.requiredDate, mo.projectedCompletion),
      });
    }
  });

  const lines = Array.from(lineMap.values()).sort((a, b) => a.lineNumber - b.lineNumber);

  // Calculate overall stats
  const linesOnTrack = lines.filter((l) => l.deliveryRisk === "on_track").length;
  const linesAtRisk = lines.filter((l) => l.deliveryRisk === "at_risk").length;
  const linesLate = lines.filter((l) => l.deliveryRisk === "late").length;

  const totalShortages = manufacturingOrders.reduce((sum, mo) => sum + mo.shortageCount, 0);
  const criticalShortages = manufacturingOrders.reduce((sum, mo) => sum + mo.criticalShortages, 0);

  // Determine overall risk
  let overallRisk: "on_track" | "at_risk" | "late" = "on_track";
  let riskSummary = "All lines on track for on-time delivery";

  if (linesLate > 0) {
    overallRisk = "late";
    riskSummary = `${linesLate} line${linesLate > 1 ? "s" : ""} projected late`;
  } else if (linesAtRisk > 0) {
    overallRisk = "at_risk";
    riskSummary = `${linesAtRisk} line${linesAtRisk > 1 ? "s" : ""} at risk due to shortages`;
  }

  if (criticalShortages > 0) {
    riskSummary += `. ${criticalShortages} critical shortage${criticalShortages > 1 ? "s" : ""} blocking production.`;
  }

  // Collect unique PO numbers
  const poSet = new Set<string>();
  const atRiskPOs = new Set<string>();
  manufacturingOrders.forEach((mo) => {
    mo.components.forEach((c) => {
      c.purchaseOrders?.forEach((po) => {
        poSet.add(po.poNumber);
        if (po.status !== "received") atRiskPOs.add(po.poNumber);
      });
    });
  });

  return {
    soNumber,
    customerName: "Acme Manufacturing Inc.",
    overallRisk,
    riskSummary,
    totalLines: lines.length,
    linesOnTrack,
    linesAtRisk,
    linesLate,
    totalMOs: manufacturingOrders.length,
    mosComplete: manufacturingOrders.filter((mo) => mo.status === "complete").length,
    mosInProgress: manufacturingOrders.filter((mo) => mo.status === "in_progress").length,
    mosOnHold: manufacturingOrders.filter((mo) => mo.status === "on_hold").length,
    hasShortages: totalShortages > 0,
    totalShortages,
    criticalShortages,
    openPurchaseOrders: poSet.size,
    purchaseOrdersAtRisk: atRiskPOs.size,
    promisedDeliveryDate: "Feb 15, 2026",
    projectedDeliveryDate: linesLate > 0 ? "Feb 21, 2026" : "Feb 15, 2026",
    lines,
  };
}

function calculateDaysVariance(requiredDate: string, projectedDate?: string): number {
  if (!projectedDate) return 0;
  const required = new Date(requiredDate);
  const projected = new Date(projectedDate);
  const diffTime = required.getTime() - projected.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// ============================================================================
// ALL SHORTAGES ACROSS MANUFACTURING ORDERS
// ============================================================================

export interface ComponentShortage {
  id: string;
  sku: string;
  name: string;
  moNumber: string;
  moItem: string;
  quantityRequired: number;
  quantityShort: number;
  quantityOnOrder: number;
  expectedDate?: string;
  purchaseOrders: { poNumber: string; quantity: number; expectedDate: string; status: string }[];
  isCritical: boolean;
  impact: string;
}

export function getAllShortages(soNumber: string): ComponentShortage[] {
  const manufacturingOrders = getManufacturingOrdersForSO(soNumber);
  const shortages: ComponentShortage[] = [];

  manufacturingOrders.forEach((mo) => {
    mo.components
      .filter((c) => c.status === "short")
      .forEach((c) => {
        shortages.push({
          id: c.id,
          sku: c.sku,
          name: c.name,
          moNumber: mo.moNumber,
          moItem: mo.itemName,
          quantityRequired: c.quantityRequired,
          quantityShort: c.quantityShort,
          quantityOnOrder: c.quantityOnOrder,
          expectedDate: c.expectedReceiptDate,
          purchaseOrders: c.purchaseOrders || [],
          isCritical: c.quantityOnOrder < c.quantityShort,
          impact: `Blocking ${mo.itemName} production`,
        });
      });
  });

  return shortages.sort((a, b) => (a.isCritical === b.isCritical ? 0 : a.isCritical ? -1 : 1));
}
