
'use server';
/**
 * @fileOverview Analyzes recent meal nutrient data to identify trends or deficiencies.
 *
 * - analyzeNutrientTrends - A function that takes recent meal data and returns a textual insight.
 * - AnalyzeNutrientTrendsInput - The input type for the analyzeNutrientTrends function.
 * - AnalyzeNutrientTrendsOutput - The return type for the analyzeNutrientTrends function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { DetailedNutrients } from '@/types'; // Ensure this path is correct

// Define Zod schema for DetailedNutrient and DetailedNutrients if not already globally available
// For simplicity, assuming DetailedNutrients is an object of nutrient strings to objects with value and unit.
// A more robust solution would use a shared Zod schema definition.
const ZodDetailedNutrientSchema = z.object({
  value: z.number(),
  unit: z.string(),
  rdaPercentage: z.number().optional(),
});
const ZodDetailedNutrientsSchema = z.record(z.string(), ZodDetailedNutrientSchema);


const MealNutrientDataSchema = z.object({
  description: z.string().optional().describe("Description of the meal."),
  calories: z.number().describe("Calories in the meal."),
  protein: z.number().describe("Protein in grams."),
  carbs: z.number().describe("Carbohydrates in grams."),
  fat: z.number().describe("Fats in grams."),
  detailedNutrients: ZodDetailedNutrientsSchema.optional().describe("Detailed micronutrient breakdown of the meal."),
  date: z.string().describe("Date of the meal (ISO string).")
});
export type MealNutrientData = z.infer<typeof MealNutrientDataSchema>;

const AnalyzeNutrientTrendsInputSchema = z.object({
  recentMeals: z.array(MealNutrientDataSchema).describe("An array of recent meal entries with their nutrient data, typically for the last 7 days."),
  userHealthGoals: z.array(z.string()).optional().describe("User's stated health goals, e.g., 'Lose Weight', 'Gain Muscle'.")
});
export type AnalyzeNutrientTrendsInput = z.infer<typeof AnalyzeNutrientTrendsInputSchema>;

const AnalyzeNutrientTrendsOutputSchema = z.object({
  trendInsight: z.string().describe('A concise textual insight about nutrient trends or potential deficiencies based on the provided meal data and health goals. E.g., "Your fiber intake appears low this week based on your meals. Consider adding more fruits and vegetables." or "Good job on maintaining consistent protein intake, which aligns with your muscle gain goal!"'),
});
export type AnalyzeNutrientTrendsOutput = z.infer<typeof AnalyzeNutrientTrendsOutputSchema>;

export async function analyzeNutrientTrends(input: AnalyzeNutrientTrendsInput): Promise<AnalyzeNutrientTrendsOutput> {
  // Basic validation: if no meals, return a generic message
  if (!input.recentMeals || input.recentMeals.length === 0) {
    return { trendInsight: "Not enough meal data to analyze nutrient trends yet. Keep logging your meals!" };
  }
  // Ensure at least a few meals with detailed nutrients are present.
  const mealsWithNutrients = input.recentMeals.filter(meal => meal.detailedNutrients && Object.keys(meal.detailedNutrients).length > 0);
  if (mealsWithNutrients.length < 2) { // Require at least 2 meals with details for a meaningful trend
    return { trendInsight: "Log a few more meals with detailed nutrient analysis to get trends."}
  }

  return analyzeNutrientTrendsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeNutrientTrendsPrompt',
  input: {schema: AnalyzeNutrientTrendsInputSchema},
  output: {schema: AnalyzeNutrientTrendsOutputSchema},
  prompt: `You are a nutritional analyst. Based on the following recent meals logged by the user over the past few days, and their health goals (if provided), identify one key nutrient trend or a potential area for improvement.
Focus on common micronutrients like fiber, iron, vitamin D, calcium if data is available in 'detailedNutrients'.
Also consider macronutrient balance in relation to their goals.

User's Health Goals: {{#if userHealthGoals}} {{#each userHealthGoals}} - {{{this}}} {{/each}} {{else}} Not specified {{/if}}

Recent Meals:
{{#each recentMeals}}
- Meal on {{date}}: {{description}}
  Calories: {{calories}}kcal
  Macros: P:{{protein}}g, C:{{carbs}}g, F:{{fat}}g
  {{#if detailedNutrients}}
  Detailed Nutrients:
    {{#each detailedNutrients}}
    - {{@key}}: {{this.value}}{{this.unit}} {{#if this.rdaPercentage}}({{this.rdaPercentage}}% RDA){{/if}}
    {{/each}}
  {{/if}}
{{/each}}

Provide a single, concise, actionable insight (1-2 sentences). For example: "Your fiber intake appears consistently low this week; try incorporating more whole grains and vegetables." or "Your protein intake is strong, supporting your muscle gain goal. Ensure you're also getting enough healthy fats."
Avoid generic advice if data is insufficient. State if more data is needed for specific advice.
`,
});

const analyzeNutrientTrendsFlow = ai.defineFlow(
  {
    name: 'analyzeNutrientTrendsFlow',
    inputSchema: AnalyzeNutrientTrendsInputSchema,
    outputSchema: AnalyzeNutrientTrendsOutputSchema,
  },
  async (input: AnalyzeNutrientTrendsInput) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI analysis did not return an output for nutrient trends.");
    }
    return output;
  }
);
