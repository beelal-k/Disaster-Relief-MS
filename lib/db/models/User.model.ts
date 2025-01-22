import mongoose, { Document, Schema, model } from 'mongoose';
// @ts-ignore
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  role: 'individual' | 'worker' | 'admin';
  organization?: Schema.Types.ObjectId;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['individual', 'worker', 'admin'], required: true },
  organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
}, {
  timestamps: true
});

UserSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.models.User || model<IUser>('User', UserSchema);