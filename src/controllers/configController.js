const db = require('../models');
const { generateResponse, generateErrorResponse } = require('../utils/responseHelper');

const { Branch } = db;

class ConfigController {
  // Get all branches
  async getBranches(req, res) {
    try {
      const { status = 1 } = req.query;

      const branches = await Branch.findAll({
        where: { status: parseInt(status) },
        order: [['name', 'ASC']]
      });

      const branchesWithExtras = branches.map(branch => {
        const branchData = branch.toJSON();
        branchData.is_delivery_available = branch.isDeliveryAvailable();
        branchData.is_pickup_available = branch.isPickupAvailable();
        return branchData;
      });

      return generateResponse(res, 200, 'Branches retrieved successfully', {
        branches: branchesWithExtras
      });

    } catch (error) {
      console.error('Get branches error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve branches', error.message);
    }
  }

  // Get single branch by ID
  async getBranch(req, res) {
    try {
      const { id } = req.params;

      const branch = await Branch.findOne({
        where: { id, status: 1 }
      });

      if (!branch) {
        return generateErrorResponse(res, 404, 'Branch not found');
      }

      const branchData = branch.toJSON();
      branchData.is_delivery_available = branch.isDeliveryAvailable();
      branchData.is_pickup_available = branch.isPickupAvailable();
      branchData.coverage_area = branch.getCoverageArea();
      branchData.delivery_time = branch.getDeliveryTime();

      return generateResponse(res, 200, 'Branch retrieved successfully', {
        branch: branchData
      });

    } catch (error) {
      console.error('Get branch error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve branch', error.message);
    }
  }

  // Get branches by location (nearest branches)
  async getBranchesByLocation(req, res) {
    try {
      const { latitude, longitude, radius = 10 } = req.query;

      if (!latitude || !longitude) {
        return generateErrorResponse(res, 400, 'Latitude and longitude are required');
      }

      const branches = await Branch.findAll({
        where: { status: 1 },
        order: [['name', 'ASC']]
      });

      // Calculate distance for each branch
      const branchesWithDistance = branches.map(branch => {
        const branchData = branch.toJSON();
        branchData.distance = branch.calculateDistance(parseFloat(latitude), parseFloat(longitude));
        branchData.is_delivery_available = branch.isDeliveryAvailable();
        branchData.is_pickup_available = branch.isPickupAvailable();
        return branchData;
      });

      // Filter by radius and sort by distance
      const nearbyBranches = branchesWithDistance
        .filter(branch => branch.distance <= parseFloat(radius))
        .sort((a, b) => a.distance - b.distance);

      return generateResponse(res, 200, 'Nearby branches retrieved successfully', {
        branches: nearbyBranches,
        total: nearbyBranches.length
      });

    } catch (error) {
      console.error('Get branches by location error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve nearby branches', error.message);
    }
  }

  // Check delivery availability for a location
  async checkDeliveryAvailability(req, res) {
    try {
      const { latitude, longitude, branch_id } = req.query;

      if (!latitude || !longitude) {
        return generateErrorResponse(res, 400, 'Latitude and longitude are required');
      }

      let branches = [];

      if (branch_id) {
        // Check specific branch
        const branch = await Branch.findOne({
          where: { id: branch_id, status: 1 }
        });

        if (!branch) {
          return generateErrorResponse(res, 404, 'Branch not found');
        }

        branches = [branch];
      } else {
        // Check all branches
        branches = await Branch.findAll({
          where: { status: 1 }
        });
      }

      const deliveryOptions = branches.map(branch => {
        const isAvailable = branch.isDeliveryAvailableAt(parseFloat(latitude), parseFloat(longitude));
        const distance = branch.calculateDistance(parseFloat(latitude), parseFloat(longitude));

        return {
          branch_id: branch.id,
          branch_name: branch.name,
          is_delivery_available: isAvailable,
          distance,
          delivery_time: branch.getDeliveryTime(),
          delivery_charge: branch.getDeliveryCharge(distance)
        };
      });

      const availableBranches = deliveryOptions.filter(option => option.is_delivery_available);

      return generateResponse(res, 200, 'Delivery availability checked successfully', {
        is_delivery_available: availableBranches.length > 0,
        available_branches: availableBranches.length,
        delivery_options: deliveryOptions
      });

    } catch (error) {
      console.error('Check delivery availability error:', error);
      return generateErrorResponse(res, 500, 'Failed to check delivery availability', error.message);
    }
  }

