import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { CheckCircle, Package, Truck, CreditCard, MapPin, ArrowLeft, Download } from "lucide-react";
import { useOrders } from "../hooks/useOrders";
import { useInvoiceDownload } from "../hooks/useInvoiceDownload";

const OrderConfirmation = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { fetchOrderById, currentOrder, loading, error } = useOrders();
  const { downloadInvoice, isDownloading } = useInvoiceDownload();
  const [estimatedDelivery, setEstimatedDelivery] = useState<Date>();
  const location = useLocation();

  useEffect(() => {
    if (orderId) {
      fetchOrderById(orderId);
      // Calculate estimated delivery (7 days from now)
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 7);
      setEstimatedDelivery(deliveryDate);
    }
  }, [orderId, fetchOrderById]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading order details....</p>
        </div>
      </div>
    );
  }

  if (error || !currentOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || "We couldn't find the order you're looking for."}
          </p>
          <Button onClick={() => navigate("/orders")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'placed': return <CheckCircle className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* Success Header - Show only if coming from checkout route */}
        {location.pathname.startsWith("/order-confirmation/") && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Order Confirmed!
            </h1>
            <p className="text-lg text-gray-600">
              Thank you for your purchase. Your order has been successfully placed.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Order Details</span>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(currentOrder.status)}>
                      {getStatusIcon(currentOrder.status)}
                      <span className="ml-1 capitalize">{currentOrder.status}</span>
                    </Badge>
                    {/* Cancel Order Button in top right corner */}
                    {currentOrder.status !== 'cancelled' && currentOrder.status !== 'delivered' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700" 
                        onClick={() => {
                          // You may want to call a cancelOrder function here
                          alert('Order cancellation feature coming soon!');
                        }}
                      >
                        Cancel Order
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="font-semibold">{currentOrder.orderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p className="font-semibold">
                      {new Date(currentOrder.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                    <p className="font-semibold">
                      {estimatedDelivery?.toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <Badge className="bg-green-100 text-green-800">
                      <CreditCard className="h-3 w-3 mr-1" />
                      {currentOrder.payment.paymentStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 py-4 border-b last:border-b-0">
                      {item.product.images && item.product.images.length > 0 && (
                        <img
                          src={item.product.images[0].image_url}
                          alt={item.product.images[0].alt_text || item.product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.product.name}</h4>
                        {item.variant && (
                          <p className="text-sm text-muted-foreground">
                            Variant: {item.variant.name}
                          </p>
                        )}
                        <p className="text-sm">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="font-semibold">
                      {currentOrder.payment.method === 'razorpay' ? 'Razorpay (Online Payment)' : 
                       currentOrder.payment.method === 'credit_card' ? 'Credit Card' :
                       currentOrder.payment.method === 'debit_card' ? 'Debit Card' :
                       currentOrder.payment.method === 'bank_transfer' ? 'Bank Transfer' :
                       currentOrder.payment.method.charAt(0).toUpperCase() + currentOrder.payment.method.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <Badge className={`${
                      currentOrder.payment.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                      currentOrder.payment.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      currentOrder.payment.paymentStatus === 'processing' ? 'bg-blue-100 text-blue-800' :
                      currentOrder.payment.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      <CreditCard className="h-3 w-3 mr-1" />
                      {currentOrder.payment.paymentStatus.charAt(0).toUpperCase() + currentOrder.payment.paymentStatus.slice(1)}
                    </Badge>
                  </div>
                  {currentOrder.payment.transactionId && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Transaction ID</p>
                      <p className="font-mono text-sm break-all">{currentOrder.payment.transactionId}</p>
                    </div>
                  )}
                  {currentOrder.payment.paidAt && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Payment Date</p>
                      <p className="text-sm">
                        {new Date(currentOrder.payment.paidAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-semibold">{currentOrder.shippingAddress.name}</p>
                  <p>{currentOrder.shippingAddress.street}</p>
                  <p>
                    {currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.state}, {currentOrder.shippingAddress.postalCode}
                  </p>
                  <p>{currentOrder.shippingAddress.country}</p>
                  {currentOrder.shippingAddress.phone && (
                    <p>Phone: {currentOrder.shippingAddress.phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{currentOrder.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (3%)</span>
                  <span>₹{currentOrder.tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>₹{currentOrder.shippingFee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{currentOrder.totalPrice.toLocaleString('en-IN')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                className="w-full" 
                onClick={() => downloadInvoice(currentOrder.orderId)}
                disabled={isDownloading || currentOrder.payment.paymentStatus === 'pending' || currentOrder.payment.paymentStatus === 'failed'}
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? 'Downloading Invoice...' : 'Download Invoice'}
              </Button>
              {(currentOrder.payment.paymentStatus === 'pending' || currentOrder.payment.paymentStatus === 'failed') && (
                <p className="text-xs text-muted-foreground text-center">
                  Invoice is available only for paid orders
                </p>
              )}

              <Button variant="outline" className="w-full" asChild>
                <Link to="/orders">
                  All Orders
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/products">
                  Continue Shopping
                </Link>
              </Button>
            </div>

            {/* Customer Notes */}
            {currentOrder.notes.customerNotes && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{currentOrder.notes.customerNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderConfirmation;