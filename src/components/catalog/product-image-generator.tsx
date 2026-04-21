"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ZoomIn, Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeneratedImage, ProductVariant, VariantGroup } from "@/lib/schemas/product-image";

// Predefined colors for variant groups
const GROUP_COLORS = [
  "bg-blue-500/20 border-blue-500",
  "bg-emerald-500/20 border-emerald-500",
  "bg-amber-500/20 border-amber-500",
  "bg-purple-500/20 border-purple-500",
  "bg-rose-500/20 border-rose-500",
  "bg-cyan-500/20 border-cyan-500",
];

interface ProductImageGeneratorProps {
  productName: string;
  productSku: string;
  images: GeneratedImage[];
  availableAttributes?: { name: string; values: string[] }[];
  variantGroups?: VariantGroup[];
  onApprove?: (imageId: string) => void;
  onReject?: (imageId: string) => void;
  onImageAssign?: (imageId: string, groupId: string | null) => void;
  onVariantGroupCreate?: (group: VariantGroup) => void;
  onVariantGroupDelete?: (groupId: string) => void;
}

// Thumbnail Component with Drag Support
function ImageThumbnail({
  image,
  productName,
  onPreview,
  onApprove,
  onReject,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  image: GeneratedImage;
  productName: string;
  onPreview: () => void;
  onApprove: () => void;
  onReject: () => void;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const getStatusBadgeVariant = (status: GeneratedImage["status"]) => {
    switch (status) {
      case "approved":
        return "done";
      case "rejected":
        return "failed";
      default:
        return "pending";
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", image.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative flex-shrink-0 transition-all",
        isDragging && "opacity-50 scale-95"
      )}
    >
      {/* Drag Handle */}
      <div className="absolute -left-1 top-1/2 z-10 -translate-y-1/2 cursor-grab rounded bg-secondary/80 p-0.5 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Thumbnail Container */}
      <div
        className={cn(
          "relative h-32 w-32 cursor-pointer overflow-hidden rounded-lg border-2 transition-all",
          image.status === "approved" && "border-green-500",
          image.status === "rejected" && "border-red-500/50 opacity-60",
          image.status === "pending" && "border-border hover:border-muted-foreground"
        )}
        onClick={onPreview}
      >
        <img
          src={image.url}
          alt={`Generated image for ${productName}`}
          className="h-full w-full object-cover"
          draggable={false}
        />

        {/* Zoom Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
          <ZoomIn className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        {/* Status Badge */}
        <div className="absolute left-1.5 top-1.5">
          <Badge variant={getStatusBadgeVariant(image.status)} className="scale-90 capitalize">
            {image.status}
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-1.5 flex gap-1">
        <Button
          variant={image.status === "approved" ? "success" : "outline"}
          size="sm"
          className="h-7 flex-1 text-xs"
          onClick={onApprove}
          disabled={image.status === "approved"}
        >
          <Check className="mr-0.5 h-3 w-3" />
          Approve
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-7 flex-1 text-xs",
            image.status === "rejected" &&
              "border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
          )}
          onClick={onReject}
          disabled={image.status === "rejected"}
        >
          <X className="mr-0.5 h-3 w-3" />
          Reject
        </Button>
      </div>
    </div>
  );
}

