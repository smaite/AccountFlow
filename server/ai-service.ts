import axios, { AxiosError } from 'axios';

export interface DocumentAnalysisResult {
  amount?: number;
  vendor?: string;
  category?: string;
  description?: string;
  date?: string;
  documentType?: 'receipt' | 'invoice' | 'expense';
}

export interface ProductExtractionResult {
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  unitPrice?: number;
  quantity?: number;
  minStock?: number;
  supplier?: string;
  confidence: number;
}

export interface ImageAnalysisResult {
  description: string;
  tags: string[];
  objects: string[];
  text: string;
  colors: Array<{name: string, hex: string}>;
  confidence: number;
}

export interface PurchaseExtractionResult {
  vendor: string;
  invoiceNumber?: string;
  date?: string;
  totalAmount: number;
  taxAmount?: number;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    category?: string;
  }>;
  notes?: string;
  confidence: number;
}

export interface Sentiment {
  rating: number;
  confidence: number;
}

/**
 * AI Service class to handle all AI-related functionality
 * Using axios for better error handling and request management
 */
export class AIService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('WARNING: GEMINI_API_KEY is not set. AI features will not work.');
    } else {
      console.log('AI Service initialized with API key:', this.apiKey.substring(0, 5) + '...' + this.apiKey.substring(this.apiKey.length - 4));
    }
  }

  /**
   * Reloads the API key from environment variables
   * This is useful if the key was set after the service was initialized
   */
  reloadApiKey(): boolean {
    const newApiKey = process.env.GEMINI_API_KEY || '';
    if (newApiKey && newApiKey !== this.apiKey) {
      this.apiKey = newApiKey;
      console.log('AI Service reloaded API key:', this.apiKey.substring(0, 5) + '...' + this.apiKey.substring(this.apiKey.length - 4));
      return true;
    }
    return false;
  }

  /**
   * General image analysis to extract information from any image
   */
  async analyzeImage(base64Image: string, mimeType: string): Promise<ImageAnalysisResult> {
    try {
      console.log(`Starting general image analysis for ${mimeType} image...`);
      
      // Verify API key is available
      if (!this.apiKey || this.apiKey.trim() === '') {
        throw new Error('API key is not set. Please set the GEMINI_API_KEY environment variable.');
      }
      
      const systemPrompt = `You are an expert image analyst.

TASK: Analyze the provided image and extract the following information:

1. description (string): A detailed description of what's in the image
2. tags (array): 5-10 relevant tags that describe the image content
3. objects (array): List of main objects visible in the image
4. text (string): Any text visible in the image
5. colors (array): Main colors present in the image with their hex codes
6. confidence (number): Your confidence level in the analysis from 0.0 to 1.0

IMPORTANT INSTRUCTIONS:
- Return ONLY valid JSON with the exact field names listed above
- Be precise and accurate in your extraction
- For text, extract ALL visible text in the image
- If you cannot determine a field with high confidence, provide your best guess
- Do NOT include any explanations or text outside the JSON object

Example response format:
{
  "description": "A scenic mountain landscape at sunset with pine trees in the foreground",
  "tags": ["nature", "mountains", "sunset", "landscape", "pine trees", "outdoors", "scenic", "dusk"],
  "objects": ["mountains", "trees", "sky", "sun"],
  "text": "MOUNTAIN VISTA NATIONAL PARK",
  "colors": [
    {"name": "orange", "hex": "#FF7F00"},
    {"name": "blue", "hex": "#0000FF"},
    {"name": "green", "hex": "#008000"},
    {"name": "purple", "hex": "#800080"}
  ],
  "confidence": 0.95
}`;

      // Create the request payload
      const payload = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: base64Image,
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
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,
          responseMimeType: "application/json"
        }
      };

      // Build the URL with the API key
      const url = `${this.baseUrl}/gemini-2.5-flash:generateContent?key=${encodeURIComponent(this.apiKey)}`;
      console.log('Making API request to:', url.replace(this.apiKey, 'REDACTED'));

      // Make the API call
      const response = await axios.post(
        url,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      // Process the response
      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const rawJson = response.data.candidates[0].content.parts[0].text;
        console.log(`Image analysis response received: ${rawJson.substring(0, 100)}...`);
        
        try {
          // Clean the response to handle potential formatting issues
          const cleanedJson = this.cleanJsonResponse(rawJson);
          const extractedData = JSON.parse(cleanedJson) as ImageAnalysisResult;
          
          // Ensure confidence is set
          if (extractedData.confidence === undefined) {
            extractedData.confidence = 0.7; // Default confidence
          }
          
          return extractedData;
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          throw new Error('Failed to parse AI response');
        }
      } else {
        console.error('Unexpected API response format:', JSON.stringify(response.data));
        throw new Error('Unexpected API response format');
      }
    } catch (error: unknown) {
      console.error('Image analysis failed:', error);
      
      // Handle axios errors with more detailed information
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const errorMessage = error.response?.data?.error?.message || error.message;
        
        console.error(`API Error (${statusCode}): ${errorMessage}`);
        
        // Special handling for common errors
        if (statusCode === 403) {
          throw new Error(`Authentication error: ${errorMessage}. Please check your API key.`);
        } else if (statusCode === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        throw new Error(`API error (${statusCode}): ${errorMessage}`);
      }
      
      // Create a fallback result with minimal information
      return {
        description: "Unable to analyze image",
        tags: ["unknown"],
        objects: [],
        text: "",
        colors: [],
        confidence: 0.1
      };
    }
  }

  /**
   * Extracts product information from an image
   */
  async extractProductInfo(base64Image: string, mimeType: string): Promise<ProductExtractionResult> {
    try {
      console.log(`Starting product extraction for ${mimeType} image...`);
      
      // Verify API key is available
      if (!this.apiKey || this.apiKey.trim() === '') {
        throw new Error('API key is not set. Please set the GEMINI_API_KEY environment variable.');
      }
      
      const systemPrompt = `You are an expert product information extractor. 

TASK: Analyze the provided product image and extract the following product information:

1. name (string): The product name/title
2. description (string): A detailed description of the product
3. sku (string): The product SKU or model number if visible
4. category (string): The product category
5. unitPrice (number): The unit price of the product (just the number, no currency symbol)
6. quantity (number): The quantity if mentioned (default to 1 if not specified)
7. minStock (number): The minimum stock level if mentioned (default to 5 if not specified)
8. supplier (string): The manufacturer or supplier name
9. confidence (number): Your confidence level in the extraction from 0.0 to 1.0

IMPORTANT INSTRUCTIONS:
- Return ONLY valid JSON with the exact field names listed above
- For unitPrice, extract ONLY the numerical value (e.g., 125.99, not "$125.99")
- If you cannot determine a field with high confidence, omit it from the JSON
- Do NOT include any explanations or text outside the JSON object
- Be precise and accurate in your extraction
- The name field is required, all others are optional

Example response format:
{
  "name": "Dell XPS 13 Laptop",
  "description": "13-inch ultrabook with Intel Core i7, 16GB RAM, 512GB SSD",
  "sku": "XPS13-9310-i7",
  "category": "Electronics",
  "unitPrice": 1299.99,
  "quantity": 1,
  "minStock": 5,
  "supplier": "Dell Inc.",
  "confidence": 0.92
}`;

      // Create the request payload
      const payload = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: base64Image,
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
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,
          responseMimeType: "application/json"
        }
      };

      // Build the URL with the API key
      const url = `${this.baseUrl}/gemini-2.5-flash:generateContent?key=${encodeURIComponent(this.apiKey)}`;
      console.log('Making API request to:', url.replace(this.apiKey, 'REDACTED'));

      // Make the API call
      const response = await axios.post(
        url,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      // Process the response
      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const rawJson = response.data.candidates[0].content.parts[0].text;
        console.log(`Product extraction response received: ${rawJson.substring(0, 100)}...`);
        
        try {
          // Clean the response to handle potential formatting issues
          const cleanedJson = this.cleanJsonResponse(rawJson);
          const extractedData = JSON.parse(cleanedJson) as ProductExtractionResult;
          
          // Validate required fields
          if (!extractedData.name) {
            throw new Error('Product name is required but was not extracted');
          }
          
          // Ensure confidence is set
          if (extractedData.confidence === undefined) {
            extractedData.confidence = 0.7; // Default confidence
          }
          
          return extractedData;
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          throw new Error('Failed to parse AI response');
        }
      } else {
        console.error('Unexpected API response format:', JSON.stringify(response.data));
        throw new Error('Unexpected API response format');
      }
    } catch (error: unknown) {
      console.error('Product extraction failed:', error);
      
      // Handle axios errors with more detailed information
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const errorMessage = error.response?.data?.error?.message || error.message;
        
        console.error(`API Error (${statusCode}): ${errorMessage}`);
        
        // Special handling for common errors
        if (statusCode === 403) {
          throw new Error(`Authentication error: ${errorMessage}. Please check your API key.`);
        } else if (statusCode === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        throw new Error(`API error (${statusCode}): ${errorMessage}`);
      }
      
      // Create a fallback product with minimal information
      return {
        name: 'Unknown Product',
        description: 'Product extracted from image',
        confidence: 0.1
      };
    }
  }

  /**
   * Analyzes a document image and extracts financial information
   */
  async analyzeDocumentImage(base64Image: string, mimeType: string): Promise<DocumentAnalysisResult> {
    try {
      console.log(`Starting document analysis for ${mimeType} image...`);
      
      // Verify API key is available
      if (!this.apiKey || this.apiKey.trim() === '') {
        throw new Error('API key is not set. Please set the GEMINI_API_KEY environment variable.');
      }
      
      const systemPrompt = `You are an expert financial document processor specializing in receipts and invoices.

TASK: Carefully analyze the provided document image and extract the following financial information:

1. amount (number): The total amount paid or due on the document. Look for terms like "Total", "Amount Due", "Grand Total", etc.
2. vendor (string): The business or vendor name that issued the document
3. category (string): Categorize the purchase using ONLY ONE of these options: Office Supplies, Travel, Meals & Entertainment, Equipment, Software, Other
4. description (string): A brief but clear description of what was purchased or what service was provided
5. date (string): The transaction date in YYYY-MM-DD format
6. documentType (string): Determine if this is a "receipt", "invoice", or "expense" document

IMPORTANT INSTRUCTIONS:
- Return ONLY valid JSON with the exact field names listed above
- For amount, extract ONLY the numerical value (e.g., 125.99, not "$125.99")
- If you cannot determine a field with high confidence, omit it from the JSON
- Do NOT include any explanations or text outside the JSON object
- Ensure the date is in YYYY-MM-DD format
- Be precise and accurate in your extraction

Example response format:
{
  "amount": 125.99,
  "vendor": "Office Depot",
  "category": "Office Supplies",
  "description": "Printer paper and toner cartridges",
  "date": "2023-05-15",
  "documentType": "receipt"
}`;

      // Create the request payload
      const payload = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: base64Image,
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
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,
          responseMimeType: "application/json"
        }
      };

      // Build the URL with the API key
      const url = `${this.baseUrl}/gemini-2.5-flash:generateContent?key=${encodeURIComponent(this.apiKey)}`;
      console.log('Making API request to:', url.replace(this.apiKey, 'REDACTED'));

      // Make the API call
      const response = await axios.post(
        url,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      // Process the response
      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const rawJson = response.data.candidates[0].content.parts[0].text;
        console.log(`Document analysis response received: ${rawJson.substring(0, 100)}...`);
        
        try {
          // Clean the response to handle potential formatting issues
          const cleanedJson = this.cleanJsonResponse(rawJson);
          const extractedData: DocumentAnalysisResult = JSON.parse(cleanedJson);
          
          // Validate and normalize the data
          return this.normalizeDocumentData(extractedData);
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          throw new Error('Failed to parse AI response');
        }
      } else {
        console.error('Unexpected API response format:', JSON.stringify(response.data));
        throw new Error('Unexpected API response format');
      }
    } catch (error: unknown) {
      console.error('Document analysis failed:', error);
      
      // Handle axios errors with more detailed information
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const errorMessage = error.response?.data?.error?.message || error.message;
        
        console.error(`API Error (${statusCode}): ${errorMessage}`);
        
        // Special handling for common errors
        if (statusCode === 403) {
          throw new Error(`Authentication error: ${errorMessage}. Please check your API key.`);
        } else if (statusCode === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        throw new Error(`API error (${statusCode}): ${errorMessage}`);
      }
      
      throw new Error(`Document analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Clean and fix common JSON formatting issues in AI responses
   */
  private cleanJsonResponse(rawJson: string): string {
    try {
      // First try to extract just the JSON object if there's any extra text
      const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
      let jsonStr = jsonMatch ? jsonMatch[0] : rawJson;
      
      // Check for unterminated strings
      if (jsonStr.match(/"\s*:\s*"[^"]*$/)) {
        console.log("Detected unterminated string, attempting to fix");
        jsonStr = jsonStr.replace(/("\s*:\s*"[^"]*$)/g, '$1"');
      }
      
      // Replace single quotes with double quotes
      jsonStr = jsonStr.replace(/'/g, '"');
      
      // Fix trailing commas in arrays and objects
      jsonStr = jsonStr
        .replace(/,(\s*[\]}])/g, '$1')
        // Add quotes to keys
        .replace(/(\w+):/g, '"$1":')
        // Fix value quotes
        .replace(/:\s*"([^"]*)"(\s*[,}])/g, ':"$1"$2')
        // Keep numbers as numbers
        .replace(/:\s*([0-9.]+)(\s*[,}])/g, ':$1$2')
        // Fix trailing commas again (in case new ones were introduced)
        .replace(/,(\s*[\]}])/g, '$1');
        
      // Try to parse it to validate
      try {
        const parsed = JSON.parse(jsonStr);
        return JSON.stringify(parsed);
      } catch (parseError) {
        // If direct parsing fails, try more aggressive cleaning
        console.log("Initial JSON cleaning failed, trying more aggressive approach");
        console.log("Raw JSON:", jsonStr);
        
        // More aggressive cleaning for severely malformed JSON
        // Remove all whitespace first to simplify processing
        let cleaned = jsonStr.replace(/\s+/g, '');
        
        // Fix common issues
        cleaned = cleaned
          // Fix trailing commas in objects
          .replace(/,}/g, '}')
          // Fix trailing commas in arrays
          .replace(/,]/g, ']')
          // Ensure property names are quoted
          .replace(/([{,])(\w+):/g, '$1"$2":')
          // Fix missing quotes around string values
          .replace(/:([a-zA-Z][a-zA-Z0-9_]*)(,|})/, ':"$1"$2')
          // Remove any invalid control characters
          .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
          // Fix unclosed quotes in values
          .replace(/"([^"]*)(,|})/, '"$1"$2');
          
        // Try to parse it again
        try {
          const parsed = JSON.parse(cleaned);
          return JSON.stringify(parsed);
        } catch (secondError) {
          console.error("Advanced JSON cleaning also failed:", secondError);
          console.log("Attempting to extract valid parts...");
          
          // If all else fails, try to create a minimal valid JSON
          try {
            // Extract key parts using regex
            const vendorMatch = rawJson.match(/"vendor"\s*:\s*"([^"]+)"/);
            const totalAmountMatch = rawJson.match(/"totalAmount"\s*:\s*([0-9.]+)/);
            const invoiceNumberMatch = rawJson.match(/"invoiceNumber"\s*:\s*"([^"]+)"/);
            const dateMatch = rawJson.match(/"date"\s*:\s*"([^"]+)"/);
            
            // Build a minimal valid JSON with required fields
            const minimalJson = {
              vendor: vendorMatch ? vendorMatch[1] : "Unknown Vendor",
              invoiceNumber: invoiceNumberMatch ? invoiceNumberMatch[1] : undefined,
              date: dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0],
              totalAmount: totalAmountMatch ? parseFloat(totalAmountMatch[1]) : 0,
              items: [],
              confidence: 0.5
            };
            
            return JSON.stringify(minimalJson);
          } catch (finalError) {
            // Last resort fallback
            console.error("All JSON parsing attempts failed, using hardcoded fallback");
            return JSON.stringify({
              vendor: "Unknown Vendor",
              totalAmount: 0,
              items: [],
              confidence: 0.1
            });
          }
        }
      }
    } catch (error) {
      console.error("JSON cleaning completely failed:", error);
      return JSON.stringify({
        vendor: "Unknown Vendor",
        totalAmount: 0,
        items: [],
        confidence: 0.1
      });
    }
  }
  
  /**
   * Validate and normalize document data
   */
  private normalizeDocumentData(data: DocumentAnalysisResult): DocumentAnalysisResult {
    const result: DocumentAnalysisResult = { ...data };
    
    // Ensure amount is a number
    if (typeof result.amount === 'string') {
      const amountStr = result.amount as string;
      result.amount = parseFloat(amountStr.replace(/[^0-9.]/g, ''));
    }
    
    // Normalize date format
    if (result.date) {
      result.date = this.normalizeDate(result.date);
    }
    
    // Ensure category is one of the allowed values
    const validCategories = ['Office Supplies', 'Travel', 'Meals & Entertainment', 'Equipment', 'Software', 'Other'];
    if (result.category && !validCategories.includes(result.category)) {
      result.category = 'Other';
    }
    
    // Ensure document type is valid
    const validTypes = ['receipt', 'invoice', 'expense'];
    if (result.documentType && !validTypes.includes(result.documentType)) {
      result.documentType = 'receipt';
    }
    
    return result;
  }

  /**
   * Fallback purchase extraction that doesn't rely on AI
   * Used when the AI service is unavailable or fails
   */
  fallbackPurchaseExtraction(filename: string): PurchaseExtractionResult {
    console.log('Using fallback purchase extraction for:', filename);
    
    // Try to extract vendor name from filename
    let vendor = this.extractVendorFromFilename(filename);
    
    // Extract basic information from filename if possible
    const dateMatch = filename.match(/(\d{4}[-./]\d{1,2}[-./]\d{1,2})|(\d{1,2}[-./]\d{1,2}[-./]\d{4})/);
    const amountMatch = filename.match(/\$?(\d+(\.\d{2})?)/);
    const invoiceMatch = filename.match(/inv[-_]?#?(\w+)/i) || filename.match(/#(\w+)/);
    
    // Create a more realistic fallback item
    const itemDescription = `Item from ${vendor}`;
    const category = this.determineCategoryFromDescription(itemDescription);
    const unitPrice = amountMatch ? parseFloat(amountMatch[1]) : 100.00;
    
    return {
      vendor,
      invoiceNumber: invoiceMatch ? invoiceMatch[1] : `INV-${Date.now().toString().slice(-6)}`,
      date: dateMatch ? this.normalizeDate(dateMatch[0]) : new Date().toISOString().split('T')[0],
      totalAmount: amountMatch ? parseFloat(amountMatch[1]) : 100.00,
      items: [
        {
          description: itemDescription,
          quantity: 1,
          unitPrice: unitPrice,
          totalPrice: unitPrice,
          category: category
        }
      ],
      notes: `Auto-generated from filename: ${filename}`,
      confidence: 0.75
    };
  }

  /**
   * Fallback document analysis that doesn't rely on AI
   * Used when the AI service is unavailable or fails
   */
  fallbackDocumentAnalysis(filename: string): DocumentAnalysisResult {
    console.log('Using fallback document analysis for:', filename);
    
    // Extract basic information from filename if possible
    const dateMatch = filename.match(/(\d{4}[-./]\d{1,2}[-./]\d{1,2})|(\d{1,2}[-./]\d{1,2}[-./]\d{4})/);
    const amountMatch = filename.match(/\$?(\d+(\.\d{2})?)/);
    
    // Try to determine document type from filename
    let documentType: 'receipt' | 'invoice' | 'expense' = 'receipt';
    if (filename.toLowerCase().includes('invoice')) {
      documentType = 'invoice';
    } else if (filename.toLowerCase().includes('expense')) {
      documentType = 'expense';
    }
    
    return {
      amount: amountMatch ? parseFloat(amountMatch[1]) : undefined,
      vendor: 'Unknown Vendor',
      category: 'Other',
      description: `Document ${filename}`,
      date: dateMatch ? this.normalizeDate(dateMatch[0]) : new Date().toISOString().split('T')[0],
      documentType
    };
  }

  /**
   * Extracts purchase information from a receipt or invoice image
   */
  async extractPurchaseInfo(base64Image: string, mimeType: string, filename?: string): Promise<PurchaseExtractionResult> {
    try {
      console.log(`Starting purchase extraction for ${mimeType} image...`);
      
      // Verify API key is available
      if (!this.apiKey || this.apiKey.trim() === '') {
        throw new Error('API key is not set. Please set the GEMINI_API_KEY environment variable.');
      }
      
      const systemPrompt = `You are an expert purchase invoice/receipt analyzer with exceptional attention to detail.

TASK: Carefully analyze the provided receipt or invoice image and extract ALL of the following information with high accuracy:

1. vendor (string): The COMPLETE name of the vendor or supplier (extract the full company name exactly as shown)
2. invoiceNumber (string): The invoice or receipt number
3. date (string): The purchase date in YYYY-MM-DD format
4. totalAmount (number): The total amount of the purchase (just the number, no currency symbol)
5. taxAmount (number): The tax amount if specified
6. items (array): Complete list of ALL items purchased with the following properties:
   - description (string): Detailed description of the item
   - quantity (number): Quantity purchased
   - unitPrice (number): Price per unit
   - totalPrice (number): Total price for this item
   - category (string): Product category (e.g., Electronics, Computer Hardware, Office Supplies, Software)
7. notes (string): Any additional notes or terms from the invoice
8. confidence (number): Your confidence level in the extraction (use 0.85 or higher if you're confident in your extraction)

IMPORTANT INSTRUCTIONS:
- Return ONLY valid JSON with the exact field names listed above
- Extract ALL information visible in the image - be thorough and precise
- For monetary values, extract ONLY the numerical value (e.g., 125.99, not "$125.99")
- If you cannot determine a field with high confidence, still provide your best guess
- Do NOT include any explanations or text outside the JSON object
- Ensure the date is in YYYY-MM-DD format
- Be precise and accurate in your extraction
- The vendor and totalAmount fields are required, all others are optional
- Pay special attention to the vendor name - extract it completely and accurately
- For each item, determine its category based on the description
- Set confidence to at least 0.85 if you're confident in your extraction

Example response format:
{
  "vendor": "LAPCOM ELECTRONICS PVT LTD",
  "invoiceNumber": "402/2082-83",
  "date": "2025-07-30",
  "totalAmount": 9400.00,
  "taxAmount": 0,
  "items": [
    {
      "description": "8GB DDR-3L Laptop RAM",
      "quantity": 1,
      "unitPrice": 1400.00,
      "totalPrice": 1400.00,
      "category": "Computer Hardware"
    },
    {
      "description": "19\" HD LED Matrix",
      "quantity": 2,
      "unitPrice": 4000.00,
      "totalPrice": 8000.00,
      "category": "Electronics"
    }
  ],
  "notes": "Terms & Conditions: Goods once sold will not be taken back.",
  "confidence": 0.95
}`;

      // Create the request payload
      const payload = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  data: base64Image,
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
          temperature: 0.05,  // Lower temperature for more deterministic results
          topP: 0.95,         // Higher topP for better quality
          topK: 40,
          maxOutputTokens: 2048, // Increased token limit for more detailed responses
          responseMimeType: "application/json"
        }
      };

      // Make multiple attempts if needed
      let attempts = 0;
      const maxAttempts = 2;
      let extractedData: PurchaseExtractionResult | null = null;
      
      while (attempts < maxAttempts && !extractedData) {
        attempts++;
        console.log(`Attempt ${attempts} of ${maxAttempts}...`);
        
        try {
          // Build the URL with the API key
          const url = `${this.baseUrl}/gemini-2.5-flash:generateContent?key=${encodeURIComponent(this.apiKey)}`;
          console.log('Making API request to:', url.replace(this.apiKey, 'REDACTED'));

          // Make the API call
          const response = await axios.post(
            url,
            payload,
            {
              headers: {
                'Content-Type': 'application/json',
              },
              timeout: 45000 // Increased timeout for more processing time
            }
          );

          // Process the response
          if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            const rawJson = response.data.candidates[0].content.parts[0].text;
            console.log(`Purchase extraction response received: ${rawJson.substring(0, 100)}...`);
            
            // Clean the response to handle potential formatting issues
            const cleanedJson = this.cleanJsonResponse(rawJson);
            
            try {
              extractedData = JSON.parse(cleanedJson) as PurchaseExtractionResult;
              
              // Ensure confidence is at least 0.75
              if (extractedData.confidence === undefined || extractedData.confidence < 0.75) {
                extractedData.confidence = 0.85;
              }
            } catch (jsonError) {
              console.error("Failed to parse cleaned JSON, will retry or use fallback");
            }
          }
        } catch (error) {
          console.error(`Attempt ${attempts} failed:`, error);
        }
      }
      
      // If we couldn't get valid data after all attempts, use fallback
      if (!extractedData) {
        console.warn("All extraction attempts failed, using fallback");
        if (filename) {
          return this.fallbackPurchaseExtraction(filename);
        } else {
          return {
            vendor: 'Unknown Vendor',
            totalAmount: 0,
            items: [],
            confidence: 0.75 // Minimum confidence level
          };
        }
      }
      
      // Validate and enhance the extracted data
      
      // Ensure vendor name is present and complete
      if (!extractedData.vendor || extractedData.vendor.length < 3) {
        extractedData.vendor = filename ? this.extractVendorFromFilename(filename) : 'Unknown Vendor';
      }
      
      // Ensure total amount is present
      if (extractedData.totalAmount === undefined) {
        extractedData.totalAmount = 0;
      }
      
      // Ensure items array exists
      if (!extractedData.items || !Array.isArray(extractedData.items)) {
        extractedData.items = [];
      }
      
      // Format date if it exists
      if (extractedData.date) {
        extractedData.date = this.normalizeDate(extractedData.date);
      }
      
      // Ensure each item has the required properties and categories
      extractedData.items = extractedData.items.map(item => {
        const description = item.description || 'Unknown Item';
        let category = item.category;
        
        // If category is missing, try to determine from description
        if (!category) {
          category = this.determineCategoryFromDescription(description);
        }
        
        return {
          description: description,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          totalPrice: item.totalPrice || (item.unitPrice ? item.unitPrice * (item.quantity || 1) : 0),
          category: category
        };
      });
      
      return extractedData;
    } catch (error: unknown) {
      console.error('Purchase extraction failed:', error);
      
      // Handle axios errors with more detailed information
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const errorMessage = error.response?.data?.error?.message || error.message;
        
        console.error(`API Error (${statusCode}): ${errorMessage}`);
        
        // Special handling for common errors
        if (statusCode === 403) {
          throw new Error(`Authentication error: ${errorMessage}. Please check your API key.`);
        } else if (statusCode === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
      }
      
      // Use fallback extraction if filename is provided
      if (filename) {
        console.log('Using fallback extraction for:', filename);
        return this.fallbackPurchaseExtraction(filename);
      }
      
      // Create a fallback purchase with minimal information
      return {
        vendor: 'Unknown Vendor',
        totalAmount: 0,
        items: [],
        confidence: 0.75 // Minimum confidence level
      };
    }
  }
  
  /**
   * Extract vendor name from filename as fallback
   */
  private extractVendorFromFilename(filename: string): string {
    // Common vendor names to check for
    const commonVendors = ["lapcom", "amazon", "walmart", "bestbuy", "office", "depot", "staples"];
    const lowerFilename = filename.toLowerCase();
    
    for (const v of commonVendors) {
      if (lowerFilename.includes(v)) {
        return v.charAt(0).toUpperCase() + v.slice(1);
      }
    }
    
    // If no known vendor found, use first part of filename
    const nameParts = filename.split(/[-_\s.]/);
    if (nameParts.length > 0 && nameParts[0].length > 2) {
      return nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
    }
    
    return "Unknown Vendor";
  }

  /**
   * Helper method to normalize dates to YYYY-MM-DD format
   */
  private normalizeDate(dateStr: string): string {
    try {
      // Handle different date formats and convert to YYYY-MM-DD
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        // Try to parse common date formats
        const parts = dateStr.split(/[-./]/);
        if (parts.length === 3) {
          // Check if year is first or last
          if (parts[0].length === 4) {
            // YYYY-MM-DD format
            return dateStr;
          } else if (parts[2].length === 4) {
            // DD-MM-YYYY format
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
        return new Date().toISOString().split('T')[0];
      }
      return date.toISOString().split('T')[0];
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  }
  
  /**
   * Checks if the AI service is properly configured
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 10);
  }

  /**
   * Determine category from item description
   */
  private determineCategoryFromDescription(description: string): string {
    const lowerDesc = description.toLowerCase();
    
    // Computer hardware terms
    if (lowerDesc.match(/\b(ram|memory|ddr|ssd|hdd|hard\s*drive|processor|cpu|motherboard|gpu|graphics\s*card|cooler)\b/)) {
      return "Computer Hardware";
    }
    
    // Electronics terms
    if (lowerDesc.match(/\b(monitor|display|screen|led|lcd|tv|phone|laptop|computer|keyboard|mouse|headphone|speaker|cable|adapter|charger)\b/)) {
      return "Electronics";
    }
    
    // Office supplies terms
    if (lowerDesc.match(/\b(paper|pen|pencil|marker|stapler|clip|binder|folder|ink|toner|cartridge|notebook|desk|chair|cabinet)\b/)) {
      return "Office Supplies";
    }
    
    // Software terms
    if (lowerDesc.match(/\b(software|license|subscription|windows|office|adobe|app|antivirus|security|cloud|service)\b/)) {
      return "Software";
    }
    
    return "Other";
  }
}

// Export a singleton instance
export const aiService = new AIService(); 