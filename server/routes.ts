import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertSupplierSchema, insertProductSchema, insertSaleSchema, 
  insertPurchaseSchema, insertAiDocumentSchema, insertCategorySchema 
} from "@shared/schema";
import multer from "multer";
import axios from 'axios';
import { aiService } from './ai-service';

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

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, validatedData);
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
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

  // Process document with AI using direct API call
  async function processDocumentWithAI(documentId: string, base64Data: string, mimeType: string) {
    try {
      // Get API key from environment
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey.trim() === '') {
        throw new Error('API key is not set');
      }
      
      console.log('Processing document with API key:', apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 4));
      
      // Try direct API call first
      try {
        const systemPrompt = `You are an expert financial document processor specializing in receipts and invoices.
Extract the following information from the document:
- amount (number): The total amount paid
- vendor (string): The business name
- category (string): Use one of: Office Supplies, Travel, Meals & Entertainment, Equipment, Software, Other
- description (string): Brief description of the purchase
- date (string): Date in YYYY-MM-DD format
- documentType (string): "receipt", "invoice", or "expense"

Return ONLY valid JSON with these exact field names.`;

        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      data: base64Data,
                      mimeType: mimeType,
                    }
                  },
                  {
                    text: systemPrompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 1024
            }
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 30000
          }
        );
        
        if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          const rawJson = response.data.candidates[0].content.parts[0].text;
          console.log('Raw AI response:', rawJson.substring(0, 100) + '...');
          
          // Extract JSON from response
          const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
          const cleanJson = jsonMatch ? jsonMatch[0] : rawJson;
          
          // Parse the JSON
          const extractedData = JSON.parse(cleanJson);
          
          // Update document with extracted data
          await storage.updateAiDocument(documentId, {
            status: "completed",
            extractedData: JSON.stringify(extractedData),
            amount: extractedData.amount ? extractedData.amount.toString() : undefined,
            vendor: extractedData.vendor,
            category: extractedData.category,
            description: extractedData.description,
            documentDate: extractedData.date ? new Date(extractedData.date) : undefined
          });
          
          console.log('Document processed successfully with direct API call');
          return;
        }
      } catch (directApiError: unknown) {
        console.error('Direct API call failed:', directApiError instanceof Error ? directApiError.message : String(directApiError));
        if (axios.isAxiosError(directApiError) && directApiError.response) {
          console.error('Error details:', directApiError.response.data);
        }
      }
      
      // Fall back to AI service if direct call fails
      console.log('Falling back to AI service...');
      const extractedData = await aiService.analyzeDocumentImage(base64Data, mimeType);
      
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
      console.error("AI processing failed:", error);
      
      try {
        // Get the document to access the filename for fallback processing
        const document = await storage.getAiDocument(documentId);
        if (document && document.filename) {
          // Use fallback processing when AI fails
          const fallbackData = aiService.fallbackDocumentAnalysis(document.filename);
          
          await storage.updateAiDocument(documentId, {
            status: "completed",
            extractedData: JSON.stringify(fallbackData),
            amount: fallbackData.amount ? fallbackData.amount.toString() : undefined,
            vendor: fallbackData.vendor,
            category: fallbackData.category,
            description: fallbackData.description,
            documentDate: fallbackData.date ? new Date(fallbackData.date) : undefined
          });
          
          console.log("Used fallback processing for document:", documentId);
          return;
        }
      } catch (fallbackError) {
        console.error("Fallback processing also failed:", fallbackError);
      }
      
      // If everything fails, mark as failed
      await storage.updateAiDocument(documentId, {
        status: "failed"
      });
    }
  }

  // Product image upload and extraction
  app.post("/api/products/extract-from-image", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }

      const base64Data = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      
      // Extract product information from the image
      const productInfo = await aiService.extractProductInfo(base64Data, mimeType);
      
      // Check if a similar product already exists
      const existingProducts = await storage.getProducts();
      const similarProduct = existingProducts.find(p => 
        p.name.toLowerCase() === productInfo.name.toLowerCase() ||
        (productInfo.sku && p.sku && p.sku.toLowerCase() === productInfo.sku.toLowerCase())
      );
      
      // Return the extracted product info along with any similar existing product
      res.json({
        extractedProduct: productInfo,
        similarProduct: similarProduct || null,
        exists: !!similarProduct
      });
    } catch (error) {
      console.error("Product extraction failed:", error);
      res.status(500).json({ message: "Failed to extract product information" });
    }
  });

  // Create product from extracted data
  app.post("/api/products/create-from-extraction", async (req, res) => {
    try {
      const { productData, overwriteExisting, existingProductId } = req.body;
      
      // Validate product data
      if (!productData || !productData.name) {
        return res.status(400).json({ message: "Invalid product data" });
      }
      
      // Format the product data to match the schema
      const productToSave = {
        name: productData.name,
        description: productData.description || '',
        sku: productData.sku || `SKU-${Date.now()}`,
        categoryId: productData.categoryId || null,
        supplierId: productData.supplierId || null,
        unitPrice: productData.unitPrice || 0,
        quantity: productData.quantity || 1,
        minStock: productData.minStock || 5
      };
      
      let product;
      
      // Check if we should update an existing product
      if (overwriteExisting && existingProductId) {
        product = await storage.updateProduct(existingProductId, productToSave);
      } else {
        product = await storage.createProduct(productToSave);
      }
      
      res.json(product);
    } catch (error) {
      console.error("Failed to create/update product:", error);
      res.status(400).json({ message: "Failed to create/update product" });
    }
  });

  // General image analysis
  app.post("/api/image-analysis", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }

      const base64Data = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      
      // Try to reload the API key in case it was set after the service was initialized
      aiService.reloadApiKey();
      
      // Analyze the image using AI
      const analysisResult = await aiService.analyzeImage(base64Data, mimeType);
      
      res.json(analysisResult);
    } catch (error) {
      console.error("Image analysis failed:", error);
      res.status(500).json({ 
        message: "Failed to analyze image",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Purchase extraction from image
  app.post("/api/purchases/extract-from-image", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }

      const base64Data = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      const filename = req.file.originalname;
      
      // Try to reload the API key in case it was set after the service was initialized
      aiService.reloadApiKey();
      
      // Extract purchase information from the image
      const purchaseInfo = await aiService.extractPurchaseInfo(base64Data, mimeType, filename);
      
      // Check if a similar supplier already exists
      const existingSuppliers = await storage.getSuppliers();
      const similarSupplier = existingSuppliers.find(s => 
        s.name.toLowerCase() === purchaseInfo.vendor.toLowerCase()
      );
      
      // Return the extracted purchase info along with any similar existing supplier
      res.json({
        extractedPurchase: purchaseInfo,
        similarSupplier: similarSupplier || null,
        supplierExists: !!similarSupplier
      });
    } catch (error) {
      console.error("Purchase extraction failed:", error);
      res.status(500).json({ 
        message: "Failed to extract purchase information",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create purchase from extracted data
  app.post("/api/purchases/create-from-extraction", async (req, res) => {
    try {
      const { purchaseData, createNewSupplier } = req.body;
      
      // Validate purchase data
      if (!purchaseData || !purchaseData.vendor || purchaseData.totalAmount === undefined) {
        return res.status(400).json({ message: "Invalid purchase data" });
      }
      
      // Find or create supplier
      let supplierId;
      
      if (createNewSupplier) {
        // Create a new supplier
        const newSupplier = await storage.createSupplier({
          name: purchaseData.vendor,
          email: '',
          phone: '',
          address: ''
        });
        supplierId = newSupplier.id;
      } else {
        // Find existing supplier
        const existingSuppliers = await storage.getSuppliers();
        const similarSupplier = existingSuppliers.find(s => 
          s.name.toLowerCase() === purchaseData.vendor.toLowerCase()
        );
        
        if (similarSupplier) {
          supplierId = similarSupplier.id;
        } else {
          // Create a new supplier if none exists
          const newSupplier = await storage.createSupplier({
            name: purchaseData.vendor,
            email: '',
            phone: '',
            address: ''
          });
          supplierId = newSupplier.id;
        }
      }
      
      // Generate a purchase number if not provided
      const purchaseNumber = purchaseData.invoiceNumber || `PO-${Date.now().toString().slice(-6)}`;
      
      // Format the purchase data
      const purchaseToSave = {
        purchaseNumber,
        supplierId,
        totalAmount: purchaseData.totalAmount.toString(),
        taxAmount: purchaseData.taxAmount ? purchaseData.taxAmount.toString() : "0",
        status: "received"
      };
      
      // Get all existing products
      const existingProducts = await storage.getProducts();
      
      // Get all categories
      const categories = await storage.getCategories();
      
      // Process purchase items and handle inventory
      const items = [];
      const productUpdates = [];
      const newProducts = [];
      const newCategories = [];
      
      for (const item of purchaseData.items) {
        // Try to find a matching product by name
        const matchingProduct = existingProducts.find(p => 
          p.name.toLowerCase() === item.description.toLowerCase()
        );
        
        let productId;
        let categoryId = null;
        
        // Find or create category if provided
        if (item.category) {
          // Try to find a matching category
          const matchingCategory = categories.find(c => 
            c.name.toLowerCase() === item.category.toLowerCase()
          );
          
          if (matchingCategory) {
            categoryId = matchingCategory.id;
          } else {
            // Create a new category
            const newCategory = await storage.createCategory({
              name: item.category,
              description: `Category for ${item.category} products`
            });
            categoryId = newCategory.id;
            newCategories.push(newCategory);
            categories.push(newCategory); // Add to our local categories list
          }
        }
        
        if (matchingProduct) {
          // Update existing product stock
          productId = matchingProduct.id;
          const newQuantity = (matchingProduct.quantity || 0) + item.quantity;
          
          // Update with category if it was empty before
          if (categoryId && !matchingProduct.categoryId) {
            await storage.updateProduct(productId, { 
              quantity: newQuantity,
              categoryId,
              supplierId // Update supplier ID to link with current supplier
            });
          } else {
            await storage.updateProduct(productId, { 
              quantity: newQuantity,
              supplierId // Update supplier ID to link with current supplier
            });
          }
          
          productUpdates.push({
            id: productId,
            quantity: newQuantity,
            categoryId
          });
        } else {
          // Create a new product
          const newProduct = await storage.createProduct({
            name: item.description,
            description: `Added from purchase ${purchaseNumber}`,
            sku: `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            unitPrice: item.unitPrice.toString(),
            quantity: item.quantity,
            minStock: Math.max(1, Math.floor(item.quantity / 2)), // Set min stock to half of initial quantity
            categoryId,
            supplierId
          });
          
          productId = newProduct.id;
          newProducts.push(newProduct);
        }
        
        // Add the item to the purchase
        items.push({
          productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          totalPrice: item.totalPrice.toString(),
          description: item.description
        });
      }
      
      // Create the purchase
      const purchase = await storage.createPurchase(purchaseToSave, items);
      
      res.json({
        purchase,
        updatedProducts: productUpdates.length,
        newProducts: newProducts.length,
        newCategories: newCategories.length
      });
    } catch (error) {
      console.error("Failed to create purchase:", error);
      res.status(400).json({ message: "Failed to create purchase" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
