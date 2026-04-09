import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Package, Users, ShoppingCart, Eye, RefreshCw, Loader2, Clock, CheckCircle, XCircle, IndianRupee } from "lucide-react";
import { StatsCard } from "../shared/StatsCard";
import { MetalPriceCard } from "../shared/MetalPriceCard";
import { type MetalPrice } from "@/shared/hooks/useMetalPrices";
import { type DashboardStats } from "@/features/admin/hooks/useAdminStats";

interface OverviewTabProps {
  stats: DashboardStats;
  metalPrices: MetalPrice[];
  metalPricesLoading: boolean;
  refreshPrices: () => void;
  loading: boolean;
}

export const OverviewTab = ({ stats, metalPrices, metalPricesLoading, refreshPrices, loading }: OverviewTabProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "placed": return "bg-blue-100 text-blue-800";
      case "shipped": return "bg-purple-100 text-purple-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }


   
  return ( 
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Products"
          value={stats.totalProducts}
          description="Products in catalog"
          icon={Package}
        />
        <StatsCard
          title="Active Products"
          value={stats.activeProducts}
          description="Available products"
          icon={Package}
        />
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          description="Registered users"
          icon={Users}
        />
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders}
          description="Orders processed"
          icon={ShoppingCart}
        />
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Pending Orders"
          value={stats.pendingOrders}
          description="Awaiting payment"
          icon={Clock}
        />
        <StatsCard
          title="Placed Orders"
          value={stats.placedOrders}
          description="Awaiting processing"
          icon={Package}
        />
        <StatsCard
          title="Completed Orders"
          value={stats.completedOrders}
          description="Successfully delivered"
          icon={CheckCircle}
        />
        <StatsCard
          title="Cancelled Orders"
          value={stats.cancelledOrders}
          description="Orders cancelled"
          icon={XCircle}
        />

      </div>

      {/* Metal Prices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Precious Metal Prices</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshPrices()}
              disabled={metalPricesLoading}
            >
              <RefreshCw className={`h-4 w-4 ${metalPricesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metalPricesLoading ? (
              <div className="flex items-center justify-center col-span-full p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>

            ) : (
              metalPrices.map((metalPrice) => (
                <MetalPriceCard 
                  key={`${metalPrice.type}-${metalPrice.purity}`} 
                  metal={metalPrice.name}
                  price={metalPrice.pricePerGram}
                  change={metalPrice.change}
                  changePercent={metalPrice.change}
                  currency="INR/g"
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No Recent orders found
                  </TableCell>
                </TableRow>
              ) : (
                stats.recentOrders.map((order) => (
                  <TableRow key={order.orderId}>
                    <TableCell className="font-medium">{order.orderId}</TableCell>
                    <TableCell>{order.shippingAddress.name}</TableCell>
                    <TableCell>{formatPrice(order.totalPrice)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};