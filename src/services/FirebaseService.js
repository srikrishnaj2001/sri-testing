const admin = require('firebase-admin');
const { FcmNotification } = require('../models');

class FirebaseService {
  constructor() {
    this.initialized = false;
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  initializeFirebase() {
    try {
      // Check if Firebase credentials are available
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
        console.log('Firebase credentials not configured. Skipping Firebase initialization.');
        this.initialized = false;
        return;
      }

      if (!admin.apps.length) {
        const serviceAccount = {
          type: 'service_account',
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
          token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
        };

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });

        this.initialized = true;
        console.log('Firebase Admin SDK initialized successfully');
      } else {
        this.initialized = true;
        console.log('Firebase Admin SDK already initialized');
      }
    } catch (error) {
      console.error('Firebase initialization error:', error);
      this.initialized = false;
    }
  }

  /**
   * Send FCM notification to single device
   */
  async sendNotification(token, title, body, data = {}, options = {}) {
    if (!this.initialized) {
      console.log('Firebase not initialized. Skipping FCM notification.');
      return {
        success: false,
        message: 'Firebase not initialized',
        token
      };
    }

    try {
      const message = {
        token,
        notification: {
          title,
          body,
          ...(options.image && { imageUrl: options.image })
        },
        data: {
          ...data,
          click_action: options.click_action || 'FLUTTER_NOTIFICATION_CLICK'
        },
        android: {
          notification: {
            priority: options.priority || 'normal',
            sound: options.sound || 'default',
            channelId: 'default_channel',
            ...(options.image && { imageUrl: options.image })
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title,
                body
              },
              sound: options.sound || 'default',
              badge: options.badge || 1,
              'content-available': 1
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      
      // Log FCM notification to database
      await this.logFcmNotification({
        fcm_token: token,
        title,
        body,
        data: JSON.stringify(data),
        image: options.image,
        user_id: options.user_id,
        type: options.type || 'general',
        status: 'sent',
        fcm_message_id: response,
        click_action: options.click_action,
        priority: options.priority || 'normal',
        sound: options.sound,
        badge: options.badge,
        sent_at: new Date()
      });

      return {
        success: true,
        messageId: response,
        token
      };
    } catch (error) {
      console.error('FCM send error:', error);
      
      // Log failed FCM notification
      await this.logFcmNotification({
        fcm_token: token,
        title,
        body,
        data: JSON.stringify(data),
        image: options.image,
        user_id: options.user_id,
        type: options.type || 'general',
        status: 'failed',
        error_message: error.message,
        click_action: options.click_action,
        priority: options.priority || 'normal',
        sound: options.sound,
        badge: options.badge
      });

      throw error;
    }
  }

  /**
   * Send FCM notification to multiple devices
   */
  async sendMulticastNotification(tokens, title, body, data = {}, options = {}) {
    if (!this.initialized) {
      console.log('Firebase not initialized. Skipping FCM multicast notification.');
      return {
        success: false,
        message: 'Firebase not initialized',
        tokens
      };
    }

    if (!Array.isArray(tokens) || tokens.length === 0) {
      throw new Error('Tokens must be a non-empty array');
    }

    try {
      const message = {
        tokens,
        notification: {
          title,
          body,
          ...(options.image && { imageUrl: options.image })
        },
        data: {
          ...data,
          click_action: options.click_action || 'FLUTTER_NOTIFICATION_CLICK'
        },
        android: {
          notification: {
            priority: options.priority || 'normal',
            sound: options.sound || 'default',
            channelId: 'default_channel',
            ...(options.image && { imageUrl: options.image })
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title,
                body
              },
              sound: options.sound || 'default',
              badge: options.badge || 1,
              'content-available': 1
            }
          }
        }
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      
      // Log each FCM notification result
      const results = [];
      for (let i = 0; i < response.responses.length; i++) {
        const result = response.responses[i];
        const token = tokens[i];
        
        const logData = {
          fcm_token: token,
          title,
          body,
          data: JSON.stringify(data),
          image: options.image,
          user_id: options.user_id,
          type: options.type || 'general',
          click_action: options.click_action,
          priority: options.priority || 'normal',
          sound: options.sound,
          badge: options.badge
        };

        if (result.success) {
          await this.logFcmNotification({
            ...logData,
            status: 'sent',
            fcm_message_id: result.messageId,
            sent_at: new Date()
          });
          results.push({ token, success: true, messageId: result.messageId });
        } else {
          await this.logFcmNotification({
            ...logData,
            status: 'failed',
            error_message: result.error?.message || 'Unknown error'
          });
          results.push({ token, success: false, error: result.error });
        }
      }

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        results
      };
    } catch (error) {
      console.error('FCM multicast send error:', error);
      throw error;
    }
  }

  /**
   * Send notification to topic
   */
  async sendTopicNotification(topic, title, body, data = {}, options = {}) {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      const message = {
        topic,
        notification: {
          title,
          body,
          ...(options.image && { imageUrl: options.image })
        },
        data: {
          ...data,
          click_action: options.click_action || 'FLUTTER_NOTIFICATION_CLICK'
        },
        android: {
          notification: {
            priority: options.priority || 'normal',
            sound: options.sound || 'default',
            channelId: 'default_channel',
            ...(options.image && { imageUrl: options.image })
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title,
                body
              },
              sound: options.sound || 'default',
              badge: options.badge || 1,
              'content-available': 1
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      
      // Log topic notification
      await this.logFcmNotification({
        fcm_token: `topic:${topic}`,
        title,
        body,
        data: JSON.stringify(data),
        image: options.image,
        type: options.type || 'general',
        status: 'sent',
        fcm_message_id: response,
        click_action: options.click_action,
        priority: options.priority || 'normal',
        sound: options.sound,
        badge: options.badge,
        sent_at: new Date()
      });

      return {
        success: true,
        messageId: response,
        topic
      };
    } catch (error) {
      console.error('FCM topic send error:', error);
      
      // Log failed topic notification
      await this.logFcmNotification({
        fcm_token: `topic:${topic}`,
        title,
        body,
        data: JSON.stringify(data),
        image: options.image,
        type: options.type || 'general',
        status: 'failed',
        error_message: error.message,
        click_action: options.click_action,
        priority: options.priority || 'normal',
        sound: options.sound,
        badge: options.badge
      });

      throw error;
    }
  }

  /**
   * Subscribe users to topic
   */
  async subscribeToTopic(tokens, topic) {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        errors: response.errors
      };
    } catch (error) {
      console.error('FCM topic subscription error:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe users from topic
   */
  async unsubscribeFromTopic(tokens, topic) {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        errors: response.errors
      };
    } catch (error) {
      console.error('FCM topic unsubscription error:', error);
      throw error;
    }
  }

  /**
   * Log FCM notification to database
   */
  async logFcmNotification(notificationData) {
    try {
      await FcmNotification.create(notificationData);
    } catch (error) {
      console.error('Error logging FCM notification:', error);
    }
  }

  /**
   * Validate FCM token
   */
  async validateToken(token) {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      // Try to send a dry run message to validate token
      await admin.messaging().send({
        token,
        notification: {
          title: 'Test',
          body: 'Test'
        }
      }, true); // dry run
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Get notification templates
   */
  getNotificationTemplates() {
    return {
      order_placed: {
        title: 'Order Placed Successfully',
        body: 'Your order #{order_id} has been placed successfully.',
        type: 'order',
        click_action: 'ORDER_DETAILS'
      },
      order_confirmed: {
        title: 'Order Confirmed',
        body: 'Your order #{order_id} has been confirmed and is being prepared.',
        type: 'order',
        click_action: 'ORDER_DETAILS'
      },
      order_processing: {
        title: 'Order Processing',
        body: 'Your order #{order_id} is being prepared.',
        type: 'order',
        click_action: 'ORDER_DETAILS'
      },
      order_ready: {
        title: 'Order Ready',
        body: 'Your order #{order_id} is ready for pickup/delivery.',
        type: 'order',
        click_action: 'ORDER_DETAILS'
      },
      order_delivered: {
        title: 'Order Delivered',
        body: 'Your order #{order_id} has been delivered successfully.',
        type: 'order',
        click_action: 'ORDER_DETAILS'
      },
      new_message: {
        title: 'New Message',
        body: 'You have a new message from {sender}.',
        type: 'message',
        click_action: 'CHAT_SCREEN'
      },
      promotion: {
        title: 'Special Offer',
        body: 'Don\'t miss out on our special offers!',
        type: 'promotion',
        click_action: 'MAIN_SCREEN'
      }
    };
  }
}

module.exports = new FirebaseService(); 