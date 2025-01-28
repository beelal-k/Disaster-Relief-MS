import mongoose, { Schema, Document } from 'mongoose';
import { User } from './User.model';
import { Dispatch } from './Dispatch.model';

export interface INeed extends Document {
  type: 'food' | 'shelter' | 'medical' | 'water' | 'other';
  description: string;
  urgency: 'high' | 'medium' | 'low';
  location: {
    lat: number;
    lng: number;
  };
  status: 'pending' | 'resources-dispatched' | 'completed';
  createdBy: typeof User;
  requiredQuantity: number;
  fulfilledQuantity: number;
  dispatches: Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const NeedSchema = new Schema({
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['food', 'shelter', 'medical', 'water', 'other'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [500, 'Description must be less than 500 characters'],
  },
  urgency: {
    type: String,
    required: [true, 'Urgency level is required'],
    enum: ['high', 'medium', 'low'],
  },
  location: {
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    lng: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'resources-dispatched', 'completed'],
    default: 'pending',
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requiredQuantity: {
    type: Number,
    required: [true, 'Required quantity is required'],
    default: 1,
    min: [1, 'Required quantity must be at least 1'],
  },
  fulfilledQuantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  dispatches: [{
    type: Schema.Types.ObjectId,
    ref: Dispatch.modelName
  }]
}, {
  timestamps: true,
});

// Create indexes for efficient querying
NeedSchema.index({ status: 1 });
NeedSchema.index({ urgency: 1 });
NeedSchema.index({ type: 1 });
NeedSchema.index({ location: '2dsphere' });

// Ensure model is only compiled once
export const Need = mongoose.models.Need || mongoose.model<INeed>('Need', NeedSchema);