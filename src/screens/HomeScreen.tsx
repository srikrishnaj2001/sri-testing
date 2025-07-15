import React from 'react';
import { View, Text, ScrollView, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import { CategoryCard } from '../components/CategoryCard';
import { ProductCard } from '../components/ProductCard';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { data: catData } = useCategories();
  const { data: prodData } = useProducts();

  const categories = catData?.data.categories || [];
  const products = prodData?.data.products || [];

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16 }}>
      <Text className="text-2xl font-bold mb-4 text-secondary-900">Categories</Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <CategoryCard
            category={item}
            onPress={() => navigation.navigate('Menu' as never, { categoryId: item.id } as never)}
          />
        )}
        className="mb-6"
      />
      <Text className="text-2xl font-bold mb-4 text-secondary-900">Popular</Text>
      {products.slice(0, 5).map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onPress={() => navigation.navigate('ProductDetails' as never, { productId: product.id } as never)}
        />
      ))}
    </ScrollView>
  );
};
