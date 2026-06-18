import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: function() { return this.role !== 'Elder'; },
    unique: true,
    sparse: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() { return this.role !== 'Elder'; },
    minlength: 6
  },
  role: {
    type: String,
    enum: ['Admin', 'Customer', 'Caretaker', 'Elder'],
    required: true
  },
  phone: { type: String, default: '' },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    }
  },
  avatar: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  parentCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  relation: { type: String, default: '' }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  if (!this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