  // Get app configuration
  async getAppConfig(req, res) {
    try {
      // Get branches data
      const branches = await Branch.findAll({
        where: { status: 1 },
        order: [['name', 'ASC']]
      });

      const branchesWithExtras = branches.map(branch => {
        const branchData = branch.toJSON();
        return {
          id: branchData.id,
          name: branchData.name,
          email: branchData.email || null,
          phone: branchData.phone || null,
          address: branchData.address,
          longitude: branchData.longitude ? branchData.longitude.toString() : null,
          latitude: branchData.latitude ? branchData.latitude.toString() : null,
          coverage: branchData.coverage ? parseFloat(branchData.coverage) : 0,
          delivery_time: branchData.deliveryTime || '30-45',
          status: parseInt(branchData.status),
          created_at: branchData.createdAt,
          updated_at: branchData.updatedAt
        };
      });

      // Configuration in Flutter expected format
      const config = {
        // Restaurant basic info
        restaurant_name: process.env.BUSINESS_NAME || 'eFood Restaurant',
        restaurant_open_time: '09:00',
        restaurant_close_time: '22:00',
        restaurant_logo: '/assets/logo.png',
        restaurant_address: process.env.BUSINESS_ADDRESS || '123 Food Street, City, Country',
        restaurant_phone: process.env.BUSINESS_PHONE || '+1234567890',
        restaurant_email: process.env.BUSINESS_EMAIL || 'info@efood.com',
        
        // Base URLs for images
        base_urls: {
          product_image_url: `${process.env.BASE_URL || 'http://localhost:8009'}/storage/products/`,
          customer_image_url: `${process.env.BASE_URL || 'http://localhost:8009'}/storage/customers/`,
          banner_image_url: `${process.env.BASE_URL || 'http://localhost:8009'}/storage/banners/`,
          category_image_url: `${process.env.BASE_URL || 'http://localhost:8009'}/storage/categories/`,
          review_image_url: `${process.env.BASE_URL || 'http://localhost:8009'}/storage/reviews/`,
          notification_image_url: `${process.env.BASE_URL || 'http://localhost:8009'}/storage/notifications/`,
          restaurant_image_url: `${process.env.BASE_URL || 'http://localhost:8009'}/storage/restaurant/`,
          delivery_man_image_url: `${process.env.BASE_URL || 'http://localhost:8009'}/storage/delivery-man/`,
          chat_image_url: `${process.env.BASE_URL || 'http://localhost:8009'}/storage/chat/`
        },
        
        // Currency settings
        currency_symbol: process.env.CURRENCY_SYMBOL || '$',
        currency_symbol_position: 'left',
        
        // Delivery settings
        delivery_charge: parseFloat(process.env.DELIVERY_CHARGE) || 5.0,
        minimum_order_value: parseFloat(process.env.MINIMUM_ORDER_AMOUNT) || 10.0,
        
        // Payment methods
        cash_on_delivery: 'true',
        digital_payment: 'true',
        
        // Content pages
        terms_and_conditions: 'Terms and conditions content here',
        privacy_policy: 'Privacy policy content here',
        about_us: 'About us content here',
        
        // Policy pages data that Flutter expects
        return_page: {
          status: true,
          content: "Return policy content here"
        },
        refund_page: {
          status: true,
          content: "Refund policy content here"
        },
        cancellation_page: {
          status: true,
          content: "Cancellation policy content here"
        },        
        // Verification settings
        email_verification: true,
        phone_verification: true,
        
        // Country settings
        country: process.env.COUNTRY_CODE || 'US',
        
        // Service availability
        self_pickup: true,
        delivery: true,
        
        // Restaurant location coverage
        restaurant_location_coverage: {
          longitude: (process.env.RESTAURANT_LONGITUDE || '-74.0059'),
          latitude: (process.env.RESTAURANT_LATITUDE || '40.7128'),
          coverage: parseFloat(process.env.DELIVERY_RADIUS || '10.0')
        },
        
        // Branches
        branches: branchesWithExtras,
        
        // Delivery management
        delivery_management: {
          status: 1,
          min_shipping_charge: parseFloat(process.env.MIN_SHIPPING_CHARGE) || 2.0,
          shipping_per_km: parseFloat(process.env.SHIPPING_PER_KM) || 1.0
        },
        
        // Display settings
        decimal_point_settings: 2,
        time_format: '24h',
        time_zone: process.env.TIMEZONE || 'UTC',
        
        // Registration settings
        toggle_dm_registration: true,
        is_veg_non_veg_active: true,
        
        // App store configurations
        play_store_config: {
          status: true,
          link: 'https://play.google.com/store/apps/details?id=com.sixamtech.efood',
          min_version: '1.0.0'
        },
        app_store_config: {
          status: true,
          link: 'https://apps.apple.com/app/efood/id123456789',
          min_version: '1.0.0'
        },
        
        // Social media links
        social_media_link: [
          {
            id: 1,
            name: 'facebook',
            link: process.env.SOCIAL_FACEBOOK || '',
            status: 1
          },
          {
            id: 2,
            name: 'instagram',
            link: process.env.SOCIAL_INSTAGRAM || '',
            status: 1
          },
          {
            id: 3,
            name: 'twitter',
            link: process.env.SOCIAL_TWITTER || '',
            status: 1
          },
          {
            id: 4,
            name: 'youtube',
            link: process.env.SOCIAL_YOUTUBE || '',
            status: 1
          }
        ],
        
        // Restaurant schedule
        restaurant_schedule_time: [
          { day: "0", opening_time: '09:00:00', closing_time: '22:00:00' }, // Sunday
          { day: "1", opening_time: '09:00:00', closing_time: '22:00:00' }, // Monday
          { day: "2", opening_time: '09:00:00', closing_time: '22:00:00' }, // Tuesday
          { day: "3", opening_time: '09:00:00', closing_time: '22:00:00' }, // Wednesday
          { day: "4", opening_time: '09:00:00', closing_time: '22:00:00' }, // Thursday
          { day: "5", opening_time: '09:00:00', closing_time: '22:00:00' }, // Friday
          { day: "6", opening_time: '09:00:00', closing_time: '22:00:00' }  // Saturday
        ],
        
        // Schedule settings
        schedule_order_slot_duration: 30,
        
        // Social login
        social_login: {
          google: true,
          facebook: true,
          apple: true
        },
        
        // Loyalty program
        loyalty_point_status: true,
        loyalty_point_item_purchase_point: 1.0,
        loyalty_point_minimum_point: 10.0,
        loyalty_point_exchange_rate: 1.0,
        
        // Wallet and referral
        refer_earning_status: true,
        wallet_status: true,
        
        // Additional features
        is_offline_payment: true,
        is_guest_checkout: true,
        is_partial_payment: false,
        is_add_fund_to_wallet: true,
        partial_payment_combine_with: 'all',
        
        // Verification and authentication
        is_firebase_otp_verification: false,
        customer_verification: {
          status: 1,
          phone: 1,
          email: 0
        },
        
        // WhatsApp integration
        whatsapp: {
          status: 1,
          number: process.env.WHATSAPP_NUMBER || '+1234567890'
        },
        
        // Cookies management
        cookies_management: {
          status: 1,
          content: 'We use cookies to improve your experience'
        },
        
        // OTP settings
        otp_resend_time: 60,
        
        // Payment methods list
        active_payment_method_list: [
          {
            gateway: 'cash_on_delivery',
            gateway_title: 'Cash on Delivery',
            gateway_image: '/assets/payment/cash_on_delivery.png',
            mode: 'live',
            status: 1
          },
          {
            gateway: 'digital_payment',
            gateway_title: 'Digital Payment',
            gateway_image: '/assets/payment/digital_payment.png',
            mode: 'live',
            status: 1
          }
        ],
        
        // Digital payment info
        digital_payment_info: {
          digital_payment: true,
          plugin_payment_gateways: true,
          default_payment_gateways: true
        },
        
        // Apple login
        apple_login: {
          login_medium: 'apple',
          status: 1
        },
        
        // Customer login settings
        customer_login: {
          login_option: 'both',
          social_media_for_sign_up: 1
        },
        
        // Software version and footer
        software_version: '11.2',
        footer_copyright_text: '© 2024 eFood. All rights reserved.',
        footer_description: 'Your favorite food delivery service',
        
        // Additional settings
        cutlery_status: true,
        google_map_status: 1,
        
        // Maintenance mode
        advance_maintenance_mode: {
          maintenance_status: 0,
          selected_maintenance_system: {
            customer_app: 0,
            web_app: 0,
            deliveryman_app: 0
          },
          maintenance_type_and_duration: {
            maintenance_duration: 'until_change',
            start_date: null,
            end_date: null
          }
        }
      };

      // Return the config directly (not wrapped in a data object)
      return res.status(200).json(config);

    } catch (error) {
      console.error('Get app config error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve app configuration', error.message);
    }
  }

