import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { StatsCard } from "@/features/admin/pages/AdminDashboard/shared/StatsCard";
import { Badge } from "@/shared/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select";
import {
    IndianRupee,
    ShoppingCart,
    BarChart3,
    TrendingUp,
    Package,
    AlertTriangle,
    RotateCcw,
    Download,
    Calendar,
    FileText,
    TrendingDown,
    Database,
    RefreshCw,
    AlertCircle
} from "lucide-react";
import { useAnalytics, Period, Interval } from "@/features/admin/hooks/useAnalytics";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartConfig
} from "@/shared/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useExports } from '@/features/admin/hooks/useExports';

// Map UI timeframe values to API period values
const timeFrameToPeriod = (timeframe: string): Period => {
    switch (timeframe) {
        case '7days': return '7d';
        case '30days': return '30d';
        case '90days': return '90d';
        case '3months': return '90d';
        case '6months': return '90d';
        case '1year': return '1y';
        default: return '30d';
    }
};

// Get appropriate interval label for formatting (backend determines actual interval)
const getIntervalType = (timeframe: string): Interval => {
    switch (timeframe) {
        case '7days':
        case '30days':
            return 'day';
        case '90days':
        case '3months':
        case '6months':
            return 'week';
        case '1year':
            return 'month';
        default:
            return 'day';
    }
};

