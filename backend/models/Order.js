import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  awbNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  merchantId: {
    type: String,
    required: true,
    index: true
  },
  courierPartner: {
    type: String,
    required: true,
    enum: ['shiprocket', 'delhivery', 'bluedart', 'dtdc', 'kwikship']
  },
  orderStatus: {
    type: String,
    required: true,
    enum: ['DELIVERED', 'RTO', 'IN_TRANSIT', 'LOST']
  },
  codAmount: {
    type: Number,
    required: true,
    min: 0
  },
  declaredWeight: {
    type: Number,
    required: true,
    min: 0
  },
  orderDate: {
    type: Date,
    required: true
  },
  deliveryDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for reconciliation queries
orderSchema.index({ awbNumber: 1, merchantId: 1 });
orderSchema.index({ deliveryDate: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
