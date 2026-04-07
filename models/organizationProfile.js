const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PermissionSchema = new Schema({
  canInviteMembers: { type: Boolean, default: false },
  canRemoveMembers: { type: Boolean, default: false },
  canEditOrganization: { type: Boolean, default: false },
  canDeleteOrganization: { type: Boolean, default: false },
  canManagePermissions: { type: Boolean, default: false }
}, { _id: false });

const MemberSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'AccountUsers', required: true },
  permissions: { type: PermissionSchema, default: () => ({}) },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const OrganizationProfileSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: '#FFC904'
  },
  initials: {
    type: String,
    default: ''
  },
  ownerUserId: {
    type: Schema.Types.ObjectId,
    ref: 'AccountUsers',
    required: true
  },
  members: {
    type: [MemberSchema],
    default: []
  }
}, {
  timestamps: true,
  collection: 'OrganizationProfiles'
});

module.exports = mongoose.model('OrganizationProfiles', OrganizationProfileSchema);
