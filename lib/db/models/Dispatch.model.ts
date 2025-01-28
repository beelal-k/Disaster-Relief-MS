import mongoose, { Schema, Document } from 'mongoose';

export interface IDispatch extends Document {
    need: Schema.Types.ObjectId;
    dispatchedAt: Date;
    eta: number; // in minutes
    status: 'dispatched' | 'reached';
    resourceAmount: number;
    createdAt: Date;
    updatedAt: Date;
}

const DispatchSchema = new Schema({
    need: {
        type: Schema.Types.ObjectId,
        ref: 'Need',
        required: true
    },
    dispatchedAt: {
        type: Date,
        default: Date.now
    },
    eta: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: ['dispatched', 'reached', 'cancelled'],
        default: 'dispatched'
    },
    resourceAmount: {
        type: Number,
        required: true,
        min: 1
    }
}, {
    timestamps: true
});

// Create indexes for efficient querying
DispatchSchema.index({ need: 1 });
DispatchSchema.index({ status: 1 });

export const Dispatch = mongoose.models.Dispatch || mongoose.model<IDispatch>('Dispatch', DispatchSchema); 