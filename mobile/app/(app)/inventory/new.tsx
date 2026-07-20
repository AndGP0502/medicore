import React from 'react';
import { router } from 'expo-router';
import { ProductForm } from '@/components/ProductForm';
import { useCreateProduct } from '@/api/inventory';

export default function NewProductScreen() {
  const createProduct = useCreateProduct();

  return (
    <ProductForm
      submitLabel="Crear producto"
      onSubmit={async (data) => {
        await createProduct.mutateAsync(data);
        router.back();
      }}
    />
  );
}
