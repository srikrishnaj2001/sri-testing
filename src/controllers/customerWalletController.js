const db = require('../models');
const { generateResponse, generateErrorResponse, generatePaginatedResponse } = require('../utils/responseHelper');
const { validateWalletTransaction } = require('../utils/validation');

const { User } = db;

class CustomerWalletController {
  // Get wallet balance and info
  async getWalletInfo(req, res) {
    try {
      const { userId } = req.user;

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      const walletInfo = {
        balance: customer.getWalletBalance(),
        currency: process.env.CURRENCY || 'USD',
        currency_symbol: process.env.CURRENCY_SYMBOL || '$',
        transactions_count: customer.getWalletTransactions().length,
        last_transaction_date: customer.getLastWalletTransactionDate(),
        total_earned: customer.getTotalWalletEarned(),
        total_spent: customer.getTotalWalletSpent(),
        wallet_status: customer.wallet_status || 'active'
      };

      return generateResponse(res, 200, 'Wallet information retrieved successfully', {
        wallet: walletInfo
      });

    } catch (error) {
      console.error('Get wallet info error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve wallet information', error.message);
    }
  }

  // Get wallet transactions
  async getWalletTransactions(req, res) {
    try {
      const { userId } = req.user;
      const { page = 1, limit = 20, type, status, date_from, date_to } = req.query;

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      let transactions = customer.getWalletTransactions();

      // Filter by type
      if (type) {
        transactions = transactions.filter(txn => txn.type === type);
      }

      // Filter by status
      if (status) {
        transactions = transactions.filter(txn => txn.status === status);
      }

      // Filter by date range
      if (date_from || date_to) {
        transactions = transactions.filter(txn => {
          const txnDate = new Date(txn.created_at);
          const fromDate = date_from ? new Date(date_from) : null;
          const toDate = date_to ? new Date(date_to) : null;

          if (fromDate && txnDate < fromDate) return false;
          if (toDate && txnDate > toDate) return false;
          return true;
        });
      }

      // Sort by date (newest first)
      transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Pagination
      const total = transactions.length;
      const offset = (page - 1) * limit;
      const paginatedTransactions = transactions.slice(offset, offset + parseInt(limit));

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasNext: (page * limit) < total,
        hasPrev: page > 1
      };

      return generatePaginatedResponse(res, paginatedTransactions, pagination, 'Wallet transactions retrieved successfully');

    } catch (error) {
      console.error('Get wallet transactions error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve wallet transactions', error.message);
    }
  }

  // Add money to wallet
  async addMoney(req, res) {
    try {
      const { userId } = req.user;
      const { amount, payment_method, reference_id } = req.body;

      // Validate input
      const { error } = validateWalletTransaction({
        amount,
        type: 'credit',
        payment_method
      });

      if (error) {
        return generateErrorResponse(res, 400, 'Validation error', error.details[0].message);
      }

      if (!amount || amount <= 0) {
        return generateErrorResponse(res, 400, 'Amount must be greater than 0');
      }

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      // Create transaction record
      const transaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'credit',
        amount: parseFloat(amount),
        description: `Added money to wallet via ${payment_method}`,
        payment_method,
        reference_id,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      };

      // Get current transactions
      const currentTransactions = customer.getWalletTransactions();
      const updatedTransactions = [...currentTransactions, transaction];

      // Update customer with new transaction
      await customer.update({ wallet_transactions: updatedTransactions });

      // In a real implementation, you would process the payment here
      // For now, we'll mark it as completed
      transaction.status = 'completed';
      transaction.processed_at = new Date();

      // Update balance
      const currentBalance = customer.getWalletBalance();
      const newBalance = currentBalance + parseFloat(amount);

      await customer.update({ 
        wallet_balance: newBalance,
        wallet_transactions: updatedTransactions.map(txn => 
          txn.id === transaction.id ? transaction : txn
        )
      });

      return generateResponse(res, 201, 'Money added to wallet successfully', {
        transaction,
        new_balance: newBalance
      });

    } catch (error) {
      console.error('Add money error:', error);
      return generateErrorResponse(res, 500, 'Failed to add money to wallet', error.message);
    }
  }

  // Use wallet money (for orders)
  async useWalletMoney(req, res) {
    try {
      const { userId } = req.user;
      const { amount, description, order_id } = req.body;

      if (!amount || amount <= 0) {
        return generateErrorResponse(res, 400, 'Amount must be greater than 0');
      }

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      const currentBalance = customer.getWalletBalance();

      if (currentBalance < amount) {
        return generateErrorResponse(res, 400, 'Insufficient wallet balance');
      }

      // Create debit transaction
      const transaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'debit',
        amount: parseFloat(amount),
        description: description || 'Wallet payment for order',
        order_id,
        status: 'completed',
        created_at: new Date(),
        updated_at: new Date(),
        processed_at: new Date()
      };

      // Update balance and transactions
      const newBalance = currentBalance - parseFloat(amount);
      const currentTransactions = customer.getWalletTransactions();
      const updatedTransactions = [...currentTransactions, transaction];

      await customer.update({ 
        wallet_balance: newBalance,
        wallet_transactions: updatedTransactions
      });

      return generateResponse(res, 200, 'Wallet money used successfully', {
        transaction,
        new_balance: newBalance
      });

    } catch (error) {
      console.error('Use wallet money error:', error);
      return generateErrorResponse(res, 500, 'Failed to use wallet money', error.message);
    }
  }

  // Get single transaction
  async getTransaction(req, res) {
    try {
      const { userId } = req.user;
      const { transaction_id } = req.params;

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      const transactions = customer.getWalletTransactions();
      const transaction = transactions.find(txn => txn.id === transaction_id);

      if (!transaction) {
        return generateErrorResponse(res, 404, 'Transaction not found');
      }

      return generateResponse(res, 200, 'Transaction retrieved successfully', {
        transaction
      });

    } catch (error) {
      console.error('Get transaction error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve transaction', error.message);
    }
  }

  // Get wallet statistics
  async getWalletStats(req, res) {
    try {
      const { userId } = req.user;
      const { period = 'month' } = req.query;

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      const transactions = customer.getWalletTransactions();
      const now = new Date();
      let startDate;

      // Calculate period start date
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Filter transactions by period
      const periodTransactions = transactions.filter(txn => 
        new Date(txn.created_at) >= startDate
      );

      // Calculate statistics
      const stats = {
        period,
        current_balance: customer.getWalletBalance(),
        total_transactions: periodTransactions.length,
        total_credited: periodTransactions
          .filter(txn => txn.type === 'credit' && txn.status === 'completed')
          .reduce((sum, txn) => sum + txn.amount, 0),
        total_debited: periodTransactions
          .filter(txn => txn.type === 'debit' && txn.status === 'completed')
          .reduce((sum, txn) => sum + txn.amount, 0),
        credit_transactions: periodTransactions.filter(txn => txn.type === 'credit').length,
        debit_transactions: periodTransactions.filter(txn => txn.type === 'debit').length,
        pending_transactions: periodTransactions.filter(txn => txn.status === 'pending').length,
        failed_transactions: periodTransactions.filter(txn => txn.status === 'failed').length
      };

      stats.net_amount = stats.total_credited - stats.total_debited;

      return generateResponse(res, 200, 'Wallet statistics retrieved successfully', {
        stats
      });

    } catch (error) {
      console.error('Get wallet stats error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve wallet statistics', error.message);
    }
  }

  // Transfer money to another customer
  async transferMoney(req, res) {
    try {
      const { userId } = req.user;
      const { recipient_id, amount, description } = req.body;

      if (!recipient_id || !amount || amount <= 0) {
        return generateErrorResponse(res, 400, 'Recipient ID and valid amount are required');
      }

      if (recipient_id === userId) {
        return generateErrorResponse(res, 400, 'Cannot transfer money to yourself');
      }

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      // Check recipient exists
      const recipient = await User.findOne({
        where: { id: recipient_id, user_type: 'customer' }
      });

      if (!recipient) {
        return generateErrorResponse(res, 404, 'Recipient not found');
      }

      // Check balance
      const currentBalance = customer.getWalletBalance();
      if (currentBalance < amount) {
        return generateErrorResponse(res, 400, 'Insufficient wallet balance');
      }

      // In a real implementation, you would verify the PIN here
      // For now, we'll skip PIN verification

      // Create transactions for both users
      const transferId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const senderTransaction = {
        id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'debit',
        amount: parseFloat(amount),
        description: description || `Transfer to ${recipient.f_name} ${recipient.l_name}`,
        transfer_id: transferId,
        recipient_id,
        status: 'completed',
        created_at: new Date(),
        updated_at: new Date(),
        processed_at: new Date()
      };

      const recipientTransaction = {
        id: `txn_${Date.now() + 1}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'credit',
        amount: parseFloat(amount),
        description: description || `Transfer from ${customer.f_name} ${customer.l_name}`,
        transfer_id: transferId,
        sender_id: userId,
        status: 'completed',
        created_at: new Date(),
        updated_at: new Date(),
        processed_at: new Date()
      };

      // Update sender
      const senderTransactions = customer.getWalletTransactions();
      const senderNewBalance = currentBalance - parseFloat(amount);
      await customer.update({
        wallet_balance: senderNewBalance,
        wallet_transactions: [...senderTransactions, senderTransaction]
      });

      // Update recipient
      const recipientTransactions = recipient.getWalletTransactions();
      const recipientCurrentBalance = recipient.getWalletBalance();
      const recipientNewBalance = recipientCurrentBalance + parseFloat(amount);
      await recipient.update({
        wallet_balance: recipientNewBalance,
        wallet_transactions: [...recipientTransactions, recipientTransaction]
      });

      return generateResponse(res, 200, 'Money transferred successfully', {
        transfer_id: transferId,
        sender_transaction: senderTransaction,
        recipient_transaction: recipientTransaction,
        new_balance: senderNewBalance
      });

    } catch (error) {
      console.error('Transfer money error:', error);
      return generateErrorResponse(res, 500, 'Failed to transfer money', error.message);
    }
  }

  // Get bonus/cashback history
  async getBonusHistory(req, res) {
    try {
      const { userId } = req.user;
      const { page = 1, limit = 20 } = req.query;

      const customer = await User.findOne({
        where: { id: userId, user_type: 'customer' }
      });

      if (!customer) {
        return generateErrorResponse(res, 404, 'Customer not found');
      }

      const transactions = customer.getWalletTransactions();
      
      // Filter bonus/cashback transactions
      const bonusTransactions = transactions.filter(txn => 
        txn.type === 'credit' && 
        (txn.description.includes('bonus') || 
         txn.description.includes('cashback') ||
         txn.description.includes('reward'))
      );

      // Sort by date (newest first)
      bonusTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Pagination
      const total = bonusTransactions.length;
      const offset = (page - 1) * limit;
      const paginatedBonuses = bonusTransactions.slice(offset, offset + parseInt(limit));

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasNext: (page * limit) < total,
        hasPrev: page > 1
      };

      return generatePaginatedResponse(res, paginatedBonuses, pagination, 'Bonus history retrieved successfully');

    } catch (error) {
      console.error('Get bonus history error:', error);
      return generateErrorResponse(res, 500, 'Failed to retrieve bonus history', error.message);
    }
  }
}

module.exports = new CustomerWalletController(); 