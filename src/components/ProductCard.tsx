import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Product } from '../services/productService';

interface Props {
  product: Product;
  onAdd?: () => void;
  onPress?: () => void;
}

export const ProductCard: React.FC<Props> = ({ product, onAdd, onPress }) => {
  return (
    <TouchableOpacity
      className="flex-row p-3 bg-white rounded-xl mb-3 shadow-sm"
      onPress={onPress}
    >
      <Image
        source={{ uri: product.image_url }}
        className="w-20 h-20 rounded-lg mr-3"
        resizeMode="cover"
      />
      <View className="flex-1 justify-between">
        <View>
          <Text
            className="text-base font-semibold text-secondary-900"
            numberOfLines={1}
          >
            {product.name}
          </Text>
          <Text className="text-xs text-secondary-500" numberOfLines={2}>
            {product.description}
          </Text>
        </View>
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-primary-600 font-bold">
            ₹{product.price.toFixed(2)}
          </Text>
          {onAdd && (
            <TouchableOpacity
              onPress={onAdd}
              className="bg-primary-500 px-3 py-1 rounded-full"
            >
              <Text className="text-white text-sm">Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
