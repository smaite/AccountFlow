import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertSupplierSchema, insertProductSchema, insertSaleSchema, 
  insertPurchaseSchema, insertAiDocumentSchema, insertCategorySchema 
} from "@shared/schema";
import multer from "multer";
import { analyzeDocumentImage } from "./gemini";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/revenue-chart", async (req, res) => {
    try {
      const months = parseInt(req.query.months as string) || 6;
      const data = await storage.getRevenueByMonth(months);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch revenue data" });
    }
  });

  app.get("/api/dashboard/recent-transactions", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const transactions = await storage.getRecentTransactions(limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent transactions" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  // Suppliers
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.get("/api/suppliers/:id", async (req, res) => {
    try {
      const supplier = await storage.getSupplier(req.params.id);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch supplier" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      res.json(supplier);
    } catch (error) {
      res.status(400).json({ message: "Invalid supplier data" });
    }
  });

  app.patch("/api/suppliers/:id", async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(req.params.id, validatedData);
      res.json(supplier);
    } catch (error) {
      res.status(400).json({ message: "Invalid supplier data" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      await storage.deleteSupplier(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.patch("/api/products/:id", async (req, res) => {
    try {
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, validatedData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Sales
  app.get("/api/sales", async (req, res) => {
    try {
      const sales = await storage.getSales();
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.get("/api/sales/:id", async (req, res) => {
    try {
      const sale = await storage.getSale(req.params.id);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      res.json(sale);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sale" });
    }
  });

  app.post("/api/sales", async (req, res) => {
    try {
      const { items, ...saleData } = req.body;
      const validatedSale = insertSaleSchema.parse(saleData);
      const sale = await storage.createSale(validatedSale, items);
      res.json(sale);
    } catch (error) {
      res.status(400).json({ message: "Invalid sale data" });
    }
  });

  app.patch("/api/sales/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const sale = await storage.updateSaleStatus(req.params.id, status);
      res.json(sale);
    } catch (error) {
      res.status(400).json({ message: "Failed to update sale status" });
    }
  });

  // Purchases
  app.get("/api/purchases", async (req, res) => {
    try {
      const purchases = await storage.getPurchases();
      res.json(purchases);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.get("/api/purchases/:id", async (req, res) => {
    try {
      const purchase = await storage.getPurchase(req.params.id);
      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      res.json(purchase);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch purchase" });
    }
  });

  app.post("/api/purchases", async (req, res) => {
    try {
      const { items, ...purchaseData } = req.body;
      const validatedPurchase = insertPurchaseSchema.parse(purchaseData);
      const purchase = await storage.createPurchase(validatedPurchase, items);
      res.json(purchase);
    } catch (error) {
      res.status(400).json({ message: "Invalid purchase data" });
    }
  });

  app.patch("/api/purchases/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const purchase = await storage.updatePurchaseStatus(req.params.id, status);
      res.json(purchase);
    } catch (error) {
      res.status(400).json({ message: "Failed to update purchase status" });
    }
  });

  // AI Documents
  app.get("/api/ai-documents", async (req, res) => {
    try {
      const documents = await storage.getAiDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI documents" });
    }
  });

  app.get("/api/ai-documents/:id", async (req, res) => {
    try {
      const document = await storage.getAiDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  app.post("/api/ai-documents/upload", upload.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const base64Data = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      
      // Create initial document record
      const document = await storage.createAiDocument({
        filename: req.file.originalname,
        originalData: `data:${mimeType};base64,${base64Data}`,
        status: "processing",
        documentType: "receipt"
      });

      // Process with AI asynchronously
      processDocumentWithAI(document.id, base64Data, mimeType).catch(console.error);

      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.patch("/api/ai-documents/:id", async (req, res) => {
    try {
      const validatedData = insertAiDocumentSchema.partial().parse(req.body);
      const document = await storage.updateAiDocument(req.params.id, validatedData);
      res.json(document);
    } catch (error) {
      res.status(400).json({ message: "Invalid document data" });
    }
  });

  app.delete("/api/ai-documents/:id", async (req, res) => {
    try {
      await storage.deleteAiDocument(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Process document with AI using Gemini
  async function processDocumentWithAI(documentId: string, base64Data: string, mimeType: string) {
    try {
      const extractedData = await analyzeDocumentImage(base64Data, mimeType);
      
      await storage.updateAiDocument(documentId, {
        status: "completed",
        extractedData: JSON.stringify(extractedData),
        amount: extractedData.amount ? extractedData.amount.toString() : undefined,
        vendor: extractedData.vendor,
        category: extractedData.category,
        description: extractedData.description,
        documentDate: extractedData.date ? new Date(extractedData.date) : undefined
      });
    } catch (error) {
      console.error("Gemini AI processing failed:", error);
      await storage.updateAiDocument(documentId, {
        status: "failed"
      });
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
