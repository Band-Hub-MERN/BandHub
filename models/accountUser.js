const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AccountUserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  accountType: {
    type: String,
    enum: ['fan', 'member'],
    required: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  bio: {
    type: String,
    default: ''
  },
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'OrganizationProfiles',
    default: null
  },
  memberRoleLabel: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  verificationExpiresAt: {
    type: Date,
    default: null
  },
  emailDeliveryStatus: {
    type: String,
    default: 'pending'
  },
  emailDeliveryMessage: {
    type: String,
    default: ''
  },
  emailDeliveryUpdatedAt: {
    type: Date,
    default: null
  },
  registrationStatusToken: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpiresAt: {
    type: Date,
    default: null
  },
  notificationPrefs: {
    invites: { type: Boolean, default: true },
    events: { type: Boolean, default: true },
    bookings: { type: Boolean, default: true },
    digest: { type: Boolean, default: false }
  }
}, {
  timestamps: true,
  collection: 'AccountUsers'
});

module.exports = mongoose.model('AccountUsers', AccountUserSchema);
