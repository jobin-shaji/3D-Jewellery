const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-6);
      return `ORD-${year}-${timestamp}`;
    }
  },
  userId: { type: String, required: true },
  shippingAddress: {
    name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String }
  },
  items: [
    {
      // Full product snapshot at time of order
      product: {
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String, required: true },
        category_id: { type: Number, required: true },
        makingPrice: { type: Number, required: true },
        metals: [
          {
            type: { type: String, required: true },
            purity: { type: String, required: true },
            weight: { type: Number, required: true, min: 0 },
            color: { type: String, default: '' }
          }
        ],
        gemstones: [
          {
            type: { type: String, required: true },
            carat: { type: Number, required: true, min: 0 },
            color: { type: String, default: '' },
            clarity: { type: String, default: '' },
            count: { type: Number, required: true, min: 1, default: 1 },
            shape: { type: String, default: '' },
            price: { type: Number, required: true, min: 0 }
          }
        ],
        images: [
          {
            image_url: { type: String, required: true },
            alt_text: { type: String, default: '' },
            is_primary: { type: Boolean, default: false },
            sort_order: { type: Number, required: true, min: 0 }
          }
        ],
        model_3d_url: { type: String, default: '' },
        certificates: [
          {
            name: { type: String, required: true, trim: true },
            file_url: { type: String, required: true }
          }
        ],
        totalPrice: { type: Number, default: null, min: 0 },
        baseMaterialCost: { type: Number, default: null, min: 0 }
      },
      // Full variant snapshot at time of order
      variant: {
        variant_id: { type: String },
        name: { type: String, trim: true },
        making_price: { type: Number, min: 0 },
        metal: [
          {
            type: { type: String },
            purity: { type: String },
            weight: { type: Number, min: 0 },
            color: { type: String, default: '' }
          }
        ],
        totalPrice: { type: Number, default: 0, min: 0 },
        baseMaterialCost: { type: Number, default: null, min: 0 }
      },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }
    }
  ],
  subtotal: { type: Number, required: true, min: 0 },
  tax: { type: Number, required: true, min: 0, default: 0 },
  shippingFee: { type: Number, required: true, min: 0, default: 0 },
  totalPrice: { type: Number, required: true },
  payment: {
    method: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'razorpay', 'bank_transfer'],
      required: true
    },
    transactionId: { type: String },
    paymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending'
    },
    paidAt: { type: Date },
    refundAmount: { type: Number, default: 0, min: 0 }
  },
  status: {
    type: String,
    enum: ['pending', 'placed', 'shipped', 'completed', 'cancelled'],
    default: 'placed'
  },
  orderHistory: [{
    status: { type: String, required: true, enum: ['pending', 'placed', 'shipped', 'completed', 'cancelled'] },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: String }, // admin user ID or system
    notes: { type: String, maxlength: 500 }
  }],
  notes: {
    customerNotes: { type: String, maxlength: 500 },
    adminNotes: { type: String, maxlength: 1000 },
    specialInstructions: { type: String, maxlength: 300 }
  },
  invoiceUrl: { type: String, default: null } // Cloudinary URL for cached invoice PDF
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);