// ============================================================
//  TANG 1 - SYSTEM API
//  Boc quanh tung he thong legacy. KHONG chua logic nghiep vu.
//  Nhiem vu duy nhat: goi he thong cu, roi DICH ten truong cua no
//  sang ten chuan cua nhom (Canonical Data Model).
// ============================================================

const axios = require('axios');

const TIMEOUT = Number(process.env.HTTP_TIMEOUT_MS || 3000);

const http = axios.create({ timeout: TIMEOUT });

// Loi chuan hoa - moi System API nem ra loi cung mot kieu
class SystemApiError extends Error {
  constructor(code, message, status = 502, details = {}) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// -------------------- WMS - quan ly kho --------------------

/**
 * Tra ton kho mot san pham.
 * WMS tra ve: ma_hang, ten_hang, so_luong_ton, so_luong_giu, kha_dung, kho
 * Nhom dich sang ten chuan o duoi.
 */
async function getStock(sku) {
  try {
    const { data } = await http.get(`${process.env.WMS_URL}/api/v1/wms/inventory/${sku}`);

    // TODO: doi ten truong ben phai cho khop Canonical Data Model cua nhom
    return {
      sku: data.ma_hang,
      name: data.ten_hang,
      availableStock: data.kha_dung,
      warehouseId: data.kho
    };
  } catch (err) {
    if (err.response?.status === 404) {
      throw new SystemApiError('SKU_NOT_FOUND', `Khong tim thay san pham ${sku}`, 404, { sku });
    }
    throw new SystemApiError('WMS_UNAVAILABLE', 'WMS khong phan hoi', 503, { sku });
  }
}

/**
 * Giu hang trong kho. Tra ve reservationId - PHAI LUU LAI de con hoan tac.
 * TODO: hoan thien ham nay (Scenario 1)
 */
async function reserveStock(sku, qty, orderId) {
  throw new SystemApiError('NOT_IMPLEMENTED', 'reserveStock chua duoc cai dat', 501);
  // Goi ý:
  // POST {WMS_URL}/api/v1/wms/reservations  body { sku, qty, orderId }
  // 201 -> tra ve { reservationId: data.reservationId, sku, qty }
  // 409 -> nem SystemApiError('INSUFFICIENT_STOCK', ..., 409)
}

/** TODO: tra hang ve kho - dung cho buoc hoan tac */
async function releaseStock(reservationId) {
  throw new SystemApiError('NOT_IMPLEMENTED', 'releaseStock chua duoc cai dat', 501);
  // DELETE {WMS_URL}/api/v1/wms/reservations/{reservationId}
}

// -------------------- TMS - van chuyen --------------------

/**
 * Tao van don.
 * CANH BAO: he thong TMS KHONG chong trung. Goi 2 lan cung orderId
 * se tao ra 2 van don khac nhau. Nhom phai tu chong trung o phia minh.
 * TODO: hoan thien (Scenario 1 + 3)
 */
async function createShipment(orderId, address, items) {
  throw new SystemApiError('NOT_IMPLEMENTED', 'createShipment chua duoc cai dat', 501);
  // POST {TMS_URL}/api/v1/tms/shipments  body { orderId, address, items }
  // 201 -> { shipmentId, trackingNo, status }
}

/** TODO: huy van don - dung cho buoc hoan tac */
async function cancelShipment(shipmentId) {
  throw new SystemApiError('NOT_IMPLEMENTED', 'cancelShipment chua duoc cai dat', 501);
  // DELETE {TMS_URL}/api/v1/tms/shipments/{shipmentId}
}

// -------------------- CRM - khach hang --------------------

/**
 * Cong diem thuong.
 * LUU Y: gui vao ten truong la "points" nhung CRM tra ve "diem_hien_tai".
 * TODO: hoan thien (Scenario 1)
 */
async function addLoyaltyPoints(customerId, points, orderId) {
  throw new SystemApiError('NOT_IMPLEMENTED', 'addLoyaltyPoints chua duoc cai dat', 501);
  // PUT {CRM_URL}/api/v1/crm/customers/{customerId}/points  body { points, orderId }
}

// -------------------- PAYMENT - thanh toan --------------------

/** TODO: thu tien - dat PAYMENT_ALWAYS_FAIL=true trong compose de thu duong loi */
async function charge(orderId, amount) {
  throw new SystemApiError('NOT_IMPLEMENTED', 'charge chua duoc cai dat', 501);
  // POST {PAYMENT_URL}/api/v1/payments  body { orderId, amount }
  // 402 -> nem SystemApiError('PAYMENT_DECLINED', ..., 402)
}

// -------------------- Kiem tra suc khoe 4 he thong --------------------

async function checkLegacyHealth() {
  const targets = {
    wms: process.env.WMS_URL,
    tms: process.env.TMS_URL,
    crm: process.env.CRM_URL,
    payment: process.env.PAYMENT_URL
  };
  const result = {};
  await Promise.all(Object.entries(targets).map(async ([name, url]) => {
    try {
      await http.get(`${url}/health`, { timeout: 1500 });
      result[name] = 'UP';
    } catch {
      result[name] = 'DOWN';
    }
  }));
  return result;
}

module.exports = {
  SystemApiError,
  getStock, reserveStock, releaseStock,
  createShipment, cancelShipment,
  addLoyaltyPoints, charge,
  checkLegacyHealth
};
