import React from 'react';
import { TouchableOpacity, Image, Text, View } from 'react-native';
import { Category } from '../services/productService';

interface Props {
  category: Category;
  onPress?: () => void;
}

export const CategoryCard: React.FC<Props> = ({ category, onPress }) => {
  return (
    <TouchableOpacity className="items-center mr-4" onPress={onPress}>
      <View className="w-20 h-20 rounded-xl overflow-hidden bg-secondary-100 mb-2">
        {category.image_url ? (
          <Image
            source={{ uri: category.image_url }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : null}
      </View>
      <Text
        className="text-sm text-center text-secondary-800"
        numberOfLines={1}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
};
