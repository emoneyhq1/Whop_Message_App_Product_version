import mongoose, { Schema, Document, Model } from 'mongoose';

export interface SyncStateDoc extends Document {
  key: string;
  lastPageProcessed: number;
  updatedAt: Date;
  createdAt: Date;
}

const SyncStateSchema = new Schema<SyncStateDoc>({
  key: { type: String, required: true, unique: true, index: true },
  lastPageProcessed: { type: Number, required: true, default: 0 },
}, { timestamps: true });

export const SyncStateModel: Model<SyncStateDoc> = mongoose.models.SyncState || mongoose.model<SyncStateDoc>('SyncState', SyncStateSchema);

export default SyncStateModel;


