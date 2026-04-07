const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BookingSchema = new Schema({
  garageId: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'H', 'I'],
    required: true
  },
  floor: {
    type: Number,
    min: 1,
    max: 4,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  groupName: {
    type: String,
    required: true,
    trim: true
  },
  orgId: {
    type: Schema.Types.ObjectId,
    ref: 'OrganizationProfiles',
    required: true
  },
  date: {
    type: String,
    required: true
  },
  isWeekly: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'AccountUsers',
    required: true
  }
}, {
  timestamps: true,
  collection: 'Bookings'
});

module.exports = mongoose.model('Bookings', BookingSchema);