// Format label based on date string
const formatChartLabel = (dateStr: string, interval: Interval): string => {
    if (interval === 'day') {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (interval === 'week') {
        return dateStr; // Week format from backend
    } else {
        const date = new Date(dateStr + '-01');
        return date.toLocaleDateString('en-US', { month: 'short' });
    }
};

export const NewAnalyticsTab = () => {
    const [salesTimeFrame, setSalesTimeFrame] = useState("30days");
    const [userGrowthTimeFrame, setUserGrowthTimeFrame] = useState("30days");
    const [bestSellersTimeFrame, setBestSellersTimeFrame] = useState("30days");

    const salesPeriod = timeFrameToPeriod(salesTimeFrame);
    const userPeriod = timeFrameToPeriod(userGrowthTimeFrame);
    const bestSellersPeriod = timeFrameToPeriod(bestSellersTimeFrame);
    
    // For label formatting only (backend auto-determines actual interval)
    const salesIntervalType = getIntervalType(salesTimeFrame);
    const userIntervalType = getIntervalType(userGrowthTimeFrame);

    const {
        overview,
        salesTrends,
        userGrowth,
        inventory,
        bestSellers,
        loading,
        error,
        refetch
    } = useAnalytics({
        salesPeriod,
        userPeriod,
        bestSellersPeriod,
    });

    const { exportOrdersCsv, exportRevenueCsv, exportTaxReport } = useExports();

    // Chart configurations
    const salesChartConfig = {
        revenue: {
            label: "Revenue",
            color: "hsl(var(--primary))",
        },
        orders: {
            label: "Orders",
            color: "hsl(var(--muted-foreground))",
        },
    } satisfies ChartConfig;

    const userChartConfig = {
        newUsers: {
            label: "New Users",
            color: "hsl(142, 76%, 36%)", // green-500
        },
    } satisfies ChartConfig;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(price);
    };

    const handleDownloadReport = (type: string) => {
        console.log(`Downloading ${type} report...`);
        if (type === 'orders-csv') {
            exportOrdersCsv();
            return;
        }
        if (type === 'revenue-csv') {
            exportRevenueCsv();
            return;
        }
        if (type === 'tax-report') {
            exportTaxReport();
            return;
        }
        // TODO: Implement actual download logic
    };

    // Loading State
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center space-y-4">
                        <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
                        <p className="text-lg font-medium text-gray-600">Loading analytics data...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="space-y-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Analytics</AlertTitle>
                    <AlertDescription className="mt-2">
                        {error}
                    </AlertDescription>
                </Alert>
                <div className="flex justify-center">
                    <Button onClick={refetch} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    // No data state
    if (!overview || !inventory) {
        return (
            <div className="space-y-6">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Data Available</AlertTitle>
                    <AlertDescription>
                        No analytics data available at the moment. Please check back later.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Calculate derived data
    const totalRevenue = overview.revenue.total;
    const totalProfit = overview.profit?.total || 0;
    const profitChange = overview.profit?.change || 0;
    const totalOrders = overview.orders.total;
    const averageOrderValue = overview.revenue.avgOrderValue;
    const revenueChange = overview.revenue.change;

    return (
        <div className="space-y-6">
            {/* Header with Date Range Selector and Download Options */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
                    <Button
                        onClick={refetch}
                        variant="ghost"
                        size="sm"
                        title="Refresh data"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                                       {/* Download Reports Dropdown */}
                    <Button variant="outline" size="sm" onClick={() => handleDownloadReport('revenue-csv')}>
                        <Download className="h-4 w-4 mr-2" />
                        Revenue Report (CSV)
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadReport('orders-csv')}>
                        <Download className="h-4 w-4 mr-2" />
                        Orders Export (CSV)
                    </Button>
                    {/* <Button variant="outline" size="sm" onClick={() => handleDownloadReport('sales-pdf')}>
                        <Download className="h-4 w-4 mr-2" />
                        Sales Report (PDF)
                    </Button> */}
                    <Button variant="outline" size="sm" onClick={() => handleDownloadReport('tax-report')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Tax Report (CSV)
                    </Button>
                </div>
            </div>

            {/* Key Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatsCard
                    title="Total Revenue"
                    value={formatPrice(totalRevenue)}
                    icon={IndianRupee}
                    description={`${revenueChange >= 0 ? '↑' : '↓'} ${Math.abs(revenueChange).toFixed(1)}% from previous period`}
                />
                <StatsCard
                    title="Gross Profit"
                    value={formatPrice(totalProfit)}
                    icon={TrendingUp}
                    description={`${profitChange >= 0 ? '↑' : '↓'} ${Math.abs(profitChange).toFixed(1)}% from previous period`}
                />
                <StatsCard
                    title="Total Orders"
                    value={totalOrders.toLocaleString()}
                    icon={ShoppingCart}
                    description="Orders processed"
                />
                <StatsCard
                    title="Average Order Value"
                    value={formatPrice(averageOrderValue)}
                    icon={BarChart3}
                    description="Per transaction"
                />
                <StatsCard
                    title="New Users"
                    value={overview.users.newUsers.toLocaleString()}
                    icon={TrendingUp}
                    description={`${overview.users.growth >= 0 ? '↑' : '↓'} ${Math.abs(overview.users.growth).toFixed(1)}% growth`}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Trends Chart */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Sales Trends
                            </CardTitle>
                            <Select value={salesTimeFrame} onValueChange={setSalesTimeFrame}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7days">Last 7 Days</SelectItem>
                                    <SelectItem value="30days">Last 30 Days</SelectItem>
                                    <SelectItem value="90days">Last 90 Days</SelectItem>
                                    <SelectItem value="1year">Last Year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {salesTrends.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-gray-500">
                                <p>No sales data available for this period</p>
                            </div>
                        ) : (
                            <ChartContainer config={salesChartConfig} className="h-64 w-full">
                                <BarChart
                                    data={salesTrends.map(item => ({
                                        ...item,
                                        date: formatChartLabel(item.date, salesIntervalType),
                                    }))}
                                    margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        className="text-xs"
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        className="text-xs"
                                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                                    />
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                formatter={(value, name) => {
                                                    if (name === "revenue") {
                                                        return [formatPrice(value as number), "Revenue"];
                                                    }
                                                    return [value, name];
                                                }}
                                            />
                                        }
                                    />
                                    <Bar
                                        dataKey="revenue"
                                        fill="var(--color-revenue)"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                {/* User Growth Chart */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                User Growth
                            </CardTitle>
                            <Select value={userGrowthTimeFrame} onValueChange={setUserGrowthTimeFrame}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7days">Last 7 Days</SelectItem>
                                    <SelectItem value="30days">Last 30 Days</SelectItem>
                                    <SelectItem value="3months">Last 3 Months</SelectItem>
                                    <SelectItem value="6months">Last 6 Months</SelectItem>
                                    <SelectItem value="1year">Last Year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {userGrowth.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-gray-500">
                                <p>No user growth data available for this period</p>
                            </div>
                        ) : (
                            <ChartContainer config={userChartConfig} className="h-64 w-full">
                                <BarChart
                                    data={userGrowth.map(item => ({
                                        ...item,
                                        date: formatChartLabel(item.date, userIntervalType),
                                    }))}
                                    margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        className="text-xs"
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        className="text-xs"
                                    />
                                    <ChartTooltip
                                        content={
                                            <ChartTooltipContent
                                                formatter={(value, name) => {
                                                    if (name === "newUsers") {
                                                        return [value, "New Users"];
                                                    }
                                                    return [value, name];
                                                }}
                                            />
                                        }
                                    />
                                    <Bar
                                        dataKey="newUsers"
                                        fill="var(--color-newUsers)"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Inventory Status & Best Selling Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Inventory Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Inventory Status
                            </span>
                            <div className="flex gap-2">
                                {inventory.outOfStock > 0 && (
                                    <Badge variant="destructive" className="flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        {inventory.outOfStock} Out of Stock
                                    </Badge>
                                )}
                                {inventory.lowStock > 0 && (
                                    <Badge variant="outline" className="flex items-center gap-1 bg-orange-50 text-orange-700 border-orange-300">
                                        <AlertTriangle className="h-3 w-3" />
                                        {inventory.lowStock} Low Stock
                                    </Badge>
                                )}
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm text-gray-600">Total Products</p>
                                    <p className="text-2xl font-bold">{inventory.total}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">In Stock</p>
                                    <p className="text-2xl font-bold text-green-600">{inventory.inStock}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Low Stock</p>
                                    <p className="text-2xl font-bold text-orange-600">{inventory.lowStock}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Out of Stock</p>
                                    <p className="text-2xl font-bold text-red-600">{inventory.outOfStock}</p>
                                </div>
                            </div>

                            {/* Inventory Value */}
                            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                                <p className="text-sm text-gray-600 mb-1">Total Inventory Value</p>
                                <p className="text-2xl font-bold text-primary">{formatPrice(inventory.totalValue)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Best Selling Products */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Best Selling Products
                            </CardTitle>
                            <Select value={bestSellersTimeFrame} onValueChange={setBestSellersTimeFrame}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7days">Last 7 Days</SelectItem>
                                    <SelectItem value="30days">Last 30 Days</SelectItem>
                                    <SelectItem value="90days">Last 90 Days</SelectItem>
                                    <SelectItem value="1year">Last Year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {bestSellers.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-gray-500">
                                <p>No sales data available for this period</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {bestSellers.map((product, index) => (
                                    <div key={product.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex-shrink-0">
                                                {index + 1}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-sm truncate">{product.name}</p>
                                                <p className="text-xs text-gray-500">{product.sold} sales</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-2">
                                            <p className="font-semibold text-sm whitespace-nowrap">{formatPrice(product.revenue)}</p>
                                            <div className="flex items-center gap-1 justify-end">
                                                <TrendingUp className="h-3 w-3 text-green-600" />
                                                <span className="text-xs text-green-600">↑</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions / Additional Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            className="justify-start h-auto py-4"
                            onClick={() => handleDownloadReport('full-report')}
                            disabled
                        >
                            <div className="flex items-center gap-3">
                                <Download className="h-5 w-5 text-primary" />
                                <div className="text-left">
                                    <p className="font-semibold">Export Full Report</p>
                                    <p className="text-xs text-gray-500">Download comprehensive analytics (Coming soon)</p>
                                </div>
                            </div>
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-start h-auto py-4"
                            onClick={() => handleDownloadReport('raw-data')}
                            disabled
                        >
                            <div className="flex items-center gap-3">
                                <Database className="h-5 w-5 text-primary" />
                                <div className="text-left">
                                    <p className="font-semibold">Export Raw Data</p>
                                    <p className="text-xs text-gray-500">Download raw data in CSV/Excel (Coming soon)</p>
                                </div>
                            </div>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
