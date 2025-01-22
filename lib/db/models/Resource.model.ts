import mongoose, { Document, model, Schema } from "mongoose";

export interface IResource extends Document {
  type: string;
  quantity: number;
  location: {
    lat: number;
    lng: number;
  };
  status: 'available' | 'in-transit' | 'depleted';
  organization: Schema.Types.ObjectId;
}

const ResourceSchema = new Schema<IResource>({
  type: { type: String, required: true },
  quantity: { type: Number, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  status: { type: String, enum: ['available', 'in-transit', 'depleted'], default: 'available' },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true }
}, {
    timestamps: true
});

export const Resource = mongoose.models.Resource || model<IResource>('Resource', ResourceSchema);