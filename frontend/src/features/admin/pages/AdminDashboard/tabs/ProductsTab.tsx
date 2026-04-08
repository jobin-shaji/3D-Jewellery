import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Plus, Edit, Trash2, Eye, EyeOff, Package, Loader2 } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { useProductVisibility } from "@/shared/hooks/useProductVisibility";
import { useDeleteProduct } from "@/features/admin/hooks/useDeleteProduct";
import { Product } from "@/shared/types";
import { ReconstructionStatusBadge } from "./ReconstructionStatusBadge";

interface ProductsTabProps {
  products: Product[];
  loading: boolean;
  fetchProducts: () => void;
  refreshStats: () => void;
}

export const ProductsTab = ({ products, loading, fetchProducts, refreshStats}: ProductsTabProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { toggleProductVisibility, isProductLoading } = useProductVisibility();
  const { deleteProduct, deleteAttempts } = useDeleteProduct();

  // Refresh stats when products change (e.g., when returning from create/edit)
  useEffect(() => {
    if (!loading && products.length >= 0) {
      refreshStats();
    }
  }, [products.length, loading, refreshStats]);

  const handleToggleVisibility = async (productId: string, productName: string, currentStatus: boolean) => {
    const result = await toggleProductVisibility(productId, productName, currentStatus);
    if (result.success) {
      fetchProducts(); // Refresh the products list
      refreshStats(); // Refresh admin stats
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "out_of_stock": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getProductStatus = (product: Product) => {
    if (!product.is_active) return "inactive";
    if (product.stock_quantity === 0) return "out_of_stock";
    return "active";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">All Products</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/products")}>
            <Eye className="h-4 w-4 mr-2" />
            View Store
          </Button>
          <Button onClick={() => navigate("/admin/products/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Product
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Product Inventory ({products.length} items)</span>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading products...</span>
            </div>
          ) : products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow 
                    key={product.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0].image_url}
                            alt={product.images[0].alt_text || product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {product.category?.name || 'Uncategorized'}
                    </TableCell>
                    <TableCell>{formatPrice(product.makingPrice)}</TableCell>
                    <TableCell>
                      <span className={`${
                        product.stock_quantity === 0 
                          ? 'text-destructive' 
                          : product.stock_quantity < 10 
                          ? 'text-yellow-600' 
                          : 'text-green-600'
                      }`}>
                        {product.stock_quantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(getProductStatus(product))}>
                          {getProductStatus(product).replace('_', ' ')}
                        </Badge>
                        {product.reconstruction_job_id && !product.model_3d_url && (
                          <ReconstructionStatusBadge 
                            productId={product.id!} 
                            jobId={product.reconstruction_job_id} 
                            onSyncComplete={fetchProducts} 
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleToggleVisibility(product.id.toString(), product.name, product.is_active)}
                          title={product.is_active ? "Hide product from store" : "Show product in store"}
                          disabled={isProductLoading(product.id.toString())}
                          className={`${!product.is_active ? 'text-muted-foreground' : ''}`}
                        >
                          {isProductLoading(product.id.toString()) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : product.is_active ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                          title="Edit Product"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteProduct(product.id.toString(), product.name, () => {
                            fetchProducts();
                            refreshStats(); // Refresh stats after product deletion
                          })}
                          title={deleteAttempts[product.id] ? "Click again to confirm delete" : "Delete Product"}
                          className={`${deleteAttempts[product.id] ? 'bg-red-100 text-red-700' : 'text-destructive hover:text-destructive'}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first product.</p>
              <Button onClick={() => navigate("/admin/products/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Product
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
