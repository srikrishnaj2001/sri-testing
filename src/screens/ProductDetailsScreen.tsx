import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQuery } from 'react-query';
import { productService, Product } from '../services/productService';
import { useCartStore } from '../store/cartStore';

interface Params {
  productId: string;
}

export const ProductDetailsScreen: React.FC = () => {
  const route = useRoute<RouteProp<Record<string, Params>, string>>();
  const { productId } = route.params as Params;
  const addItem = useCartStore(state => state.addItem);

  const { data } = useQuery<{
    success: boolean;
    message: string;
    data: Product;
  }>(['product', productId], () => productService.getProduct(productId));

  const product = data?.data;

  if (!product) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Image
        source={{ uri: product.image_url }}
        className="w-full h-64 rounded-2xl mb-4"
        resizeMode="cover"
      />
      <Text className="text-2xl font-bold mb-2 text-secondary-900">
        {product.name}
      </Text>
      <Text className="text-secondary-700 mb-4">{product.description}</Text>
      <Text className="text-xl font-semibold text-primary-600 mb-4">
        ₹{product.price.toFixed(2)}
      </Text>
      <TouchableOpacity
        onPress={() => addItem(product)}
        className="bg-primary-500 py-3 rounded-xl"
      >
        <Text className="text-white text-center font-semibold">
          Add to Cart
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
