import { fetchProductSegmentPrice, fetchProduct } from "@/lib/data/products";
import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { cacheLife, cacheTag } from "next/cache";

export async function generateMetadata({ params }: PageProps<'/product/[sku]'>): Promise<Metadata> {
    const { sku } = await params;
    const product = await fetchProduct(sku);
    return {
        title: product?.seoContent.metaTitle || `Product ${sku}`,
        description: product?.seoContent.metaDescription || "",
    }
}

async function ProductPrice({ params, searchParams }: { params: Promise<{ sku: string }>; searchParams: Promise<{ userSegment?: string }> }) {
    await connection();
    const { sku } = await params;
    const { userSegment } = await searchParams;
    const price = await fetchProductSegmentPrice(sku, userSegment);
    return <span className="text-lg font-semibold">${price.toFixed(2)}</span>;
}

async function ProductDetails({ params }: { params: Promise<{ sku: string }> }) {
    "use cache";
    const { sku } = await params;
    cacheLife({ revalidate: 600 });
    cacheTag(`product-${sku}`);
    const product = await fetchProduct(sku);
    return (
        <>
            <h1 className="text-2xl font-bold mb-4">{product?.name}</h1>
            <p>{product?.content.longDescription}</p>
        </>
    );
}

export default async function ProductPage(props: PageProps<"/product/[sku]">) {
    return (
        <div className="p-4">
            <Suspense fallback={<div className="animate-pulse h-20 bg-muted rounded" />}>
                <ProductDetails params={props.params} />
            </Suspense>
            <Suspense fallback={<span className="text-lg font-semibold">Loading price...</span>}>
                <ProductPrice params={props.params} searchParams={props.searchParams} />
            </Suspense>
        </div>
    );
}