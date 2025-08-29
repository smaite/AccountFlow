import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

interface PurchaseItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface PurchaseData {
  vendor: string;
  invoiceNumber?: string;
  date?: string;
  totalAmount: number;
  taxAmount?: number;
  items: PurchaseItem[];
  notes?: string;
  confidence: number;
}

interface PurchaseImageUploadProps {
  onSuccess?: () => void;
}

export default function PurchaseImageUpload({ onSuccess }: PurchaseImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedPurchase, setExtractedPurchase] = useState<PurchaseData | null>(null);
  const [similarSupplier, setSimilarSupplier] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [createNewSupplier, setCreateNewSupplier] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Extract purchase info from image
  const extractMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/purchases/extract-from-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to extract purchase information');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setExtractedPurchase(data.extractedPurchase);
      setSimilarSupplier(data.similarSupplier);
      if (data.supplierExists) {
        setShowConfirmDialog(true);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to extract purchase information",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  // Create purchase
  const saveMutation = useMutation({
    mutationFn: async (data: { purchaseData: PurchaseData, createNewSupplier: boolean }) => {
      const response = await fetch('/api/purchases/create-from-extraction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create purchase');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      let message = "Purchase created successfully";
      if (data.newProducts > 0 || data.updatedProducts > 0) {
        message += `. ${data.newProducts} new products created and ${data.updatedProducts} existing products updated.`;
      }
      
      toast({
        title: "Success",
        description: message,
      });
      
      if (onSuccess) onSuccess();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create purchase",
        variant: "destructive",
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create a preview URL for the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      
      // Reset previous extraction
      setExtractedPurchase(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    
    extractMutation.mutate(formData);
  };

  const handleCreatePurchase = (useExistingSupplier: boolean = true) => {
    if (!extractedPurchase) return;
    
    setShowConfirmDialog(false);
    setCreateNewSupplier(!useExistingSupplier);
    
    saveMutation.mutate({
      purchaseData: extractedPurchase,
      createNewSupplier: !useExistingSupplier
    });
  };

  const resetForm = () => {
    setFile(null);
    setImagePreview(null);
    setExtractedPurchase(null);
    setSimilarSupplier(null);
    setShowConfirmDialog(false);
    setCreateNewSupplier(false);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Upload Purchase Invoice/Receipt</CardTitle>
          <CardDescription>
            Upload an image of a purchase invoice or receipt to automatically extract its information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image">Invoice/Receipt Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploading || !!extractedPurchase}
                />
              </div>
              
              {imagePreview && (
                <div className="relative aspect-video rounded-md overflow-hidden border">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="object-contain w-full h-full"
                  />
                </div>
              )}
            </div>
            
            {extractedPurchase && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Vendor:</span>
                    <span>{extractedPurchase.vendor}</span>
                  </div>
                  {extractedPurchase.invoiceNumber && (
                    <div className="flex justify-between">
                      <span className="font-medium">Invoice Number:</span>
                      <span>{extractedPurchase.invoiceNumber}</span>
                    </div>
                  )}
                  {extractedPurchase.date && (
                    <div className="flex justify-between">
                      <span className="font-medium">Date:</span>
                      <span>{extractedPurchase.date}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium">Total Amount:</span>
                    <span>{formatCurrency(extractedPurchase.totalAmount)}</span>
                  </div>
                  {extractedPurchase.taxAmount !== undefined && (
                    <div className="flex justify-between">
                      <span className="font-medium">Tax Amount:</span>
                      <span>{formatCurrency(extractedPurchase.taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium">Confidence:</span>
                    <span>{(extractedPurchase.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
                
                {extractedPurchase.items && extractedPurchase.items.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Items</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {extractedPurchase.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.totalPrice)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                {extractedPurchase.notes && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Notes</h4>
                    <p className="text-sm text-gray-600">{extractedPurchase.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={resetForm} disabled={isUploading}>
            Reset
          </Button>
          {!extractedPurchase ? (
            <Button onClick={handleUpload} disabled={!file || isUploading}>
              {isUploading ? <><Spinner className="mr-2" /> Analyzing...</> : "Upload & Analyze"}
            </Button>
          ) : (
            <Button onClick={() => handleCreatePurchase(true)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <><Spinner className="mr-2" /> Creating...</> : "Create Purchase"}
            </Button>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supplier Already Exists</AlertDialogTitle>
            <AlertDialogDescription>
              A supplier named "{similarSupplier?.name}" already exists in the system.
              Would you like to use this existing supplier or create a new one?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleCreatePurchase(true)}>
              Use Existing Supplier
            </AlertDialogAction>
            <AlertDialogAction onClick={() => handleCreatePurchase(false)}>
              Create New Supplier
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 