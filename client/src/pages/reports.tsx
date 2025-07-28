import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, BarChart3, TrendingUp, DollarSign, Package } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import RevenueChart from "@/components/charts/revenue-chart";
import type { Sale, Purchase, ProductWithDetails } from "@shared/schema";

export default function Reports() {
  const [reportType, setReportType] = useState("overview");
  const [timeRange, setTimeRange] = useState("6months");

  const { data: sales } = useQuery({
    queryKey: ["/api/sales"],
  });

  const { data: purchases } = useQuery({
    queryKey: ["/api/purchases"],
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: revenueData } = useQuery({
    queryKey: ["/api/dashboard/revenue-chart"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/revenue-chart?months=12");
      return response.json();
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Generate sales report data
  const salesReportData = sales ? sales.map((sale: Sale) => ({
    ...sale,
    customerName: sale.customerName,
    amount: parseFloat(sale.totalAmount),
    date: new Date(sale.createdAt!).toLocaleDateString()
  })) : [];

  // Generate purchases report data
  const purchasesReportData = purchases ? purchases.map((purchase: Purchase) => ({
    ...purchase,
    amount: parseFloat(purchase.totalAmount),
    date: new Date(purchase.createdAt!).toLocaleDateString()
  })) : [];

  // Generate inventory report data
  const inventoryReportData = products ? products.map((product: ProductWithDetails) => ({
    ...product,
    totalValue: parseFloat(product.unitPrice) * (product.quantity || 0),
    stockStatus: (product.quantity || 0) <= 0 ? 'Out of Stock' : 
                 (product.quantity || 0) <= (product.minStock || 0) ? 'Low Stock' : 'In Stock'
  })) : [];

  // Category distribution for pie chart
  const categoryData = products ? products.reduce((acc: any, product: ProductWithDetails) => {
    const category = product.category?.name || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = { name: category, value: 0, count: 0 };
    }
    acc[category].value += parseFloat(product.unitPrice) * (product.quantity || 0);
    acc[category].count += 1;
    return acc;
  }, {}) : {};

  const pieChartData = Object.values(categoryData);
  const COLORS = ['hsl(207, 90%, 54%)', 'hsl(142, 76%, 36%)', 'hsl(48, 96%, 53%)', 'hsl(271, 91%, 65%)', 'hsl(0, 84%, 60%)'];

  const handleExport = (type: string) => {
    // Create CSV data based on report type
    let csvData = '';
    let filename = '';

    switch (reportType) {
      case 'sales':
        csvData = 'Invoice Number,Customer,Amount,Status,Date\n';
        csvData += salesReportData.map(sale => 
          `${sale.invoiceNumber},"${sale.customerName}",${sale.amount},${sale.status},${sale.date}`
        ).join('\n');
        filename = 'sales_report.csv';
        break;
      
      case 'purchases':
        csvData = 'Purchase Number,Supplier,Amount,Status,Date\n';
        csvData += purchasesReportData.map(purchase => 
          `${purchase.purchaseNumber},"Supplier",${purchase.amount},${purchase.status},${purchase.date}`
        ).join('\n');
        filename = 'purchases_report.csv';
        break;
      
      case 'inventory':
        csvData = 'Product Name,SKU,Category,Quantity,Unit Price,Total Value,Status\n';
        csvData += inventoryReportData.map(product => 
          `"${product.name}",${product.sku || ''},"${product.category?.name || ''}",${product.quantity || 0},${product.unitPrice},${product.totalValue},${product.stockStatus}`
        ).join('\n');
        filename = 'inventory_report.csv';
        break;
      
      default:
        csvData = 'Report Type,Value\n';
        csvData += `Total Revenue,${dashboardStats?.totalRevenue || 0}\n`;
        csvData += `Total Expenses,${dashboardStats?.totalExpenses || 0}\n`;
        csvData += `Net Profit,${dashboardStats?.netProfit || 0}\n`;
        csvData += `Pending Invoices,${dashboardStats?.pendingInvoices || 0}\n`;
        filename = 'overview_report.csv';
    }

    // Download CSV
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header title="Reports" />
      
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {/* Report Controls */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex space-x-4">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="sales">Sales Report</SelectItem>
                <SelectItem value="purchases">Purchases Report</SelectItem>
                <SelectItem value="inventory">Inventory Report</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={() => handleExport('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Overview Report */}
        {reportType === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="text-green-600 w-5 h-5" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(dashboardStats?.totalRevenue || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="text-red-600 w-5 h-5" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(dashboardStats?.totalExpenses || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="text-blue-600 w-5 h-5" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Net Profit</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(dashboardStats?.netProfit || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Package className="text-yellow-600 w-5 h-5" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Products</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {products?.length || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart />
              
              <Card>
                <CardHeader>
                  <CardTitle>Inventory by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Sales Report */}
        {reportType === 'sales' && (
          <Card>
            <CardHeader>
              <CardTitle>Sales Report</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesReportData.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.invoiceNumber}</TableCell>
                      <TableCell>{sale.customerName}</TableCell>
                      <TableCell>{formatCurrency(sale.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={sale.status === 'paid' ? 'default' : 'secondary'}>
                          {sale.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{sale.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Purchases Report */}
        {reportType === 'purchases' && (
          <Card>
            <CardHeader>
              <CardTitle>Purchases Report</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purchase Number</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchasesReportData.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">{purchase.purchaseNumber}</TableCell>
                      <TableCell>{formatCurrency(purchase.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={purchase.status === 'received' ? 'default' : 'secondary'}>
                          {purchase.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{purchase.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Inventory Report */}
        {reportType === 'inventory' && (
          <Card>
            <CardHeader>
              <CardTitle>Inventory Report</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryReportData.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku || '-'}</TableCell>
                      <TableCell>{product.category?.name || '-'}</TableCell>
                      <TableCell>{product.quantity || 0}</TableCell>
                      <TableCell>{formatCurrency(parseFloat(product.unitPrice))}</TableCell>
                      <TableCell>{formatCurrency(product.totalValue)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          product.stockStatus === 'In Stock' ? 'default' : 
                          product.stockStatus === 'Low Stock' ? 'secondary' : 'destructive'
                        }>
                          {product.stockStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
