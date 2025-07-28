import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Package, TrendingDown, TrendingUp, Warehouse } from "lucide-react";
import type { ProductWithDetails } from "@shared/schema";

export default function Inventory() {
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const getStockStatus = (quantity: number, minStock: number) => {
    if (quantity <= 0) {
      return { status: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    } else if (quantity <= minStock) {
      return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: TrendingDown };
    } else {
      return { status: 'In Stock', color: 'bg-green-100 text-green-800', icon: TrendingUp };
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount));
  };

  // Calculate inventory stats
  const inventoryStats = products ? {
    totalProducts: products.length,
    lowStock: products.filter((p: ProductWithDetails) => 
      (p.quantity || 0) <= (p.minStock || 0) && (p.quantity || 0) > 0
    ).length,
    outOfStock: products.filter((p: ProductWithDetails) => (p.quantity || 0) <= 0).length,
    totalValue: products.reduce((sum: number, p: ProductWithDetails) => 
      sum + (parseFloat(p.unitPrice) * (p.quantity || 0)), 0
    )
  } : null;

  return (
    <>
      <Header title="Inventory" />
      
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {/* Inventory Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="text-blue-600 w-5 h-5" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {inventoryStats?.totalProducts || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="text-yellow-600 w-5 h-5" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Low Stock</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {inventoryStats?.lowStock || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-red-600 w-5 h-5" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Out of Stock</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {inventoryStats?.outOfStock || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Warehouse className="text-green-600 w-5 h-5" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {inventoryStats ? formatCurrency(inventoryStats.totalValue.toString()) : '$0.00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-gray-600">Loading inventory...</p>
              </div>
            ) : products && products.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Min Stock</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product: ProductWithDetails) => {
                    const stockStatus = getStockStatus(product.quantity || 0, product.minStock || 0);
                    const StatusIcon = stockStatus.icon;
                    const totalValue = parseFloat(product.unitPrice) * (product.quantity || 0);
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sku || '-'}</TableCell>
                        <TableCell>{product.category?.name || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{product.quantity || 0}</span>
                            {(product.quantity || 0) <= (product.minStock || 0) && (
                              <StatusIcon className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.minStock || 0}</TableCell>
                        <TableCell>{formatCurrency(product.unitPrice)}</TableCell>
                        <TableCell>{formatCurrency(totalValue.toString())}</TableCell>
                        <TableCell>
                          <Badge className={stockStatus.color}>
                            {stockStatus.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Warehouse className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items</h3>
                <p className="text-gray-500">Add products to start tracking inventory</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        {inventoryStats && (inventoryStats.lowStock > 0 || inventoryStats.outOfStock > 0) && (
          <Card className="mt-6 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-800">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Inventory Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {inventoryStats.outOfStock > 0 && (
                  <p className="text-sm text-red-700">
                    <strong>{inventoryStats.outOfStock}</strong> product(s) are out of stock
                  </p>
                )}
                {inventoryStats.lowStock > 0 && (
                  <p className="text-sm text-yellow-700">
                    <strong>{inventoryStats.lowStock}</strong> product(s) are running low on stock
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
