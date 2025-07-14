const express = require('express');
const router = express.Router();
const { generateResponse, generateErrorResponse } = require('../../utils/responseHelper');

// Get policy pages (terms, privacy, about us)
router.get('/', async (req, res) => {
  try {
    const pages = [
      {
        id: 1,
        title: 'Terms and Conditions',
        slug: 'terms-and-conditions',
        content: 'Welcome to our eFood delivery service. By using our services, you agree to these terms and conditions...',
        status: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        title: 'Privacy Policy',
        slug: 'privacy-policy',
        content: 'Your privacy is important to us. This privacy policy explains how we collect, use, and protect your information...',
        status: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 3,
        title: 'About Us',
        slug: 'about-us',
        content: 'We are a leading food delivery service committed to bringing delicious meals from your favorite restaurants directly to your door...',
        status: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 4,
        title: 'Refund Policy',
        slug: 'refund-policy',
        content: 'We want you to be completely satisfied with your order. If you are not satisfied, please contact us for a refund...',
        status: 1,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 5,
        title: 'Cancellation Policy',
        slug: 'cancellation-policy',
        content: 'Orders can be cancelled before the restaurant starts preparing your food. Please contact us immediately if you need to cancel...',
        status: 1,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    return generateResponse(res, 200, 'Pages retrieved successfully', pages);

  } catch (error) {
    console.error('Get pages error:', error);
    return generateErrorResponse(res, 500, 'Failed to retrieve pages', error.message);
  }
});

// Get specific page by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const pages = {
      'terms-and-conditions': {
        id: 1,
        title: 'Terms and Conditions',
        slug: 'terms-and-conditions',
        content: 'Welcome to our eFood delivery service. By using our services, you agree to these terms and conditions...',
        status: 1
      },
      'privacy-policy': {
        id: 2,
        title: 'Privacy Policy',
        slug: 'privacy-policy',
        content: 'Your privacy is important to us. This privacy policy explains how we collect, use, and protect your information...',
        status: 1
      },
      'about-us': {
        id: 3,
        title: 'About Us',
        slug: 'about-us',
        content: 'We are a leading food delivery service committed to bringing delicious meals from your favorite restaurants directly to your door...',
        status: 1
      },
      'refund-policy': {
        id: 4,
        title: 'Refund Policy',
        slug: 'refund-policy',
        content: 'We want you to be completely satisfied with your order. If you are not satisfied, please contact us for a refund...',
        status: 1
      },
      'cancellation-policy': {
        id: 5,
        title: 'Cancellation Policy',
        slug: 'cancellation-policy',
        content: 'Orders can be cancelled before the restaurant starts preparing your food. Please contact us immediately if you need to cancel...',
        status: 1
      }
    };

    const page = pages[slug];
    
    if (!page) {
      return generateErrorResponse(res, 404, 'Page not found');
    }

    return generateResponse(res, 200, 'Page retrieved successfully', page);

  } catch (error) {
    console.error('Get page error:', error);
    return generateErrorResponse(res, 500, 'Failed to retrieve page', error.message);
  }
});

module.exports = router; 