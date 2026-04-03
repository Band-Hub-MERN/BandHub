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
  }
}, {
  timestamps: true,
  collection: 'AccountUsers'
});

module.exports = mongoose.model('AccountUsers', AccountUserSchema);
