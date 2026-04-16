const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GarageEventSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  orgName: {
    type: String,
    required: true,
    trim: true
  },
  orgId: {
    type: Schema.Types.ObjectId,
    ref: 'OrganizationProfiles',
    required: true
  },
  orgColor: {
    type: String,
    default: '#FFC904'
  },
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
  date: {
    type: String,
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
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'Other'
  },
  coverImage: {
    type: String,
    default: ''
  },
  attendees: {
    type: Number,
    default: 0
  },
  attendeeUserIds: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'AccountUsers'
    }],
    default: []
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'AccountUsers',
    required: true
  }
}, {
  timestamps: true,
  collection: 'GarageEvents'
});

module.exports = mongoose.model('GarageEvents', GarageEventSchema);
