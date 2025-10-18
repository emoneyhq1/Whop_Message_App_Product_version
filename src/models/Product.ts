import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ProductDoc extends Document {
  productId: string;
  visibility?: string;
  title?: string;
  activeUsers?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<ProductDoc>({
  productId: { type: String, required: true, index: true, unique: true },
  visibility: { type: String },
  title: { type: String },
  activeUsers: { type: Number, default: 0 },
}, { timestamps: true });

export const ProductModel: Model<ProductDoc> = mongoose.models.Product || mongoose.model<ProductDoc>('Product', ProductSchema);

export default ProductModel;


