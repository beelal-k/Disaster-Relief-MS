import mongoose, { Schema, Document } from 'mongoose';

export interface IStock extends Document {
    type: 'food' | 'shelter' | 'medical' | 'water' | 'other';
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
}

const StockSchema = new Schema({
    type: {
        type: String,
        required: [true, 'Type is required'],
        enum: ['food', 'shelter', 'medical', 'water', 'other'],
        unique: true,
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be negative'],
    },
}, {
    timestamps: true,
});

// Create indexes for efficient querying
StockSchema.index({ type: 1 });

// Ensure model is only compiled once
export const Stock = mongoose.models.Stock || mongoose.model<IStock>('Stock', StockSchema); 