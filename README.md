# eFood - React Native Food Delivery App

A modern, fast, and feature-rich food delivery app built with React Native and Expo, designed to deliver food in 10 minutes from a single cloud kitchen.

## 🚀 Features

### Core Features
- **Authentication**: Phone, email, and social login via Clerk
- **Location-based Service**: Only serves Bengaluru pin codes (560001, 560102, etc.)
- **Real-time Menu**: Dynamic menu with categories and product filtering
- **Smart Cart**: Quantity controls, variations, add-ons, and price calculations
- **Order Tracking**: Real-time order status updates with polling
- **Order History**: View past orders with detailed information

### Technical Features
- **Offline Support**: Works with limited connectivity
- **State Management**: Zustand for cart, user, and app state
- **API Integration**: Connects to Node.js backend at localhost:8009
- **Modern UI**: NativeWind (Tailwind CSS) for responsive design
- **Testing**: Jest and React Native Testing Library setup
- **Type Safety**: Full TypeScript implementation

## 📱 Tech Stack

### Frontend
- **React Native** with **Expo** (v49)
- **TypeScript** for type safety
- **React Navigation** for navigation
- **NativeWind** for styling (Tailwind CSS)
- **Zustand** for state management
- **React Query** for API caching and synchronization
- **Clerk** for authentication

### Backend Integration
- **Axios** for API calls
- **Node.js Backend** at `http://localhost:8009`
- **RESTful API** integration

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator
- Backend server running at `http://localhost:8009`

### Step 1: Clone and Install
```bash
# Install dependencies
npm install

# or
yarn install
```

### Step 2: Environment Setup
Create a `.env.local` file in the root directory:
```env
# API Configuration
API_URL=http://localhost:8009
API_VERSION=v1

# Clerk Authentication
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Location Service
ALLOWED_PIN_CODES=560001,560102,560103,560104,560105
```

### Step 3: Start the Development Server
```bash
# Start Expo development server
npm start

# or
yarn start
```

### Step 4: Run on Device/Emulator
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
├── navigation/         # Navigation setup
├── services/          # API services
├── store/             # Zustand stores
├── utils/             # Utility functions
├── hooks/             # Custom hooks
├── types/             # TypeScript type definitions
├── constants/         # App constants
└── context/           # React contexts
```

## 🔗 API Integration

The app connects to the Node.js backend running at `http://localhost:8009` with the following endpoints:

### Authentication
- `POST /api/v1/auth/customer/register` - User registration
- `POST /api/v1/auth/customer/login` - User login

### Products & Categories
- `GET /api/v1/products` - Get all products
- `GET /api/v1/products/category/:id` - Get products by category
- `GET /api/v1/categories` - Get all categories

### Orders
- `POST /api/v1/orders` - Place order
- `GET /api/v1/orders` - Get user orders
- `GET /api/v1/order-tracking/:id` - Get order tracking

### Configuration
- `GET /api/v1/config` - Get app configuration
- `GET /api/v1/config/banners` - Get banners

## 🎨 UI/UX Design

The app follows the design patterns from the existing Flutter app:

### Navigation Structure
- **Bottom Tab Navigation**: Home, Wishlist, Cart, Orders, Menu
- **Stack Navigation**: For detailed screens and flows

### Key Screens
1. **Home Screen**: Banners, categories, popular items
2. **Menu Screen**: Full menu with category filtering
3. **Cart Screen**: Cart management with quantity controls
4. **Checkout Screen**: Address selection and order placement
5. **Order Tracking**: Real-time order status updates
6. **Order History**: Past orders with details

### Design System
- **Colors**: Primary (red), secondary (gray), success (green)
- **Typography**: Inter font family
- **Spacing**: Consistent 4px grid system
- **Components**: Reusable, accessible components

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Components and utilities
- **Integration Tests**: API services and flows
- **E2E Tests**: Complete user journeys

## 📦 Build & Deployment

### EAS Build Setup
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for Android
npm run build:android

# Build for iOS
npm run build:ios
```

### Environment Configuration
- **Development**: `.env.local`
- **Production**: `.env.production`

## 🔧 Development Guidelines

### Code Style
- **ESLint**: Enforced linting rules
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking

### Component Guidelines
- Use functional components with hooks
- Implement proper error boundaries
- Follow accessibility best practices
- Use TypeScript for all components

### State Management
- **Cart State**: Zustand store with persistence
- **User State**: Authentication and profile data
- **App State**: Global app configuration

## 🌟 Features Implementation Status

### ✅ Completed
- [x] Project structure setup
- [x] API service layer
- [x] State management (Zustand)
- [x] Authentication integration (Clerk)
- [x] Location service

### 🚧 In Progress
- [ ] Navigation setup
- [ ] Home screen
- [ ] Menu screen
- [ ] Cart system
- [ ] Checkout flow
- [ ] Order tracking

### 📅 Planned
- [ ] Push notifications
- [ ] Online payments
- [ ] Loyalty system
- [ ] Reviews and ratings

## 📋 Location Service

The app only serves specific Bengaluru pin codes:
- 560001, 560102, 560103, 560104, 560105

Users outside these areas will see a "Service Unavailable" screen.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, email support@efood.com or join our Discord community.

## 🔄 Changelog

### v1.0.0
- Initial release
- Basic food delivery functionality
- Authentication with Clerk
- Location-based service
- Real-time order tracking 