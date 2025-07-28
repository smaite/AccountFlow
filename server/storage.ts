import {
  type Category, type InsertCategory,
  type Supplier, type InsertSupplier,
  type Product, type InsertProduct, type ProductWithDetails,
  type Sale, type InsertSale, type SaleWithItems,
  type SaleItem, type InsertSaleItem,
  type Purchase, type InsertPurchase, type PurchaseWithItems,
  type PurchaseItem, type InsertPurchaseItem,
  type AiDocument, type InsertAiDocument
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: string): Promise<void>;
  
  // Products
  getProducts(): Promise<ProductWithDetails[]>;
  getProduct(id: string): Promise<ProductWithDetails | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  updateProductQuantity(id: string, quantity: number): Promise<void>;
  
  // Sales
  getSales(): Promise<Sale[]>;
  getSale(id: string): Promise<SaleWithItems | undefined>;
  createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<SaleWithItems>;
  updateSaleStatus(id: string, status: string): Promise<Sale>;
  
  // Purchases
  getPurchases(): Promise<Purchase[]>;
  getPurchase(id: string): Promise<PurchaseWithItems | undefined>;
  createPurchase(purchase: InsertPurchase, items: InsertPurchaseItem[]): Promise<PurchaseWithItems>;
  updatePurchaseStatus(id: string, status: string): Promise<Purchase>;
  
  // AI Documents
  getAiDocuments(): Promise<AiDocument[]>;
  getAiDocument(id: string): Promise<AiDocument | undefined>;
  createAiDocument(document: InsertAiDocument): Promise<AiDocument>;
  updateAiDocument(id: string, document: Partial<InsertAiDocument>): Promise<AiDocument>;
  deleteAiDocument(id: string): Promise<void>;
  
  // Reports
  getDashboardStats(): Promise<{
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    pendingInvoices: number;
  }>;
  
  getRevenueByMonth(months: number): Promise<{ month: string; revenue: number }[]>;
  getRecentTransactions(limit: number): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private categories: Map<string, Category> = new Map();
  private suppliers: Map<string, Supplier> = new Map();
  private products: Map<string, Product> = new Map();
  private sales: Map<string, Sale> = new Map();
  private saleItems: Map<string, SaleItem> = new Map();
  private purchases: Map<string, Purchase> = new Map();
  private purchaseItems: Map<string, PurchaseItem> = new Map();
  private aiDocuments: Map<string, AiDocument> = new Map();

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Create default categories
    const categories = [
      { name: "Office Supplies", description: "Office equipment and supplies" },
      { name: "Travel", description: "Business travel expenses" },
      { name: "Meals & Entertainment", description: "Business meals and entertainment" },
      { name: "Equipment", description: "Business equipment purchases" },
      { name: "Software", description: "Software licenses and subscriptions" }
    ];

    categories.forEach(cat => {
      const id = randomUUID();
      this.categories.set(id, { id, ...cat });
    });
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const newCategory: Category = { id, ...category };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const id = randomUUID();
    const newSupplier: Supplier = { 
      id, 
      ...supplier, 
      createdAt: new Date() 
    };
    this.suppliers.set(id, newSupplier);
    return newSupplier;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const existing = this.suppliers.get(id);
    if (!existing) throw new Error("Supplier not found");
    
    const updated = { ...existing, ...supplier };
    this.suppliers.set(id, updated);
    return updated;
  }

  async deleteSupplier(id: string): Promise<void> {
    this.suppliers.delete(id);
  }

  // Products
  async getProducts(): Promise<ProductWithDetails[]> {
    return Array.from(this.products.values()).map(product => ({
      ...product,
      category: product.categoryId ? this.categories.get(product.categoryId) : undefined,
      supplier: product.supplierId ? this.suppliers.get(product.supplierId) : undefined
    }));
  }

  async getProduct(id: string): Promise<ProductWithDetails | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    return {
      ...product,
      category: product.categoryId ? this.categories.get(product.categoryId) : undefined,
      supplier: product.supplierId ? this.suppliers.get(product.supplierId) : undefined
    };
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const newProduct: Product = { 
      id, 
      ...product, 
      createdAt: new Date() 
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    const existing = this.products.get(id);
    if (!existing) throw new Error("Product not found");
    
    const updated = { ...existing, ...product };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    this.products.delete(id);
  }

  async updateProductQuantity(id: string, quantity: number): Promise<void> {
    const product = this.products.get(id);
    if (!product) throw new Error("Product not found");
    
    product.quantity = quantity;
    this.products.set(id, product);
  }

  // Sales
  async getSales(): Promise<Sale[]> {
    return Array.from(this.sales.values());
  }

  async getSale(id: string): Promise<SaleWithItems | undefined> {
    const sale = this.sales.get(id);
    if (!sale) return undefined;
    
    const items = Array.from(this.saleItems.values())
      .filter(item => item.saleId === id)
      .map(item => ({
        ...item,
        product: this.products.get(item.productId)!
      }));
    
    return { ...sale, items };
  }

  async createSale(sale: InsertSale, items: InsertSaleItem[]): Promise<SaleWithItems> {
    const id = randomUUID();
    const newSale: Sale = { 
      id, 
      ...sale, 
      createdAt: new Date() 
    };
    this.sales.set(id, newSale);

    const saleItemsWithProducts = items.map(item => {
      const itemId = randomUUID();
      const saleItem: SaleItem = { id: itemId, ...item, saleId: id };
      this.saleItems.set(itemId, saleItem);
      
      // Update product quantity
      const product = this.products.get(item.productId);
      if (product) {
        product.quantity = (product.quantity || 0) - item.quantity;
        this.products.set(item.productId, product);
      }
      
      return {
        ...saleItem,
        product: this.products.get(item.productId)!
      };
    });

    return { ...newSale, items: saleItemsWithProducts };
  }

  async updateSaleStatus(id: string, status: string): Promise<Sale> {
    const sale = this.sales.get(id);
    if (!sale) throw new Error("Sale not found");
    
    sale.status = status;
    this.sales.set(id, sale);
    return sale;
  }

  // Purchases
  async getPurchases(): Promise<Purchase[]> {
    return Array.from(this.purchases.values());
  }

  async getPurchase(id: string): Promise<PurchaseWithItems | undefined> {
    const purchase = this.purchases.get(id);
    if (!purchase) return undefined;
    
    const supplier = this.suppliers.get(purchase.supplierId);
    if (!supplier) return undefined;
    
    const items = Array.from(this.purchaseItems.values())
      .filter(item => item.purchaseId === id)
      .map(item => ({
        ...item,
        product: this.products.get(item.productId)!
      }));
    
    return { ...purchase, supplier, items };
  }

  async createPurchase(purchase: InsertPurchase, items: InsertPurchaseItem[]): Promise<PurchaseWithItems> {
    const id = randomUUID();
    const newPurchase: Purchase = { 
      id, 
      ...purchase, 
      createdAt: new Date() 
    };
    this.purchases.set(id, newPurchase);

    const purchaseItemsWithProducts = items.map(item => {
      const itemId = randomUUID();
      const purchaseItem: PurchaseItem = { id: itemId, ...item, purchaseId: id };
      this.purchaseItems.set(itemId, purchaseItem);
      
      // Update product quantity when received
      if (newPurchase.status === "received") {
        const product = this.products.get(item.productId);
        if (product) {
          product.quantity = (product.quantity || 0) + item.quantity;
          this.products.set(item.productId, product);
        }
      }
      
      return {
        ...purchaseItem,
        product: this.products.get(item.productId)!
      };
    });

    const supplier = this.suppliers.get(purchase.supplierId)!;
    return { ...newPurchase, supplier, items: purchaseItemsWithProducts };
  }

  async updatePurchaseStatus(id: string, status: string): Promise<Purchase> {
    const purchase = this.purchases.get(id);
    if (!purchase) throw new Error("Purchase not found");
    
    // If changing to received, update product quantities
    if (status === "received" && purchase.status !== "received") {
      const items = Array.from(this.purchaseItems.values())
        .filter(item => item.purchaseId === id);
      
      items.forEach(item => {
        const product = this.products.get(item.productId);
        if (product) {
          product.quantity = (product.quantity || 0) + item.quantity;
          this.products.set(item.productId, product);
        }
      });
    }
    
    purchase.status = status;
    this.purchases.set(id, purchase);
    return purchase;
  }

  // AI Documents
  async getAiDocuments(): Promise<AiDocument[]> {
    return Array.from(this.aiDocuments.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getAiDocument(id: string): Promise<AiDocument | undefined> {
    return this.aiDocuments.get(id);
  }

  async createAiDocument(document: InsertAiDocument): Promise<AiDocument> {
    const id = randomUUID();
    const newDocument: AiDocument = { 
      id, 
      ...document, 
      createdAt: new Date() 
    };
    this.aiDocuments.set(id, newDocument);
    return newDocument;
  }

  async updateAiDocument(id: string, document: Partial<InsertAiDocument>): Promise<AiDocument> {
    const existing = this.aiDocuments.get(id);
    if (!existing) throw new Error("Document not found");
    
    const updated = { ...existing, ...document };
    this.aiDocuments.set(id, updated);
    return updated;
  }

  async deleteAiDocument(id: string): Promise<void> {
    this.aiDocuments.delete(id);
  }

  // Reports
  async getDashboardStats(): Promise<{
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    pendingInvoices: number;
  }> {
    const sales = Array.from(this.sales.values());
    const purchases = Array.from(this.purchases.values());
    
    const totalRevenue = sales
      .filter(sale => sale.status === "paid")
      .reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
    
    const totalExpenses = purchases
      .filter(purchase => purchase.status === "received")
      .reduce((sum, purchase) => sum + parseFloat(purchase.totalAmount), 0);
    
    const pendingInvoices = sales.filter(sale => sale.status === "pending").length;
    
    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      pendingInvoices
    };
  }

  async getRevenueByMonth(months: number): Promise<{ month: string; revenue: number }[]> {
    const sales = Array.from(this.sales.values())
      .filter(sale => sale.status === "paid");
    
    const now = new Date();
    const result = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthRevenue = sales
        .filter(sale => {
          const saleDate = new Date(sale.createdAt!);
          return saleDate.getMonth() === date.getMonth() && 
                 saleDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
      
      result.push({ month: monthStr, revenue: monthRevenue });
    }
    
    return result;
  }

  async getRecentTransactions(limit: number): Promise<any[]> {
    const sales = Array.from(this.sales.values()).map(sale => ({
      ...sale,
      type: 'income',
      description: `Payment from ${sale.customerName}`,
      amount: parseFloat(sale.totalAmount)
    }));
    
    const purchases = Array.from(this.purchases.values()).map(purchase => ({
      ...purchase,
      type: 'expense',
      description: `Purchase from ${this.suppliers.get(purchase.supplierId)?.name || 'Unknown'}`,
      amount: -parseFloat(purchase.totalAmount)
    }));
    
    return [...sales, ...purchases]
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
