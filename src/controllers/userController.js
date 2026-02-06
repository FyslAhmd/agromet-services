import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// User Registration
export const registerUser = async (req, res) => {
  try {
    const { username, name, email, mobileNumber, designation, organization, address, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { 
        username 
      } 
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const existingEmail = await User.findOne({ 
      where: { 
        email 
      } 
    });

    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with pending status
    const user = await User.create({
      username,
      name,
      email,
      mobileNumber,
      designation,
      organization,
      address,
      password: hashedPassword,
      status: 'pending',
      role: 'user'
    });

    res.status(201).json({
      message: 'Registration successful! Please wait for admin approval.',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

// User Login
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username or email
    const user = await User.findOne({ 
      where: { username } 
    });

    if (!user) {
      // Try finding by email
      const userByEmail = await User.findOne({ 
        where: { email: username } 
      });
      
      if (!userByEmail) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Check password for email login
      const isPasswordValid = await bcrypt.compare(password, userByEmail.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if user is approved
      if (userByEmail.status !== 'approved') {
        return res.status(403).json({ message: 'Account not approved yet' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: userByEmail.id, username: userByEmail.username, role: userByEmail.role },
        process.env.SECRET_KEY || 'agromet-secret-key-2024',
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: userByEmail.id,
          username: userByEmail.username,
          name: userByEmail.name,
          email: userByEmail.email,
          mobileNumber: userByEmail.mobileNumber,
          designation: userByEmail.designation,
          organization: userByEmail.organization,
          role: userByEmail.role,
          status: userByEmail.status
        }
      });
    }

    // Check if user is approved
    if (user.status !== 'approved') {
      return res.status(403).json({ message: 'Account not approved yet' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.SECRET_KEY || 'agromet-secret-key-2024',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        designation: user.designation,
        organization: user.organization,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users (admin only) with pagination
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status; // Optional filter by status

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      data: users,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, username, email, mobileNumber, designation, organization, role, status } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if username is being changed and if it already exists
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ 
        where: { username } 
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ 
        where: { email } 
      });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    await user.update({
      name: name || user.name,
      username: username || user.username,
      email: email || user.email,
      mobileNumber: mobileNumber || user.mobileNumber,
      designation: designation || user.designation,
      organization: organization || user.organization,
      role: role || user.role,
      status: status || user.status
    });

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        designation: user.designation,
        organization: user.organization,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve user (admin only)
export const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ status: 'approved' });

    res.json({ message: 'User approved successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject user (admin only)
export const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ status: 'rejected' });

    res.json({ message: 'User rejected successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
