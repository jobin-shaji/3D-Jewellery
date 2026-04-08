const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: function () {
      return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  makingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  category_id: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  stock_quantity: {
    type: Number,
    default: 0,
    min: 0
  },
  is_active: {
    type: Boolean,
    default: true
  },
  is_deleted: {
    type: Boolean,
    default: false
  },
  deleted_at: {
    type: Date,
    default: null
  },
  deleted_by: {
    type: String,
    default: null
  },
  metals: [{
    type: {
      type: String, // e.g., "Gold", "Silver", "Platinum"
      required: true
    },
    purity: {
      type: String, // e.g., "18k", "14k", "925"
      required: true
    },
    weight: {
      type: Number, // in grams
      required: true,
      min: 0
    },
    color: {
      type: String, // e.g., "White", "Yellow", "Rose"
      default: ''
    }
  }],
  gemstones: [{
    type: {
      type: String, // e.g., "Diamond", "Ruby", "Emerald"
      required: true
    },
    carat: {
      type: Number, // carat weight
      required: true,
      min: 0
    },
    color: {
      type: String, // e.g., "D", "E", "F" for diamonds
      default: ''
    },
    clarity: {
      type: String, // e.g., "FL", "IF", "VVS1"
      default: ''
    },
    count: {
      type: Number, // number of stones of this type
      required: true,
      min: 1,
      default: 1
    },
    shape: {
      type: String, // e.g., "Round", "Oval", "Pear"
      default: ''
    },
    price: {
      type: Number, // price per carat or total price
      required: true,
      min: 0
    }
  }],
  variants: [{
    variant_id: {
      type: String,
      required: true,
      default: function () {
        return 'var_' + Date.now().toString() + Math.random().toString(36).substr(2, 9);
      }
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    stock_quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    making_price: {
      type: Number,
      required: true,
      min: 0
    },
    metal: [{
      type: {
        type: String, // e.g., "Gold", "Silver", "Platinum"
        required: true
      },
      purity: {
        type: String, // e.g., "18k", "14k", "925"
        required: true
      },
      weight: {
        type: Number, // in grams
        required: true,
        min: 0
      },
      color: {
        type: String, // e.g., "White", "Yellow", "Rose"
        default: ''
      }
    }],
    totalPrice: {
      type: Number,
      default: 0,
      min: 0
    },
    baseMaterialCost: {
      type: Number,
      default: null,
      min: 0
    }
  }],
  images: [{
    image_url: {
      type: String,
      required: true
    },
    alt_text: {
      type: String,
      default: ''
    },
    is_primary:{
      type: Boolean,
      default:false
    },
    sort_order: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  model_3d_url: {
    type: String,
    default: ''
  },
  certificates: {
    type: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      file_url: {
        type: String,
        required: true
      }
    }],
    default: []
  },
  reconstruction_job_id: {
    type: String,
    default: null
  },
  reconstruction_status: {
    type: String,
    enum: ['queued', 'processing', 'completed', 'failed', null],
    default: null
  },
  // Computed total price snapshot and last update timestamp
  totalPrice: {
    type: Number,
    default: null,
    min: 0
  },
  baseMaterialCost: {
    type: Number,
    default: null,
    min: 0
  },
  latestPriceUpdate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Add text index for search functionality
productSchema.index({
  name: 'text',
  description: 'text'
});

// Virtual for category population
productSchema.virtual('category', {
  ref: 'Category',
  localField: 'category_id',
  foreignField: 'id',
  justOne: true
});

// Virtual for images population - this allows easy access when needed
productSchema.virtual('productImages', {
  ref: 'ProductImage',
  localField: 'id',
  foreignField: 'product_id'
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);