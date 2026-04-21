"use client";

import { useState } from "react";
import { ProductImageGenerator } from "@/components/catalog/product-image-generator";
import type { GeneratedImage, ProductVariant } from "@/lib/schemas/product-image";

// Mock data for demonstration
const mockImages: GeneratedImage[] = [
  {
    id: "img-1",
    url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "img-2",
    url: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop",
    status: "approved",
    createdAt: new Date().toISOString(),
  },
  {
    id: "img-3",
    url: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=400&fit=crop",
    status: "rejected",
    createdAt: new Date().toISOString(),
  },
  {
    id: "img-4",
    url: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=400&fit=crop",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "img-5",
    url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
];

const availableVariants: ProductVariant[] = [
  { attribute: "color", value: "blue" },
  { attribute: "color", value: "red" },
  { attribute: "color", value: "black" },
  { attribute: "size", value: "small" },
  { attribute: "size", value: "large" },
];

export default function ImageGeneratorDemo() {
  const [images, setImages] = useState<GeneratedImage[]>(mockImages);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    availableVariants[0]
  );

  const handleApprove = (imageId: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId ? { ...img, status: "approved" as const } : img
      )
    );
  };

  const handleReject = (imageId: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId ? { ...img, status: "rejected" as const } : img
      )
    );
  };

  const handleVariantChange = (variant: ProductVariant | undefined) => {
    setSelectedVariant(variant);
    // In a real app, you would fetch images for this variant
    console.log("[v0] Variant changed to:", variant);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Product Image Generator</h1>
          <p className="text-muted-foreground">
            Review and approve AI-generated product images. Associate images with specific product variants.
          </p>
        </div>

        <ProductImageGenerator
          productName="Wireless Headphones Pro"
          productSku="ELEC-001"
          images={images}
          variant={selectedVariant}
          availableVariants={availableVariants}
          onApprove={handleApprove}
          onReject={handleReject}
          onVariantChange={handleVariantChange}
        />

        {/* Usage Example Card */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Component Usage</h3>
          <pre className="overflow-x-auto rounded-lg bg-secondary/50 p-4 text-sm text-muted-foreground">
            <code>{`<ProductImageGenerator
  productName="Wireless Headphones Pro"
  productSku="ELEC-001"
  images={images}
  variant={{ attribute: "color", value: "blue" }}
  availableVariants={[
    { attribute: "color", value: "blue" },
    { attribute: "color", value: "red" },
  ]}
  onApprove={(imageId) => handleApprove(imageId)}
  onReject={(imageId) => handleReject(imageId)}
  onVariantChange={(variant) => setSelectedVariant(variant)}
/>`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
