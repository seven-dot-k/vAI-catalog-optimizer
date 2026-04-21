"use client";

import { useState, useCallback } from "react";
import { ProductImageGenerator } from "@/components/catalog/product-image-generator";
import type { GeneratedImage, VariantGroup } from "@/lib/schemas/product-image";

// Mock data for demonstration - use static dates to avoid hydration mismatch
const mockImages: GeneratedImage[] = [
  {
    id: "img-1",
    url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    status: "pending",
    createdAt: "2024-01-15T10:30:00.000Z",
  },
  {
    id: "img-2",
    url: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop",
    status: "approved",
    createdAt: "2024-01-15T10:31:00.000Z",
  },
  {
    id: "img-3",
    url: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&h=400&fit=crop",
    status: "rejected",
    createdAt: "2024-01-15T10:32:00.000Z",
  },
  {
    id: "img-4",
    url: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=400&fit=crop",
    status: "pending",
    createdAt: "2024-01-15T10:33:00.000Z",
  },
];

// Available product attributes for building variant groups
const availableAttributes = [
  { name: "color", values: ["blue", "red", "black", "white"] },
  { name: "size", values: ["small", "medium", "large"] },
];

export default function ImageGeneratorDemo() {
  const [images, setImages] = useState<GeneratedImage[]>(mockImages);
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([]);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    console.log("[v0]", msg);
    setDebugLog((prev) => [...prev.slice(-9), `${new Date().toISOString().slice(11, 19)}: ${msg}`]);
  }, []);

  const handleApprove = useCallback((imageId: string) => {
    addLog(`Approve clicked: ${imageId}`);
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId ? { ...img, status: "approved" as const } : img
      )
    );
  }, [addLog]);

  const handleReject = useCallback((imageId: string) => {
    addLog(`Reject clicked: ${imageId}`);
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId ? { ...img, status: "rejected" as const } : img
      )
    );
  }, [addLog]);

  const handleImageAssign = useCallback((imageId: string, groupId: string | null) => {
    addLog(`Image assigned: ${imageId} -> ${groupId || "unassigned"}`);
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId
          ? { ...img, variantGroupId: groupId ?? undefined }
          : img
      )
    );
  }, [addLog]);

  const handleVariantGroupCreate = useCallback((group: VariantGroup) => {
    addLog(`Group created: ${group.name}`);
    setVariantGroups((prev) => [...prev, group]);
  }, [addLog]);

  const handleVariantGroupDelete = useCallback((groupId: string) => {
    addLog(`Group deleted: ${groupId}`);
    setImages((prev) =>
      prev.map((img) =>
        img.variantGroupId === groupId
          ? { ...img, variantGroupId: undefined }
          : img
      )
    );
    setVariantGroups((prev) => prev.filter((g) => g.id !== groupId));
  }, [addLog]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Product Image Generator</h1>
          <p className="text-muted-foreground">
            Review AI-generated images and organize them into variant groups using drag and drop.
          </p>
        </div>

        {/* Debug Log Panel */}
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
          <h3 className="text-sm font-medium text-amber-400 mb-2">Debug Log (Latest 10)</h3>
          <div className="font-mono text-xs text-amber-300 space-y-0.5">
            {debugLog.length === 0 ? (
              <p className="text-muted-foreground">No actions yet. Try clicking buttons or dragging images.</p>
            ) : (
              debugLog.map((log, i) => <div key={i}>{log}</div>)
            )}
          </div>
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