// Variant Group Builder Component
function VariantGroupBuilder({
  availableAttributes,
  onCreateGroup,
  existingGroupCount,
}: {
  availableAttributes: { name: string; values: string[] }[];
  onCreateGroup: (group: VariantGroup) => void;
  existingGroupCount: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<ProductVariant[]>([]);

  const handleAddVariant = (attribute: string, value: string) => {
    // Remove any existing variant with the same attribute
    const filtered = selectedVariants.filter((v) => v.attribute !== attribute);
    setSelectedVariants([...filtered, { attribute, value }]);
  };

  const handleRemoveVariant = (attribute: string) => {
    setSelectedVariants(selectedVariants.filter((v) => v.attribute !== attribute));
  };

  const handleCreate = () => {
    if (selectedVariants.length === 0) return;

    const groupName = selectedVariants
      .map((v) => `${v.value}`)
      .join(" / ");

    const newGroup: VariantGroup = {
      id: `group-${Date.now()}`,
      name: groupName,
      variants: selectedVariants,
      color: GROUP_COLORS[existingGroupCount % GROUP_COLORS.length],
    };

    onCreateGroup(newGroup);
    setSelectedVariants([]);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-1.5"
      >
        <Plus className="h-4 w-4" />
        Add Variant Group
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Create Variant Group</h4>
        <button
          onClick={() => {
            setIsOpen(false);
            setSelectedVariants([]);
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Attribute Selectors */}
      <div className="space-y-3">
        {availableAttributes.map((attr) => {
          const selected = selectedVariants.find((v) => v.attribute === attr.name);
          return (
            <div key={attr.name} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground capitalize">
                  {attr.name}
                </label>
                {selected && (
                  <button
                    onClick={() => handleRemoveVariant(attr.name)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {attr.values.map((value) => (
                  <button
                    key={value}
                    onClick={() => handleAddVariant(attr.name, value)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs transition-colors",
                      selected?.value === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Preview */}
      {selectedVariants.length > 0 && (
        <div className="flex items-center gap-2 rounded-md bg-secondary/50 px-3 py-2">
          <span className="text-xs text-muted-foreground">Group:</span>
          <span className="text-sm font-medium text-foreground">
            {selectedVariants.map((v) => v.value).join(" / ")}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={selectedVariants.length === 0}
          className="flex-1"
        >
          Create Group
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsOpen(false);
            setSelectedVariants([]);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

// Drop Zone for Variant Groups
function VariantDropZone({
  group,
  images,
  productName,
  isOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onDelete,
  onImagePreview,
  onApprove,
  onReject,
  draggingImageId,
  onDragStart,
  onDragEnd,
}: {
  group: VariantGroup;
  images: GeneratedImage[];
  productName: string;
  isOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDelete: () => void;
  onImagePreview: (image: GeneratedImage) => void;
  onApprove: (imageId: string) => void;
  onReject: (imageId: string) => void;
  draggingImageId: string | null;
  onDragStart: (imageId: string) => void;
  onDragEnd: () => void;
}) {
  const colorClasses = group.color || GROUP_COLORS[0];

  return (
    <div
      className={cn(
        "rounded-lg border-2 border-dashed p-3 transition-all min-w-[200px]",
        colorClasses,
        isOver && "border-solid scale-[1.02] shadow-lg"
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Group Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-foreground capitalize">{group.name}</h4>
          <Badge variant="secondary" className="text-xs">
            {images.length}
          </Badge>
        </div>
        <button
          onClick={onDelete}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Variant Tags */}
      <div className="mb-3 flex flex-wrap gap-1">
        {group.variants.map((v) => (
          <Badge key={`${v.attribute}-${v.value}`} variant="outline" className="text-xs capitalize">
            {v.attribute}: {v.value}
          </Badge>
        ))}
      </div>

      {/* Images */}
      {images.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border/50">
          <p className="text-xs text-muted-foreground">Drag images here</p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((image) => (
            <ImageThumbnail
              key={image.id}
              image={image}
              productName={productName}
              onPreview={() => onImagePreview(image)}
              onApprove={() => onApprove(image.id)}
              onReject={() => onReject(image.id)}
              isDragging={draggingImageId === image.id}
              onDragStart={() => onDragStart(image.id)}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductImageGenerator({
  productName,
  productSku,
  images,
  availableAttributes = [],
  variantGroups = [],
  onApprove,
  onReject,
  onImageAssign,
  onVariantGroupCreate,
  onVariantGroupDelete,
}: ProductImageGeneratorProps) {
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const [draggingImageId, setDraggingImageId] = useState<string | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);

  // Separate images into unassigned and grouped
  const unassignedImages = useMemo(
    () => images.filter((img) => !img.variantGroupId),
    [images]
  );

  const getImagesForGroup = useCallback(
    (groupId: string) => images.filter((img) => img.variantGroupId === groupId),
    [images]
  );

  const handleApprove = useCallback(
    (imageId: string) => {
      onApprove?.(imageId);
    },
    [onApprove]
  );

  const handleReject = useCallback(
    (imageId: string) => {
      onReject?.(imageId);
    },
    [onReject]
  );

  const handleDrop = useCallback(
    (groupId: string | null, e: React.DragEvent) => {
      e.preventDefault();
      const imageId = e.dataTransfer.getData("text/plain");
      if (imageId) {
        onImageAssign?.(imageId, groupId);
      }
      setDragOverGroupId(null);
      setDraggingImageId(null);
    },
    [onImageAssign]
  );

  const handleDragOver = useCallback((groupId: string | null, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverGroupId(groupId);
  }, []);

  const getStatusBadgeVariant = (status: GeneratedImage["status"]) => {
    switch (status) {
      case "approved":
        return "done";
      case "rejected":
        return "failed";
      default:
        return "pending";
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">{productName}</h2>
              <p className="text-sm text-muted-foreground">SKU: {productSku}</p>
            </div>

            {/* Variant Group Builder */}
            {availableAttributes.length > 0 && (
              <VariantGroupBuilder
                availableAttributes={availableAttributes}
                onCreateGroup={(group) => onVariantGroupCreate?.(group)}
                existingGroupCount={variantGroups.length}
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Unassigned Images Pool */}
          <div
            className={cn(
              "rounded-lg border-2 border-dashed border-border p-4 transition-all",
              dragOverGroupId === "unassigned" && "border-primary border-solid bg-primary/5"
            )}
            onDragOver={(e) => handleDragOver("unassigned", e)}
            onDragLeave={() => setDragOverGroupId(null)}
            onDrop={(e) => handleDrop(null, e)}
          >
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-sm font-medium text-foreground">Unassigned Images</h3>
              <Badge variant="secondary">{unassignedImages.length}</Badge>
            </div>

            {unassignedImages.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border/50">
                <p className="text-sm text-muted-foreground">
                  All images have been assigned to variant groups
                </p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {unassignedImages.map((image) => (
                  <ImageThumbnail
                    key={image.id}
                    image={image}
                    productName={productName}
                    onPreview={() => setPreviewImage(image)}
                    onApprove={() => handleApprove(image.id)}
                    onReject={() => handleReject(image.id)}
                    isDragging={draggingImageId === image.id}
                    onDragStart={() => setDraggingImageId(image.id)}
                    onDragEnd={() => setDraggingImageId(null)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Variant Group Drop Zones */}
          {variantGroups.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Variant Groups</h3>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {variantGroups.map((group) => (
                  <VariantDropZone
                    key={group.id}
                    group={group}
                    images={getImagesForGroup(group.id)}
                    productName={productName}
                    isOver={dragOverGroupId === group.id}
                    onDragOver={(e) => handleDragOver(group.id, e)}
                    onDragLeave={() => setDragOverGroupId(null)}
                    onDrop={(e) => handleDrop(group.id, e)}
                    onDelete={() => onVariantGroupDelete?.(group.id)}
                    onImagePreview={setPreviewImage}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    draggingImageId={draggingImageId}
                    onDragStart={setDraggingImageId}
                    onDragEnd={() => setDraggingImageId(null)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State for No Groups */}
          {variantGroups.length === 0 && availableAttributes.length > 0 && (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Create variant groups to organize images by product options like color, size, or material.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <div className="flex w-full items-center justify-between text-sm text-muted-foreground">
            <span>
              {images.length} image{images.length !== 1 ? "s" : ""} total
            </span>
            <span>
              {images.filter((i) => i.status === "approved").length} approved,{" "}
              {images.filter((i) => i.status === "rejected").length} rejected
            </span>
          </div>
        </CardFooter>
      </Card>

      {/* Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-xl bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute right-2 top-2 z-10 flex gap-2">
              <Badge variant={getStatusBadgeVariant(previewImage.status)} className="capitalize">
                {previewImage.status}
              </Badge>
              <button
                onClick={() => setPreviewImage(null)}
                className="rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <img
              src={previewImage.url}
              alt={`Preview of generated image for ${productName}`}
              className="max-h-[80vh] max-w-full object-contain"
            />

            <div className="flex gap-2 border-t border-border p-4">
              <Button
                variant={previewImage.status === "approved" ? "success" : "outline"}
                className="flex-1"
                onClick={() => {
                  handleApprove(previewImage.id);
                  setPreviewImage(null);
                }}
                disabled={previewImage.status === "approved"}
              >
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "flex-1",
                  previewImage.status === "rejected" &&
                    "border-red-500/50 bg-red-500/10 text-red-400"
                )}
                onClick={() => {
                  handleReject(previewImage.id);
                  setPreviewImage(null);
                }}
                disabled={previewImage.status === "rejected"}
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
