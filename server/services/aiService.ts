import type { AIRecommendation, NormalizedItem } from "../entities";
import { createLlmClient } from "./llmClient";

function pickBestOverall(items: NormalizedItem[]) {
  return [...items].sort((a, b) => {
    const ar = a.rating ?? 0;
    const br = b.rating ?? 0;
    if (br !== ar) return br - ar;
    return a.finalPrice.amount - b.finalPrice.amount;
  })[0];
}

function pickBestValue(items: NormalizedItem[]) {
  return [...items].sort((a, b) => a.finalPrice.amount - b.finalPrice.amount)[0];
}

export class AIService {
  private llm = createLlmClient();

  async generateRecommendation(query: string, items: NormalizedItem[]): Promise<AIRecommendation> {
    const bestOverall = items.length > 0 ? pickBestOverall(items) : undefined;
    const bestValue = items.length > 0 ? pickBestValue(items) : undefined;

    const baseline: AIRecommendation = {
      bestOverall,
      bestValue,
      recommendations: items.slice(0, 5).map((item, idx) => ({
        item,
        reason: idx === 0 ? "Strong overall match for your query" : "Good alternative option",
        confidence: Math.max(0.55, 0.92 - idx * 0.08),
      })),
      comparisonInsights: items.length > 1 ? ["Compare final price, rating, and delivery ETA"] : [],
    };

    const system = "You are a commerce decision engine. Return JSON only.";
    const user = JSON.stringify({
      query,
      items: items.slice(0, 8).map((i) => ({
        id: i.id,
        name: i.name,
        provider: i.provider,
        finalPrice: i.finalPrice.amount,
        rating: i.rating,
        offersApplied: i.offersApplied?.map((o) => ({ type: o.type, label: o.label, code: o.code })),
      })),
    });

    try {
      const llmOut = await this.llm.completeJson<{
        reviewSummary?: string;
        comparisonInsights?: string[];
        recommendations?: Array<{ id: string; reason: string; confidence: number }>;
      }>({ system, user });

      const byId = new Map(items.map((i) => [i.id, i]));
      const llmRecs = (llmOut.data.recommendations || [])
        .map((r) => {
          const item = byId.get(r.id);
          if (!item) return null;
          return {
            item,
            reason: r.reason,
            confidence: Math.max(0, Math.min(1, r.confidence)),
          };
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x));

      return {
        ...baseline,
        reviewSummary: llmOut.data.reviewSummary ?? baseline.reviewSummary,
        comparisonInsights: llmOut.data.comparisonInsights ?? baseline.comparisonInsights,
        recommendations: llmRecs.length > 0 ? llmRecs : baseline.recommendations,
      };
    } catch {
      return baseline;
    }
  }
}

export const aiService = new AIService();

