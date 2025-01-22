import mongoose, { Document, model, Schema } from "mongoose";

// Add these to existing types
export interface INeed extends Document {
  type: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  location: {
    lat: number;
    lng: number;
  };
  status: 'pending' | 'in-progress' | 'resolved';
  createdBy: Schema.Types.ObjectId;
  assignedTo?: Schema.Types.ObjectId;
  eta?: number;
  createdAt: Date;
  updatedAt: Date;
}


const NeedSchema = new Schema<INeed>({
  type: { type: String, required: true },
  description: { type: String, required: true },
  urgency: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  status: { type: String, enum: ['pending', 'in-progress', 'resolved'], default: 'pending' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'Organization' },
  eta: { type: Number }, // Estimated time of arrival in minutes
}, {
  timestamps: true
});

// Create indexes for efficient querying
NeedSchema.index({ status: 1 });
NeedSchema.index({ urgency: 1 });
NeedSchema.index({ type: 1 });
NeedSchema.index({ location: '2dsphere' }); // For geospatial queries

export const Need = mongoose.models.Need || model<INeed>('Need', NeedSchema);