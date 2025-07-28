import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Eye, CheckCircle, Clock, X, Package } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertPurchaseSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import type { Purchase, Product, Supplier } from "@shared/schema";

const purchaseFormSchema = insertPurchaseSchema.extend({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    totalPrice: z.number().min(0)
  })).min(1, "At least one item is required")
});

type PurchaseFormData = z.infer<typeof purchaseFormSchema>;

export default function Purchases() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [purchaseItems, setPurchaseItems] = useState([{ productId: "", quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: purchases, isLoading: purchasesLoading } = useQuery({
    queryKey: ["/api/purchases"],
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: suppliers } = useQuery({
    queryKey: ["/api/suppliers"],
  });

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      purchaseNumber: `PO-${Date.now()}`,
      supplierId: "",
      totalAmount: "0",
      taxAmount: "0",
      status: "pending",
      items: []
    }
  });

  const createPurchaseMutation = useMutation({
    mutationFn: async (data: PurchaseFormData) => {
      const response = await apiRequest('POST', '/api/purchases', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] });
      setDialogOpen(false);
      form.reset();
      setPurchaseItems([{ productId: "", quantity: 1, unitPrice: 0, totalPrice: 0 }]);
      toast({
        title: "Purchase created",
        description: "Purchase order has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create purchase",
        variant: "destructive",
      });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PATCH', `/api/purchases/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/purchases'] });
      toast({
        title: "Status updated",
        description: "Purchase status has been updated",
      });
    }
  });

  const handleProductChange = (index: number, productId: string) => {
    const product = products?.find((p: Product) => p.id === productId);
    if (product) {
      const newItems = [...purchaseItems];
      newItems[index] = {
        ...newItems[index],
        productId,
        unitPrice: parseFloat(product.unitPrice),
        totalPrice: newItems[index].quantity * parseFloat(product.unitPrice)
      };
      setPurchaseItems(newItems);
      updateTotalAmount(newItems);
    }
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...purchaseItems];
    newItems[index] = {
      ...newItems[index],
      quantity,
      totalPrice: quantity * newItems[index].unitPrice
    };
    setPurchaseItems(newItems);
    updateTotalAmount(newItems);
  };

  const updateTotalAmount = (items: typeof purchaseItems) => {
    const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
    form.setValue('totalAmount', total.toString());
  };

  const addItem = () => {
    setPurchaseItems([...purchaseItems, { productId: "", quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (purchaseItems.length > 1) {
      const newItems = purchaseItems.filter((_, i) => i !== index);
      setPurchaseItems(newItems);
      updateTotalAmount(newItems);
    }
  };

  const onSubmit = (data: PurchaseFormData) => {
    const validItems = purchaseItems.filter(item => item.productId && item.quantity > 0);
    createPurchaseMutation.mutate({
      ...data,
      items: validItems
    });
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Header title="Purchases" />
      
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Purchase Management</h2>
            <p className="text-sm text-gray-600">Create and manage purchase orders and supplier invoices</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Purchase
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Purchase Order</DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="purchaseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="received">Received</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select supplier" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {suppliers?.map((supplier: Supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Purchase Items */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <Label>Purchase Items</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addItem}>
                        <Plus className="w-4 h-4 mr-1" />
                        Add Item
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {purchaseItems.map((item, index) => (
                        <div key={index} className="grid grid-cols-5 gap-3 items-end p-3 border rounded">
                          <div>
                            <Label>Product</Label>
                            <Select 
                              value={item.productId} 
                              onValueChange={(value) => handleProductChange(index, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {products?.map((product: Product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                            />
                          </div>
                          
                          <div>
                            <Label>Unit Price</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => {
                                const newItems = [...purchaseItems];
                                newItems[index].unitPrice = parseFloat(e.target.value) || 0;
                                newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
                                setPurchaseItems(newItems);
                                updateTotalAmount(newItems);
                              }}
                            />
                          </div>
                          
                          <div>
                            <Label>Total</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.totalPrice}
                              readOnly
                            />
                          </div>
                          
                          <div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(index)}
                              disabled={purchaseItems.length === 1}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="taxAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Amount</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="totalAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Amount</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} readOnly />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createPurchaseMutation.isPending}>
                      {createPurchaseMutation.isPending ? "Creating..." : "Create Purchase"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {purchasesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-gray-600">Loading purchases...</p>
              </div>
            ) : purchases && purchases.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purchase Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase: Purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">{purchase.purchaseNumber}</TableCell>
                      <TableCell>
                        {suppliers?.find((s: Supplier) => s.id === purchase.supplierId)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{formatCurrency(purchase.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(purchase.status || 'pending')}>
                          {purchase.status || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(purchase.createdAt!).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {purchase.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatusMutation.mutate({ id: purchase.id, status: 'received' })}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Received
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No purchases yet</h3>
                <p className="text-gray-500 mb-6">Create your first purchase order to get started</p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Purchase
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
