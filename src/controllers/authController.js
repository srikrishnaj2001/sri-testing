const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const db = require('../models');
const { generateUserToken, USER_TYPES } = require('../config/clerk');
const { generateResponse, generateErrorResponse } = require('../utils/responseHelper');
const { validateRegistration, validateLogin } = require('../utils/validation');

const { User } = db;

class AuthController {
  // Customer Registration
  async registerCustomer(req, res) {
    try {
      const { error } = validateRegistration(req.body);
      if (error) {
        return generateErrorResponse(res, 400, 'Validation failed', error.details);
      }

      const { f_name, l_name, phone, email, password, refer_code } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { phone },
            ...(email ? [{ email }] : [])
          ]
        }
      });

      if (existingUser) {
        return generateErrorResponse(res, 409, 'User already exists with this phone or email');
      }

      // Handle referral code
      let referrer = null;
      if (refer_code) {
        referrer = await User.findOne({ where: { refer_code } });
        if (!referrer) {
          return generateErrorResponse(res, 400, 'Invalid referral code');
        }
      }

      // Create user
      const userData = {
        f_name,
        l_name,
        phone,
        email,
        password,
        user_type: null, // null means customer
        refer_by: referrer?.id,
        is_active: 1,
        language_code: req.body.language_code || 'en'
      };

      const user = await User.create(userData);

      // Generate auth token
      const token = generateUserToken(user, USER_TYPES.CUSTOMER);

      // Return user data (password excluded by toJSON method)
      return generateResponse(res, 201, 'Customer registered successfully', {
        user: user.toJSON(),
        token,
        user_type: USER_TYPES.CUSTOMER
      });

    } catch (error) {
      console.error('Customer registration error:', error);
      return generateErrorResponse(res, 500, 'Registration failed', error.message);
    }
  }

  // Customer Login
  async loginCustomer(req, res) {
    try {
      const { error } = validateLogin(req.body);
      if (error) {
        return generateErrorResponse(res, 400, 'Validation failed', error.details);
      }

      const { phone, email, password } = req.body;

      // Find user by phone or email
      const user = await User.findOne({
        where: {
          [Op.or]: [
            ...(phone ? [{ phone }] : []),
            ...(email ? [{ email }] : [])
          ],
          [Op.or]: [
            { user_type: null },
            { user_type: USER_TYPES.CUSTOMER }
          ]
        }
      });

      if (!user) {
        return generateErrorResponse(res, 401, 'Invalid credentials');
      }

      // Check if user is active
      if (!user.is_active) {
        return generateErrorResponse(res, 403, 'Account is deactivated');
      }

      // Check if user is temporarily blocked
      if (user.is_temp_blocked && user.temp_block_time && new Date() < user.temp_block_time) {
        return generateErrorResponse(res, 423, 'Account temporarily blocked due to multiple failed login attempts');
      }

      // Verify password
      const isPasswordValid = await user.verifyPassword(password);
      if (!isPasswordValid) {
        // Increment login hit count
        await user.increment('login_hit_count');
        
        // Block user if too many failed attempts
        if (user.login_hit_count >= 5) {
          const blockTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
          await user.update({
            is_temp_blocked: true,
            temp_block_time: blockTime
          });
        }

        return generateErrorResponse(res, 401, 'Invalid credentials');
      }

      // Reset login attempts on successful login
      if (user.login_hit_count > 0 || user.is_temp_blocked) {
        await user.update({
          login_hit_count: 0,
          is_temp_blocked: false,
          temp_block_time: null
        });
      }

      // Generate auth token
      const token = generateUserToken(user, USER_TYPES.CUSTOMER);

      return generateResponse(res, 200, 'Login successful', {
        user: user.toJSON(),
        token,
        user_type: USER_TYPES.CUSTOMER
      });

    } catch (error) {
      console.error('Customer login error:', error);
      return generateErrorResponse(res, 500, 'Login failed', error.message);
    }
  }

  // Delivery Man Login
  async loginDeliveryMan(req, res) {
    try {
      const { error } = validateLogin(req.body);
      if (error) {
        return generateErrorResponse(res, 400, 'Validation failed', error.details);
      }

      const { phone, email, password } = req.body;

      // Find delivery man by phone or email
      const user = await User.findOne({
        where: {
          [Op.or]: [
            ...(phone ? [{ phone }] : []),
            ...(email ? [{ email }] : [])
          ],
          user_type: USER_TYPES.DELIVERY_MAN
        }
      });

      if (!user) {
        return generateErrorResponse(res, 401, 'Invalid credentials');
      }

      if (!user.is_active) {
        return generateErrorResponse(res, 403, 'Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await user.verifyPassword(password);
      if (!isPasswordValid) {
        return generateErrorResponse(res, 401, 'Invalid credentials');
      }

      // Generate auth token
      const token = generateUserToken(user, USER_TYPES.DELIVERY_MAN);

      return generateResponse(res, 200, 'Login successful', {
        user: user.toJSON(),
        token,
        user_type: USER_TYPES.DELIVERY_MAN
      });

    } catch (error) {
      console.error('Delivery man login error:', error);
      return generateErrorResponse(res, 500, 'Login failed', error.message);
    }
  }

  // Admin Login
  async loginAdmin(req, res) {
    try {
      const { error } = validateLogin(req.body);
      if (error) {
        return generateErrorResponse(res, 400, 'Validation failed', error.details);
      }

      const { phone, email, password } = req.body;

      // Find admin by phone or email
      const user = await User.findOne({
        where: {
          [Op.or]: [
            ...(phone ? [{ phone }] : []),
            ...(email ? [{ email }] : [])
          ],
          user_type: {
            [Op.in]: [USER_TYPES.ADMIN, USER_TYPES.SUPER_ADMIN]
          }
        }
      });

      if (!user) {
        return generateErrorResponse(res, 401, 'Invalid credentials');
      }

      if (!user.is_active) {
        return generateErrorResponse(res, 403, 'Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await user.verifyPassword(password);
      if (!isPasswordValid) {
        return generateErrorResponse(res, 401, 'Invalid credentials');
      }

      // Generate auth token
      const token = generateUserToken(user, user.user_type);

      return generateResponse(res, 200, 'Login successful', {
        user: user.toJSON(),
        token,
        user_type: user.user_type
      });

    } catch (error) {
      console.error('Admin login error:', error);
      return generateErrorResponse(res, 500, 'Login failed', error.message);
    }
  }

  // Kitchen Staff Login
  async loginKitchen(req, res) {
    try {
      const { error } = validateLogin(req.body);
      if (error) {
        return generateErrorResponse(res, 400, 'Validation failed', error.details);
      }

      const { phone, email, password } = req.body;

      // Find kitchen staff by phone or email
      const user = await User.findOne({
        where: {
          [Op.or]: [
            ...(phone ? [{ phone }] : []),
            ...(email ? [{ email }] : [])
          ],
          user_type: USER_TYPES.KITCHEN
        }
      });

      if (!user) {
        return generateErrorResponse(res, 401, 'Invalid credentials');
      }

      if (!user.is_active) {
        return generateErrorResponse(res, 403, 'Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await user.verifyPassword(password);
      if (!isPasswordValid) {
        return generateErrorResponse(res, 401, 'Invalid credentials');
      }

      // Generate auth token
      const token = generateUserToken(user, USER_TYPES.KITCHEN);

      return generateResponse(res, 200, 'Login successful', {
        user: user.toJSON(),
        token,
        user_type: USER_TYPES.KITCHEN
      });

    } catch (error) {
      console.error('Kitchen login error:', error);
      return generateErrorResponse(res, 500, 'Login failed', error.message);
    }
  }

  // Logout (Universal)
  async logout(req, res) {
    try {
      // In a stateless JWT system, logout is handled client-side
      // But we can add the token to a blacklist if needed
      
      return generateResponse(res, 200, 'Logout successful', {
        message: 'Please remove the token from client storage'
      });

    } catch (error) {
      console.error('Logout error:', error);
      return generateErrorResponse(res, 500, 'Logout failed', error.message);
    }
  }

  // Refresh Token
  async refreshToken(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return generateErrorResponse(res, 401, 'Access token is required');
      }

      const token = authHeader.split(' ')[1];

      try {
        // Verify the token (even if expired, we'll check the user)
        const decodedToken = jwt.verify(token, process.env.CLERK_JWT_KEY, { ignoreExpiration: true });
        
        // Find the user
        const user = await User.findByPk(decodedToken.sub);
        if (!user || !user.is_active) {
          return generateErrorResponse(res, 401, 'Invalid user');
        }

        // Generate new token
        const newToken = generateUserToken(user, user.user_type || USER_TYPES.CUSTOMER);

        return generateResponse(res, 200, 'Token refreshed successfully', {
          token: newToken,
          user: user.toJSON(),
          user_type: user.user_type || USER_TYPES.CUSTOMER
        });

      } catch (error) {
        return generateErrorResponse(res, 401, 'Invalid or expired token');
      }

    } catch (error) {
      console.error('Token refresh error:', error);
      return generateErrorResponse(res, 500, 'Token refresh failed', error.message);
    }
  }

  // Get Current User Profile
  async getProfile(req, res) {
    try {
      if (!req.user) {
        return generateErrorResponse(res, 401, 'Authentication required');
      }

      // Get fresh user data
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return generateErrorResponse(res, 404, 'User not found');
      }

      return generateResponse(res, 200, 'Profile retrieved successfully', {
        user: user.toJSON(),
        user_type: user.user_type || USER_TYPES.CUSTOMER
      });

    } catch (error) {
      console.error('Get profile error:', error);
      return generateErrorResponse(res, 500, 'Failed to get profile', error.message);
    }
  }

  // Update Profile
  async updateProfile(req, res) {
    try {
      if (!req.user) {
        return generateErrorResponse(res, 401, 'Authentication required');
      }

      const { f_name, l_name, email, language_code } = req.body;

      // Get user
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return generateErrorResponse(res, 404, 'User not found');
      }

      // Check if email is already taken by another user
      if (email && email !== user.email) {
        const existingUser = await User.findOne({
          where: {
            email,
            id: { [Op.ne]: user.id }
          }
        });

        if (existingUser) {
          return generateErrorResponse(res, 409, 'Email already taken');
        }
      }

      // Update user
      const updateData = {};
      if (f_name) updateData.f_name = f_name;
      if (l_name) updateData.l_name = l_name;
      if (email) updateData.email = email;
      if (language_code) updateData.language_code = language_code;

      await user.update(updateData);

      return generateResponse(res, 200, 'Profile updated successfully', {
        user: user.toJSON()
      });

    } catch (error) {
      console.error('Update profile error:', error);
      return generateErrorResponse(res, 500, 'Failed to update profile', error.message);
    }
  }

  // Change Password
  async changePassword(req, res) {
    try {
      if (!req.user) {
        return generateErrorResponse(res, 401, 'Authentication required');
      }

      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        return generateErrorResponse(res, 400, 'Current password and new password are required');
      }

      if (new_password.length < 6) {
        return generateErrorResponse(res, 400, 'New password must be at least 6 characters long');
      }

      // Get user
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return generateErrorResponse(res, 404, 'User not found');
      }

      // Verify current password
      const isPasswordValid = await user.verifyPassword(current_password);
      if (!isPasswordValid) {
        return generateErrorResponse(res, 401, 'Current password is incorrect');
      }

      // Update password
      await user.update({ password: new_password });

      return generateResponse(res, 200, 'Password changed successfully');

    } catch (error) {
      console.error('Change password error:', error);
      return generateErrorResponse(res, 500, 'Failed to change password', error.message);
    }
  }

  // Verify Phone (OTP would be integrated here)
  async verifyPhone(req, res) {
    try {
      if (!req.user) {
        return generateErrorResponse(res, 401, 'Authentication required');
      }

      const { otp } = req.body;

      // TODO: Implement actual OTP verification with SMS service
      // For now, we'll accept any 6-digit OTP
      if (!otp || otp.length !== 6) {
        return generateErrorResponse(res, 400, 'Invalid OTP');
      }

      // Get user
      const user = await User.findByPk(req.user.id);
      if (!user) {
        return generateErrorResponse(res, 404, 'User not found');
      }

      // Update phone verification status
      await user.update({ is_phone_verified: true });

      return generateResponse(res, 200, 'Phone verified successfully', {
        user: user.toJSON()
      });

    } catch (error) {
      console.error('Phone verification error:', error);
      return generateErrorResponse(res, 500, 'Phone verification failed', error.message);
    }
  }
}

module.exports = new AuthController(); 