import User from '../models/User.js';
import CaretakerProfile from '../models/CaretakerProfile.js';

// GET /api/users/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/users/me
export const updateMe = async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // password changes separate
    delete updates.role; // role changes only by admin

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const { role, isActive, city } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (city) filter['address.city'] = city;

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/users/:id (admin only)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/users/:id (admin only) — deletes the user and their caretaker profile
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }
    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      CaretakerProfile.deleteOne({ user: req.params.id }),
    ]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/users/me/elders
export const getMyElders = async (req, res) => {
  try {
    const elders = await User.find({ parentCustomer: req.user.id, role: 'Elder' });
    res.json(elders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/users/me/elders
export const addElder = async (req, res) => {
  try {
    const { firstName, lastName, relation, address, phone } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ message: 'First name and last name are required' });
    }
    const elder = await User.create({
      firstName,
      lastName,
      role: 'Elder',
      parentCustomer: req.user.id,
      relation: relation || '',
      phone: phone || '',
      address: address || { street: '', city: '', state: '', zipCode: '' }
    });
    res.status(201).json(elder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/users/me/elders/:elderId
export const updateElder = async (req, res) => {
  try {
    const { firstName, lastName, relation, address, phone } = req.body;
    const elder = await User.findOne({ _id: req.params.elderId, parentCustomer: req.user.id, role: 'Elder' });
    if (!elder) {
      return res.status(404).json({ message: 'Elder not found' });
    }
    if (firstName) elder.firstName = firstName;
    if (lastName) elder.lastName = lastName;
    if (relation !== undefined) elder.relation = relation;
    if (phone !== undefined) elder.phone = phone;
    if (address) {
      elder.address = {
        ...elder.address.toObject(),
        ...address
      };
    }
    await elder.save();
    res.json(elder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/users/me/elders/:elderId
export const deleteElder = async (req, res) => {
  try {
    const elder = await User.findOneAndDelete({ _id: req.params.elderId, parentCustomer: req.user.id, role: 'Elder' });
    if (!elder) {
      return res.status(404).json({ message: 'Elder not found' });
    }
    res.json({ message: 'Elder removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