  // Get business hours
  async getBusinessHours(req, res) {
    try {
      const businessHours = {
        monday: { open: '09:00', close: '22:00', is_open: true },
        tuesday: { open: '09:00', close: '22:00', is_open: true },
        wednesday: { open: '09:00', close: '22:00', is_open: true },
        thursday: { open: '09:00', close: '22:00', is_open: true },
        friday: { open: '09:00', close: '22:00', is_open: true },
        saturday: { open: '09:00', close: '22:00', is_open: true },
        sunday: { open: '09:00', close: '22:00', is_open: true }
      };

      const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      
      const todayHours = businessHours[currentDay];
      const isOpenNow = todayHours.is_open && currentTime >= todayHours.open && currentTime <= todayHours.close;

      return generateResponse(res, 200, 'Business hours retrieved successfully', {
        business_hours: businessHours,
        current_day: currentDay,
        current_time: currentTime,
        is_open_now: isOpenNow,
        today_hours: todayHours
      });

    } catch (error) {
      console.error('Get business hours error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve business hours', error.message);
    }
  }

  // Get delivery areas/zones
  async getDeliveryZones(req, res) {
    try {
      const branches = await Branch.findAll({
        where: { status: 1 },
        attributes: ['id', 'name', 'coverage_area', 'delivery_time_type', 'delivery_time']
      });

      const deliveryZones = branches.map(branch => {
        const branchData = branch.toJSON();
        branchData.coverage_area = branch.getCoverageArea();
        branchData.delivery_time = branch.getDeliveryTime();
        return branchData;
      });

      return generateResponse(res, 200, 'Delivery zones retrieved successfully', {
        delivery_zones: deliveryZones
      });

    } catch (error) {
      console.error('Get delivery zones error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve delivery zones', error.message);
    }
  }

  // Get payment methods
  async getPaymentMethods(req, res) {
    try {
      const paymentMethods = [
        {
          id: 'cash_on_delivery',
          name: 'Cash on Delivery',
          type: 'cash',
          is_enabled: process.env.FEATURE_CASH_ON_DELIVERY !== 'false',
          icon: 'cash'
        },
        {
          id: 'razorpay',
          name: 'Razorpay',
          type: 'digital',
          is_enabled: process.env.FEATURE_DIGITAL_PAYMENT !== 'false' && process.env.RAZORPAY_KEY_ID,
          icon: 'card'
        },
        {
          id: 'wallet',
          name: 'Wallet',
          type: 'digital',
          is_enabled: process.env.FEATURE_DIGITAL_PAYMENT !== 'false',
          icon: 'wallet'
        }
      ];

      const enabledMethods = paymentMethods.filter(method => method.is_enabled);

      return generateResponse(res, 200, 'Payment methods retrieved successfully', {
        payment_methods: enabledMethods,
        total_methods: enabledMethods.length
      });

    } catch (error) {
      console.error('Get payment methods error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve payment methods', error.message);
    }
  }
}

module.exports = new ConfigController(); 