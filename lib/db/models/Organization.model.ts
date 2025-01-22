import mongoose, { Document, model, Schema } from 'mongoose';

export interface IOrganization extends Document {
    name: string;
    description: string;
    contactEmail: string;
    contactPhone?: string;
    address?: string;
    website?: string;
    admin: Schema.Types.ObjectId;
    members: Schema.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>({
    name: { type: String, required: true },
    description: { type: String, required: true },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String },
    address: { type: String },
    website: { type: String },
    admin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, {
    timestamps: true
});

// Ensure unique name and contact email
OrganizationSchema.index({ name: 1 }, { unique: true });
OrganizationSchema.index({ contactEmail: 1 }, { unique: true });

export const Organization = mongoose.models.Organization || model<IOrganization>('Organization', OrganizationSchema); 