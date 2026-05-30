import { Op } from "sequelize";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "fs";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const APP_NAME = "BRRI Agromet Services";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "agromet@brri.gov.bd";
const GUEST_USER_RESPONSE = {
  id: "guest",
  username: "guest",
  name: "Guest Visitor",
  email: null,
  role: "guest",
  status: "approved",
  isGuest: true,
};

const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD,
    },
  });
};

const buildAccountStatusEmail = ({ user, status }) => {
  const isApproved = status === "approved";
  const title = isApproved ? "Account Approved" : "Account Request Update";
  const subject = isApproved
    ? "Your BRRI Agromet account is approved"
    : "Update on your BRRI Agromet account request";
  const accentColor = isApproved ? "#0f766e" : "#b91c1c";
  const bodyText = isApproved
    ? "Your account request has been approved. You can now sign in and use the Agromet Services portal."
    : "Your account request was not approved at this time. Please contact support for assistance or clarification.";
  const ctaText = isApproved ? "You may now log in with your registered credentials." : "Please contact support if you would like to appeal or submit again.";

  return {
    subject,
    html: `
      <div style="background:#f4f7f9;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <div style="padding:16px 20px;background:${accentColor};color:#ffffff;">
            <h2 style="margin:0;font-size:20px;font-weight:700;">${title}</h2>
          </div>
          <div style="padding:20px;line-height:1.6;">
            <p style="margin-top:0;">Dear ${user.name || user.username || "User"},</p>
            <p>${bodyText}</p>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;margin:14px 0;">
              <p style="margin:0;"><strong>Username:</strong> ${user.username || "-"}</p>
              <p style="margin:6px 0 0 0;"><strong>Email:</strong> ${user.email || "-"}</p>
              <p style="margin:6px 0 0 0;"><strong>Current Status:</strong> ${status}</p>
            </div>
            <p style="margin:0 0 12px 0;">${ctaText}</p>
            <p style="margin:0;">Support: <a href="mailto:${SUPPORT_EMAIL}" style="color:${accentColor};text-decoration:none;">${SUPPORT_EMAIL}</a></p>
          </div>
          <div style="padding:14px 20px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
            This is an automated message from ${APP_NAME}. Please do not reply directly.
          </div>
        </div>
      </div>
    `,
  };
};

const sendAccountStatusNotification = async (user, status) => {
  if (!process.env.EMAIL_USER) {
    throw new Error("EMAIL_USER is not configured");
  }

  const transporter = createEmailTransporter();
  const { subject, html } = buildAccountStatusEmail({ user, status });

  await transporter.sendMail({
    from: `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject,
    html,
  });
};

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
        status: user.status,
        profilePicture: user.profilePicture
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
          address: userByEmail.address,
          role: userByEmail.role,
          status: userByEmail.status,
          profilePicture: userByEmail.profilePicture
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
        address: user.address,
        role: user.role,
        status: user.status,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const guestLoginUser = async (req, res) => {
  try {
    const token = jwt.sign(
      {
        id: "guest",
        username: "guest",
        role: "guest",
        isGuest: true,
      },
      process.env.SECRET_KEY || 'agromet-secret-key-2026',
      { expiresIn: process.env.GUEST_TOKEN_EXPIRES_IN || "24h" }
    );

    res.json({
      message: "Guest login successful",
      token,
      user: GUEST_USER_RESPONSE,
    });
  } catch (error) {
    console.error("Guest login error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get current user
export const getCurrentUser = async (req, res) => {
  try {
    if (req.user?.isGuest) {
      return res.json(GUEST_USER_RESPONSE);
    }

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

    if (req.user.role !== "admin" && String(req.userId) !== String(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

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
    const { name, username, email, mobileNumber, designation, organization, address, role, status } = req.body;

    const isAdmin = req.user?.role === "admin";
    if (!isAdmin && String(req.userId) !== String(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if username is being changed and if it already exists
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ 
        where: { username, id: { [Op.ne]: userId } } 
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ 
        where: { email, id: { [Op.ne]: userId } } 
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
      address: address !== undefined ? address : user.address,
      role: isAdmin ? (role || user.role) : user.role,
      status: isAdmin ? (status || user.status) : user.status
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
        address: user.address,
        role: user.role,
        status: user.status,
        profilePicture: user.profilePicture
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

    if (req.user.role !== "admin" && String(req.userId) !== String(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

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

    let notificationSent = false;
    try {
      await sendAccountStatusNotification(user, 'approved');
      notificationSent = true;
    } catch (emailError) {
      console.error(`Approval email failed for user ${user.id}:`, emailError.message);
    }

    res.json({
      message: notificationSent
        ? 'User approved successfully and email sent'
        : 'User approved successfully, but email notification could not be sent',
      notificationSent,
      user,
    });
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

    let notificationSent = false;
    try {
      await sendAccountStatusNotification(user, 'rejected');
      notificationSent = true;
    } catch (emailError) {
      console.error(`Rejection email failed for user ${user.id}:`, emailError.message);
    }

    res.json({
      message: notificationSent
        ? 'User rejected successfully and email sent'
        : 'User rejected successfully, but email notification could not be sent',
      notificationSent,
      user,
    });
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

// Upload profile picture
export const uploadProfilePicture = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.role !== "admin" && String(req.userId) !== String(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old profile picture if exists
    if (user.profilePicture) {
      const oldPath = join(__dirname, '..', '..', user.profilePicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Store relative path: uploads/profiles/filename.ext
    const relativePath = `uploads/profiles/${req.file.filename}`;
    await user.update({ profilePicture: relativePath });

    res.json({
      message: 'Profile picture uploaded successfully',
      profilePicture: relativePath,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove profile picture
export const removeProfilePicture = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.role !== "admin" && String(req.userId) !== String(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete file from disk
    if (user.profilePicture) {
      const filePath = join(__dirname, '..', '..', user.profilePicture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await user.update({ profilePicture: null });

    res.json({ message: 'Profile picture removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
