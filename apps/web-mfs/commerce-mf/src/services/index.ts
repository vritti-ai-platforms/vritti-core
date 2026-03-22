// Categories
export { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from './category.service';

// Products
export { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from './product.service';

// Stations
export { getStations, getStationById, createStation, updateStation, deleteStation } from './station.service';

// Orders
export {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  addOrderItems,
  updateOrderItemStatus,
} from './order.service';

// KOT
export { getActiveKotItems, updateKotItemStatus } from './kot.service';

// Invoices
export { generateInvoice, getInvoices, getInvoiceById, updateInvoiceStatus } from './invoice.service';
