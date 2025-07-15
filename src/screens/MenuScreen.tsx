import React, { useState } from 'react';
import { FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import { CategoryCard } from '../components/CategoryCard';
import { ProductCard } from '../components/ProductCard';

interface Params {
  categoryId?: string;
}

export const MenuScreen: React.FC = () => {
  const route = useRoute<RouteProp<Record<string, Params>, string>>();
  const initialCategoryId = (route.params as Params)?.categoryId;
  const [selected, setSelected] = useState<string | undefined>(initialCategoryId);
  const navigation = useNavigation();

  const { data: catData } = useCategories();
  const { data: prodData } = useProducts(selected);

  const categories = catData?.data.categories || [];
  const products = prodData?.data.products || [];

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 16 }}>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelected(item.id)}>
            <CategoryCard category={item} />
          </TouchableOpacity>
        )}
        className="mb-6"
      />
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAdd={() => navigation.navigate('ProductDetails' as never, { productId: product.id } as never)}
          onPress={() => navigation.navigate('ProductDetails' as never, { productId: product.id } as never)}
        />
      ))}
    </ScrollView>
  );
};
