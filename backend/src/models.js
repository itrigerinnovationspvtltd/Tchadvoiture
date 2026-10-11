import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['buyer', 'individual', 'dealer'], required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive', 'blocked'], default: 'active' },
    location: { type: String, default: '', trim: true },
    avatarUrl: { type: String, default: '' },
    dealershipName: { type: String, default: '', trim: true },
    logoUrl: { type: String, default: '' },
    description: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    businessDetails: { type: String, default: '', trim: true },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'super_admin'], default: 'super_admin' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const refreshTokenSchema = new mongoose.Schema(
  {
    subjectType: { type: String, enum: ['user', 'admin'], required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const revokedTokenSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});

const vehicleSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sellerRole: { type: String, enum: ['individual', 'dealer'], required: true },
    make: { type: mongoose.Schema.Types.ObjectId, ref: 'Make', required: true },
    model: { type: mongoose.Schema.Types.ObjectId, ref: 'Model', required: true },
    makeName: { type: String, required: true },
    modelName: { type: String, required: true },
    variant: { type: String, default: '', trim: true },
    manufacturingYear: { type: Number, required: true },
    registrationYear: { type: Number, default: null },
    fuelType: { type: mongoose.Schema.Types.ObjectId, ref: 'Lookup', required: true },
    fuelName: { type: String, required: true },
    transmission: { type: mongoose.Schema.Types.ObjectId, ref: 'Lookup', required: true },
    transmissionName: { type: String, required: true },
    vehicleType: { type: mongoose.Schema.Types.ObjectId, ref: 'Lookup', required: true },
    vehicleTypeName: { type: String, required: true },
    kilometers: { type: Number, required: true },
    owners: { type: Number, required: true },
    condition: { type: String, enum: ['Excellent', 'Good', 'Fair', 'Poor'], required: true },
    price: { type: Number, required: true },
    location: { type: String, required: true, trim: true },
    color: { type: String, default: '', trim: true },
    registrationNumber: { type: String, default: '', trim: true },
    insured: { type: Boolean, default: false },
    insuranceExpiry: { type: String, default: '' },
    insurancePolicyNumber: { type: String, default: '' },
    specs: [{ label: { type: String }, value: { type: String } }],
    description: { type: String, required: true },
    images: [{ url: String, filename: String }],
    status: {
      type: String,
      enum: ['pending', 'active', 'rejected', 'inactive', 'sold', 'removed'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String, default: '' },
  },
  { timestamps: true },
);

vehicleSchema.index({ status: 1, createdAt: -1 });
vehicleSchema.index({ price: 1 });

const enquirySchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    buyerName: { type: String, required: true },
    buyerPhone: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    message: { type: String, required: true },
    vehicleTitle: { type: String, required: true },
    status: { type: String, enum: ['new', 'read', 'closed'], default: 'new' },
  },
  { timestamps: true },
);

const wishlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  },
  { timestamps: true },
);
wishlistSchema.index({ user: 1, vehicle: 1 }, { unique: true });

const reportSchema = new mongoose.Schema(
  {
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    vehicleTitle: { type: String, default: '' },
    status: { type: String, enum: ['open', 'dismissed', 'actioned'], default: 'open' },
  },
  { timestamps: true },
);

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    link: { type: String, default: '' },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const makeSchema = new mongoose.Schema(
  { name: { type: String, required: true, unique: true, trim: true } },
  { timestamps: true },
);

const modelSchema = new mongoose.Schema(
  {
    make: { type: mongoose.Schema.Types.ObjectId, ref: 'Make', required: true, index: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);
modelSchema.index({ make: 1, name: 1 }, { unique: true });

const lookupSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['vehicleType', 'fuel', 'transmission'], required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);
lookupSchema.index({ kind: 1, name: 1 }, { unique: true });

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'platform', unique: true },
    individualListingLimit: { type: Number, default: 3 },
    currencyLabel: { type: String, default: '' },
  },
  { timestamps: true },
);

const pageSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
  },
  { timestamps: true },
);

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { timestamps: true },
);

const activitySchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    actorName: { type: String, default: '' },
    action: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true },
);

export const User = mongoose.model('User', userSchema);
export const Admin = mongoose.model('Admin', adminSchema);
export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
export const RevokedToken = mongoose.model('RevokedToken', revokedTokenSchema);
export const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export const Enquiry = mongoose.model('Enquiry', enquirySchema);
export const Wishlist = mongoose.model('Wishlist', wishlistSchema);
export const Report = mongoose.model('Report', reportSchema);
export const Notification = mongoose.model('Notification', notificationSchema);
export const Make = mongoose.model('Make', makeSchema);
export const Model = mongoose.model('Model', modelSchema);
export const Lookup = mongoose.model('Lookup', lookupSchema);
export const Setting = mongoose.model('Setting', settingSchema);
export const Page = mongoose.model('Page', pageSchema);
export const Announcement = mongoose.model('Announcement', announcementSchema);
export const Activity = mongoose.model('Activity', activitySchema);

export const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor'];
export const COUNTED_STATUSES = ['pending', 'active'];
