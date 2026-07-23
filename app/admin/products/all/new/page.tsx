"use client";

import { ProductForm } from "@/components/resource/product-form";

export default function NewProductPage() {
  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Add New Product</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Create a new product in your catalog.</p>
      </div>
      <ProductForm />
    </div>
  );
}
