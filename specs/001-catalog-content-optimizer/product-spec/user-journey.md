# User Journey: Catalog Content Optimization

> Feature: catalog-content-optimizer | Persona: Catalog Operator (Casey)
> Related: [Product Spec](./product-spec.md) | [Wireframes](./wireframes/)

## Journey A: Bulk Product Description Generation

### Journey Map

| Step | User Action | System Response | Emotion | Notes |
|------|-------------|-----------------|---------|-------|
| 1 | Opens the app | Chat interface loads with welcome message | 😊 Neutral | Single-page app |
| 2 | Types "Optimize descriptions for the electronics category" | Agent acknowledges, calls `get_products` with category filter | 😊 Hopeful | Natural language intent |
| 3 | Waits briefly | Agent calls `get_brand_voice`, then begins `generate_descriptions` | 😐 Waiting | Progress indicator shows |
| 4 | Watches table appear | Bulk edit table renders inline in chat as data part. Rows show products with "Pending" badges | 😊 Engaged | Table appears as items are found |
| 5 | Watches progress | Status badges flip Pending → InProgress → Done one by one as each item completes | 😊 Satisfied | Real-time per-item streaming |
| 6 | Clicks a product row | Row expands to show current (left) vs. proposed (right) descriptions | 😊 Informed | Side-by-side comparison |
| 7 | Edits a proposed description | Textarea updates with user's changes | 😊 In control | Local state, not saved yet |
| 8 | Scrolls through all items | Reviews remaining items, some expanded, some collapsed | 😐 Thorough | Can open multiple rows |
| 9 | Clicks "Approve" button | Agent calls `save_products` with approved content. Confirmation message appears in chat | 😊 Accomplished | HITL gate passed |

### Alternative Paths

**Path B: Follow-up refinement**

| Step | User Action | System Response |
|------|-------------|-----------------|
| 5b | After seeing results, types "Make these more casual and add emoji" | Agent processes follow-up in same session |
| 6b | New generation cycle begins | Table updates with revised proposals, status resets to Pending → Done |
| 7b | Reviews updated content | Continues from Step 6 above |

**Path C: SEO generation**

| Step | User Action | System Response |
|------|-------------|-----------------|
| 2c | Types "Generate SEO data for all products" | Agent calls `get_products`, then `generate_seo_data` |
| 5c | Table shows SEO fields | Expanded rows show metaTitle and metaDescription columns |

**Path D: Category optimization**

| Step | User Action | System Response |
|------|-------------|-----------------|
| 2d | Types "Optimize the Sports category description" | Agent calls `get_categories`, then `generate_descriptions` |
| 5d | Table shows category rows | entityType switches labels to "Catalog" instead of "Category" |

### Error Scenarios

| Scenario | System Behavior | Recovery |
|----------|----------------|----------|
| Product generation fails (LLM error) | Item shows error badge in table, retry attempted up to 2x | If all retries fail, item stays "Failed". User can ask agent to retry. |
| Network disconnect during generation | Workflow continues server-side (durable) | User refreshes, reconnects via workflow URL, sees current progress |
| No products found in category | Agent responds with "No products found in that category" text message | User tries different category or checks data |
| Brand voice not configured | Agent responds with default "professional" voice and notes it | User can ask to change voice |

### Journey Metrics

- **Entry point:** App load → chat interface
- **Exit point:** "Approve" button clicked → save confirmation
- **Expected completion time:** 2-5 minutes for 20 products
  (generation ~3-5s per item, review ~1-2 min, approve ~5s)
- **Drop-off risk points:**
  - Step 3: Long wait for large batches (mitigated by streaming progress)
  - Step 7: Tedious review for many items (mitigated by expandable rows)

---

## Journey B: Workflow Reconnection

| Step | User Action | System Response | Notes |
|------|-------------|-----------------|-------|
| 1 | Navigates to workflow URL (bookmarked or shared) | App loads, connects to existing workflow run | URL contains workflow run ID |
| 2 | Sees current state | Table shows mix of Done/InProgress/Pending items | Stream reconnection from last index |
| 3 | Continues from current state | Same as Journey A from Step 6 onward | Seamless resume |
