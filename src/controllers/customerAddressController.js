const db = require('../models');
const { generateResponse, generateErrorResponse, generatePaginatedResponse } = require('../utils/responseHelper');
const { validateAddress } = require('../utils/validation');

const { User } = db;

class CustomerAddressController {
  // Get all customer addresses
  async getAddresses(req, res) {
    try {
      const { userId } = req.user;
      const { page = 1, limit = 20, type } = req.query;

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      let addresses = customer.getAddresses();

      // Filter by type if specified
      if (type) {
        addresses = addresses.filter(addr => addr.type === type);
      }

      // Pagination
      const total = addresses.length;
      const offset = (page - 1) * limit;
      const paginatedAddresses = addresses.slice(offset, offset + parseInt(limit));

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasNext: (page * limit) < total,
        hasPrev: page > 1
      };

      return generatePaginatedResponse(res, paginatedAddresses, pagination, 'Addresses retrieved successfully');

    } catch (error) {
      console.error('Get addresses error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve addresses', error.message);
    }
  }

  // Get single address by ID
  async getAddress(req, res) {
    try {
      const { userId } = req.user;
      const { address_id } = req.params;

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      const addresses = customer.getAddresses();
      const address = addresses.find(addr => addr.id === address_id);

      if (!address) {
        return generateErrorResponse(res, 404, 'Address not found');
      }

      return generateResponse(res, 200, 'Address retrieved successfully', {
        address
      });

    } catch (error) {
      console.error('Get address error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve address', error.message);
    }
  }

  // Add new address
  async addAddress(req, res) {
    try {
      const { userId } = req.user;
      const addressData = req.body;

      // Validate input
      const { error } = validateAddress(addressData);
      if (error) {
        return generateErrorResponse(res, 400, 'Validation error', error.details[0].message);
      }

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      // Get current addresses
      const currentAddresses = customer.getAddresses();

      // Check if this is the first address or should be default
      const isFirstAddress = currentAddresses.length === 0;
      const shouldBeDefault = isFirstAddress || addressData.is_default;

      // If setting as default, unset all other defaults
      if (shouldBeDefault) {
        currentAddresses.forEach(addr => {
          addr.is_default = false;
        });
      }

      // Create new address
      const newAddress = {
        id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: addressData.type || 'home',
        contact_person_name: addressData.contact_person_name,
        contact_person_number: addressData.contact_person_number,
        address_type: addressData.address_type || 'home',
        address: addressData.address,
        floor: addressData.floor,
        road: addressData.road,
        house: addressData.house,
        latitude: addressData.latitude,
        longitude: addressData.longitude,
        is_default: shouldBeDefault,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Add to addresses array
      const updatedAddresses = [...currentAddresses, newAddress];

      // Update customer
      await customer.update({ addresses: updatedAddresses });

      return generateResponse(res, 201, 'Address added successfully', {
        address: newAddress
      });

    } catch (error) {
      console.error('Add address error:', error);
      return generateErrorResponse(res, 500, 'Failed to add address', error.message);
    }
  }

  // Update address
  async updateAddress(req, res) {
    try {
      const { userId } = req.user;
      const { address_id } = req.params;
      const updateData = req.body;

      // Validate input
      const { error } = validateAddress(updateData);
      if (error) {
        return generateErrorResponse(res, 400, 'Validation error', error.details[0].message);
      }

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      const addresses = customer.getAddresses();
      const addressIndex = addresses.findIndex(addr => addr.id === address_id);

      if (addressIndex === -1) {
        return generateErrorResponse(res, 404, 'Address not found');
      }

      // If setting as default, unset all other defaults
      if (updateData.is_default) {
        addresses.forEach(addr => {
          addr.is_default = false;
        });
      }

      // Update address
      addresses[addressIndex] = {
        ...addresses[addressIndex],
        ...updateData,
        updated_at: new Date()
      };

      // Update customer
      await customer.update({ addresses });

      return generateResponse(res, 200, 'Address updated successfully', {
        address: addresses[addressIndex]
      });

    } catch (error) {
      console.error('Update address error:', error);
      return generateErrorResponse(res, 500, 'Failed to update address', error.message);
    }
  }

  // Delete address
  async deleteAddress(req, res) {
    try {
      const { userId } = req.user;
      const { address_id } = req.params;

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      const addresses = customer.getAddresses();
      const addressIndex = addresses.findIndex(addr => addr.id === address_id);

      if (addressIndex === -1) {
        return generateErrorResponse(res, 404, 'Address not found');
      }

      const addressToDelete = addresses[addressIndex];

      // Remove address from array
      addresses.splice(addressIndex, 1);

      // If deleted address was default, set another as default
      if (addressToDelete.is_default && addresses.length > 0) {
        addresses[0].is_default = true;
      }

      // Update customer
      await customer.update({ addresses });

      return generateResponse(res, 200, 'Address deleted successfully');

    } catch (error) {
      console.error('Delete address error:', error);
      return generateErrorResponse(res, 500, 'Failed to delete address', error.message);
    }
  }

  // Set default address
  async setDefaultAddress(req, res) {
    try {
      const { userId } = req.user;
      const { address_id } = req.params;

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      const addresses = customer.getAddresses();
      const addressIndex = addresses.findIndex(addr => addr.id === address_id);

      if (addressIndex === -1) {
        return generateErrorResponse(res, 404, 'Address not found');
      }

      // Unset all defaults
      addresses.forEach(addr => {
        addr.is_default = false;
      });

      // Set new default
      addresses[addressIndex].is_default = true;
      addresses[addressIndex].updated_at = new Date();

      // Update customer
      await customer.update({ addresses });

      return generateResponse(res, 200, 'Default address set successfully', {
        address: addresses[addressIndex]
      });

    } catch (error) {
      console.error('Set default address error:', error);
      return generateErrorResponse(res, 500, 'Failed to set default address', error.message);
    }
  }

  // Get default address
  async getDefaultAddress(req, res) {
    try {
      const { userId } = req.user;

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      const addresses = customer.getAddresses();
      const defaultAddress = addresses.find(addr => addr.is_default);

      if (!defaultAddress) {
        return generateErrorResponse(res, 404, 'No default address found');
      }

      return generateResponse(res, 200, 'Default address retrieved successfully', {
        address: defaultAddress
      });

    } catch (error) {
      console.error('Get default address error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve default address', error.message);
    }
  }

  // Get addresses by type
  async getAddressesByType(req, res) {
    try {
      const { userId } = req.user;
      const { type } = req.params;

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      const addresses = customer.getAddresses();
      const filteredAddresses = addresses.filter(addr => addr.type === type);

      return generateResponse(res, 200, `${type} addresses retrieved successfully`, {
        addresses: filteredAddresses,
        total: filteredAddresses.length
      });

    } catch (error) {
      console.error('Get addresses by type error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve addresses by type', error.message);
    }
  }

  // Validate address coordinates
  async validateCoordinates(req, res) {
    try {
      const { latitude, longitude } = req.body;

      if (!latitude || !longitude) {
        return generateErrorResponse(res, 400, 'Latitude and longitude are required');
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng)) {
        return generateErrorResponse(res, 400, 'Invalid coordinates');
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return generateErrorResponse(res, 400, 'Coordinates out of range');
      }

      // Check if coordinates are within service area
      const isWithinServiceArea = await this.checkServiceArea(lat, lng);

      return generateResponse(res, 200, 'Coordinates validated successfully', {
        latitude: lat,
        longitude: lng,
        is_valid: true,
        is_within_service_area: isWithinServiceArea
      });

    } catch (error) {
      console.error('Validate coordinates error:', error);
      return generateErrorResponse(res, 500, 'Failed to validate coordinates', error.message);
    }
  }

  // Helper method to check service area
  async checkServiceArea(_latitude, _longitude) {
    // This would typically check against branch coverage areas
    // For now, return true as a placeholder
    return true;
  }

  // Get nearby addresses (for autocomplete)
  async getNearbyAddresses(req, res) {
    try {
      const { latitude, longitude } = req.query;

      if (!latitude || !longitude) {
        return generateErrorResponse(res, 400, 'Latitude and longitude are required');
      }

      // This would typically query a geocoding service or database
      // For now, return mock data
      const nearbyAddresses = [
        {
          formatted_address: '123 Main Street, City, State, ZIP',
          latitude: parseFloat(latitude) + 0.001,
          longitude: parseFloat(longitude) + 0.001,
          distance: 0.1
        },
        {
          formatted_address: '456 Oak Avenue, City, State, ZIP',
          latitude: parseFloat(latitude) + 0.002,
          longitude: parseFloat(longitude) + 0.002,
          distance: 0.2
        }
      ];

      return generateResponse(res, 200, 'Nearby addresses retrieved successfully', {
        addresses: nearbyAddresses,
        total: nearbyAddresses.length
      });

    } catch (error) {
      console.error('Get nearby addresses error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve nearby addresses', error.message);
    }
  }
}

module.exports = new CustomerAddressController(); 