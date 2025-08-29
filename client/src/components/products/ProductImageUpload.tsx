import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ProductImageUploadProps {
  onSuccess?: () => void;
}

export default function ProductImageUpload({ onSuccess }: ProductImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedProduct, setExtractedProduct] = useState<any>(null);
  const [similarProduct, setSimilarProduct] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Extract product info from image
  const extractMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/products/extract-from-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to extract product information');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setExtractedProduct(data.extractedProduct);
      setSimilarProduct(data.similarProduct);
      if (data.exists) {
        setShowConfirmDialog(true);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to extract product information",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });

  // Create or update product
  const saveMutation = useMutation({
    mutationFn: async (data: { productData: any, overwriteExisting: boolean, existingProductId?: string }) => {
      const response = await fetch('/api/products/create-from-extraction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save product');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Success",
        description: "Product saved successfully",
      });
      if (onSuccess) onSuccess();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save product",
        variant: "destructive",
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    
    extractMutation.mutate(formData);
  };

  const handleCreateProduct = (overwriteExisting: boolean = false) => {
    if (!extractedProduct) return;
    
    saveMutation.mutate({
      productData: extractedProduct,
      overwriteExisting,
      existingProductId: similarProduct?.id
    });
    
    setShowConfirmDialog(false);
  };

  const resetForm = () => {
    setFile(null);
    setExtractedProduct(null);
    setSimilarProduct(null);
    setShowConfirmDialog(false);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Upload Product Image</CardTitle>
          <CardDescription>
            Upload an image of a product to automatically extract its information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="picture">Product Image</Label>
              <Input
                id="picture"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUploading || !!extractedProduct}
              />
            </div>

            {extractedProduct && (
              <div className="grid gap-4 p-4 border rounded-md">
                <h3 className="text-lg font-medium">Extracted Product Information</h3>
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Name:</span>
                    <span>{extractedProduct.name}</span>
                  </div>
                  {extractedProduct.description && (
                    <div className="flex justify-between">
                      <span className="font-medium">Description:</span>
                      <span>{extractedProduct.description}</span>
                    </div>
                  )}
                  {extractedProduct.sku && (
                    <div className="flex justify-between">
                      <span className="font-medium">SKU:</span>
                      <span>{extractedProduct.sku}</span>
                    </div>
                  )}
                  {extractedProduct.category && (
                    <div className="flex justify-between">
                      <span className="font-medium">Category:</span>
                      <span>{extractedProduct.category}</span>
                    </div>
                  )}
                  {extractedProduct.unitPrice && (
                    <div className="flex justify-between">
                      <span className="font-medium">Price:</span>
                      <span>${extractedProduct.unitPrice}</span>
                    </div>
                  )}
                  {extractedProduct.quantity && (
                    <div className="flex justify-between">
                      <span className="font-medium">Quantity:</span>
                      <span>{extractedProduct.quantity}</span>
                    </div>
                  )}
                  {extractedProduct.supplier && (
                    <div className="flex justify-between">
                      <span className="font-medium">Supplier:</span>
                      <span>{extractedProduct.supplier}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium">Confidence:</span>
                    <span>{(extractedProduct.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={resetForm}>
            Reset
          </Button>
          {!extractedProduct ? (
            <Button onClick={handleUpload} disabled={!file || isUploading}>
              {isUploading ? <><Spinner className="mr-2" /> Analyzing...</> : "Upload & Analyze"}
            </Button>
          ) : (
            <Button onClick={() => handleCreateProduct(false)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <><Spinner className="mr-2" /> Saving...</> : "Save as New Product"}
            </Button>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Similar Product Found</AlertDialogTitle>
            <AlertDialogDescription>
              A similar product "{similarProduct?.name}" already exists in the system.
              Would you like to update the existing product or create a new one?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleCreateProduct(true)}>
              Update Existing
            </AlertDialogAction>
            <AlertDialogAction onClick={() => handleCreateProduct(false)}>
              Create New
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 