import mongoose, { Schema, Document, Model } from 'mongoose';

export interface MembershipDoc extends Document {
  membershipId: string;
  userId?: string;
  email?: string;
  productId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<MembershipDoc>({
  membershipId: { type: String, required: true, index: true, unique: true },
  userId: { type: String },
  email: { type: String },
  productId: { type: String, index: true },
}, { timestamps: true });

export const MembershipModel: Model<MembershipDoc> = mongoose.models.Membership || mongoose.model<MembershipDoc>('Membership', MembershipSchema);

export default MembershipModel;


