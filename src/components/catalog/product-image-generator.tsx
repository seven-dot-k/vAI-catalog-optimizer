"use client";

import { useState, useCallback } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ZoomIn, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeneratedImage, ProductVariant } from "@/lib/schemas/product-image";

interface ProductImageGeneratorProps {
  productName: string;
  productSku: string;
  images: GeneratedImage[];
  variant?: ProductVariant;
  availableVariants?: ProductVariant[];
  onApprove?: (imageId: string) => void;
  onReject?: (imageId: string) => void;
  onVariantChange?: (variant: ProductVariant | undefined) => void;
}

export function ProductImageGenerator({
  productName,
  productSku,
  images,
  variant,
  availableVariants = [],
  onApprove,
  onReject,
  onVariantChange,
}: ProductImageGeneratorProps) {
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const [isVariantDropdownOpen, setIsVariantDropdownOpen] = useState(false);

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

  const handleVariantSelect = useCallback(
    (selectedVariant: ProductVariant | undefined) => {
      onVariantChange?.(selectedVariant);
      setIsVariantDropdownOpen(false);
    },
    [onVariantChange]
  );

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
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">{productName}</h2>
              <p className="text-sm text-muted-foreground">SKU: {productSku}</p>
            </div>

            {/* Variant Selector */}
            {availableVariants.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setIsVariantDropdownOpen(!isVariantDropdownOpen)}
                  className="flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
                >
                  {variant ? (
                    <span>
                      <span className="text-muted-foreground capitalize">{variant.attribute}:</span>{" "}
                      <span className="font-medium capitalize">{variant.value}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">All Variants</span>
                  )}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isVariantDropdownOpen && "rotate-180"
                    )}
                  />
                </button>

                {isVariantDropdownOpen && (
                  <div className="absolute right-0 top-full z-10 mt-1 min-w-[180px] rounded-md border border-border bg-card p-1 shadow-lg">
                    <button
                      onClick={() => handleVariantSelect(undefined)}
                      className={cn(
                        "w-full rounded px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                        !variant && "bg-accent"
                      )}
                    >
                      All Variants
                    </button>
                    {availableVariants.map((v, index) => (
                      <button
                        key={`${v.attribute}-${v.value}-${index}`}
                        onClick={() => handleVariantSelect(v)}
                        className={cn(
                          "w-full rounded px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                          variant?.attribute === v.attribute &&
                            variant?.value === v.value &&
                            "bg-accent"
                        )}
                      >
                        <span className="text-muted-foreground capitalize">{v.attribute}:</span>{" "}
                        <span className="capitalize">{v.value}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {variant && (
            <div className="mt-2">
              <Badge variant="default" className="capitalize">
                {variant.attribute}: {variant.value}
              </Badge>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-4">
          {images.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border">
              <p className="text-sm text-muted-foreground">No images generated yet</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="group relative flex-shrink-0"
                >
                  {/* Thumbnail Container */}
                  <div
                    className={cn(
                      "relative h-40 w-40 cursor-pointer overflow-hidden rounded-lg border-2 transition-all",
                      image.status === "approved" && "border-green-500",
                      image.status === "rejected" && "border-red-500/50 opacity-60",
                      image.status === "pending" && "border-border hover:border-muted-foreground"
                    )}
                    onClick={() => setPreviewImage(image)}
                  >
                    <img
                      src={image.url}
                      alt={`Generated image for ${productName}`}
                      className="h-full w-full object-cover"
                    />
                    
                    {/* Zoom Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                      <ZoomIn className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>

                    {/* Status Badge */}
                    <div className="absolute left-2 top-2">
                      <Badge variant={getStatusBadgeVariant(image.status)} className="capitalize">
                        {image.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant={image.status === "approved" ? "success" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => handleApprove(image.id)}
                      disabled={image.status === "approved"}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "flex-1",
                        image.status === "rejected" &&
                          "border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                      )}
                      onClick={() => handleReject(image.id)}
                      disabled={image.status === "rejected"}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter>
          <div className="flex w-full items-center justify-between text-sm text-muted-foreground">
            <span>{images.length} image{images.length !== 1 ? "s" : ""} generated</span>
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
