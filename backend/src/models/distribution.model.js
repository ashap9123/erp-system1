const mongoose = require('mongoose');

const DistributionSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  recipientType: { type: String, enum: ['staff', 'shareholder'], required: true },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientType'
  },
  quantity: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  distributedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: { type: String }
});

module.exports = mongoose.model('Distribution', DistributionSchema); 