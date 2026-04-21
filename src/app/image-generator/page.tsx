"use client";

import { useState, useCallback } from "react";
import { ProductImageGenerator } from "@/components/catalog/product-image-generator";
import type { GeneratedImage, VariantGroup } from "@/lib/schemas/product-image";

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
  {
    id: "img-6",
    url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "img-7",
    url: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
];

// Available product attributes for building variant groups
const availableAttributes = [
  { name: "color", values: ["blue", "red", "black", "white"] },
  { name: "size", values: ["small", "medium", "large"] },
  { name: "material", values: ["leather", "fabric", "mesh"] },
];

export default function ImageGeneratorDemo() {
  const [images, setImages] = useState<GeneratedImage[]>(mockImages);
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([]);

  const handleApprove = useCallback((imageId: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId ? { ...img, status: "approved" as const } : img
      )
    );
  }, []);

  const handleReject = useCallback((imageId: string) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId ? { ...img, status: "rejected" as const } : img
      )
    );
  }, []);

  const handleImageAssign = useCallback((imageId: string, groupId: string | null) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId
          ? { ...img, variantGroupId: groupId ?? undefined }
          : img
      )
    );
  }, []);

  const handleVariantGroupCreate = useCallback((group: VariantGroup) => {
    setVariantGroups((prev) => [...prev, group]);
  }, []);

  const handleVariantGroupDelete = useCallback((groupId: string) => {
    // First, unassign all images from this group
    setImages((prev) =>
      prev.map((img) =>
        img.variantGroupId === groupId
          ? { ...img, variantGroupId: undefined }
          : img
      )
    );
    // Then delete the group
    setVariantGroups((prev) => prev.filter((g) => g.id !== groupId));
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Product Image Generator</h1>
          <p className="text-muted-foreground">
            Review AI-generated images and organize them into variant groups using drag and drop.
          </p>
        </div>

        <ProductImageGenerator
          productName="Wireless Headphones Pro"
          productSku="ELEC-001"
          images={images}
          availableAttributes={availableAttributes}
          variantGroups={variantGroups}
          onApprove={handleApprove}
          onReject={handleReject}
          onImageAssign={handleImageAssign}
          onVariantGroupCreate={handleVariantGroupCreate}
          onVariantGroupDelete={handleVariantGroupDelete}
        />

        {/* Instructions */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">How to Use</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                1
              </div>
              <h4 className="font-medium text-foreground">Create Variant Groups</h4>
              <p className="text-sm text-muted-foreground">
                Click &quot;Add Variant Group&quot; and select attribute combinations like Color: Blue + Size: Large.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                2
              </div>
              <h4 className="font-medium text-foreground">Drag and Drop Images</h4>
              <p className="text-sm text-muted-foreground">
                Drag images from the unassigned pool into variant groups. Drag between groups to reassign.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                3
              </div>
              <h4 className="font-medium text-foreground">Review and Approve</h4>
              <p className="text-sm text-muted-foreground">
                Click images to preview. Use approve/reject buttons to manage image status.
              </p>
            </div>
          </div>
        </div>

        {/* Current State Debug */}
        <details className="rounded-xl border border-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
            View Current State (Debug)
          </summary>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-secondary/50 p-4 text-xs text-muted-foreground">
            {JSON.stringify(
              {
                variantGroups,
                imageAssignments: images.map((img) => ({
                  id: img.id,
                  status: img.status,
                  groupId: img.variantGroupId || "unassigned",
                })),
              },
              null,
              2
            )}
          </pre>
        </details>
      </div>
    </div>
  );
}
