const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrganizationInviteSchema = new Schema({
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'OrganizationProfiles',
    required: true
  },
  invitedEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'AccountUsers',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'revoked'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true,
  collection: 'OrganizationInvites'
});

module.exports = mongoose.model('OrganizationInvites', OrganizationInviteSchema);
