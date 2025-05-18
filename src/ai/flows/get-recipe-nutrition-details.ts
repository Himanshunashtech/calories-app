
'use server';
/**
 * @fileOverview Analyzes a recipe's text to estimate calorie count and detailed nutritional information.
 *
 * - getRecipeNutritionDetails - A function that handles the recipe text analysis process.
 * - GetRecipeNutritionDetailsInput - The input type.
 * - GetRecipeNutritionDetailsOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { DetailedNutrients } from '@/types'; // Ensure this path is correct

const GetRecipeNutritionDetailsInputSchema = z.object({
  recipeName: z.string().describe("The name of the recipe."),
  ingredients: z.array(z.string()).min(1).describe("A list of ingredients for the recipe. Each ingredient should be a string, e.g., ['1 cup flour', '2 eggs', '100g chocolate chips']."),
  instructions: z.array(z.string()).optional().describe("The cooking instructions for the recipe. Each step should be a string."),
  servings: z.number().min(1).optional().default(1).describe("The number of servings the recipe makes. Defaults to 1 if not provided. The nutritional information should be per serving.")
});
export type GetRecipeNutritionDetailsInput = z.infer<typeof GetRecipeNutritionDetailsInputSchema>;

// Re-using DetailedNutrientSchema and DetailedNutrientsSchema from analyze-food-photo.ts or defining them here
const DetailedNutrientSchema = z.object({
  value: z.number().describe('The estimated value of the nutrient per serving.'),
  unit: z.string().describe('The unit for the nutrient value (e.g., "g", "mg", "mcg").'),
  rdaPercentage: z.number().optional().describe('Optional: Estimated percentage of Recommended Daily Allowance (RDA) per serving.')
});

const DetailedNutrientsOutputSchema = z.object({
  iron: DetailedNutrientSchema.optional().describe("Estimated iron content per serving."),
  vitaminD: DetailedNutrientSchema.optional().describe("Estimated Vitamin D content per serving."),
  fiber: DetailedNutrientSchema.optional().describe("Estimated fiber content per serving."),
  calcium: DetailedNutrientSchema.optional().describe("Estimated calcium content per serving."),
  vitaminC: DetailedNutrientSchema.optional().describe("Estimated Vitamin C content per serving."),
  potassium: DetailedNutrientSchema.optional().describe("Estimated potassium content per serving."),
  // Add more common nutrients as needed
}).describe("A detailed breakdown of key micronutrients per serving.");


const GetRecipeNutritionDetailsOutputSchema = z.object({
  estimatedCalories: z.number().describe('The estimated calorie count per serving.'),
  protein: z.number().describe('The estimated protein in grams per serving.'),
  carbs: z.number().describe('The estimated carbohydrates in grams per serving.'),
  fat: z.number().describe('The estimated fat in grams per serving.'),
  detailedNutrients: DetailedNutrientsOutputSchema.describe("Detailed micronutrient breakdown per serving."),
  generalSummary: z.string().describe('A general textual summary of the recipe\'s nutritional profile per serving.'),
});
export type GetRecipeNutritionDetailsOutput = z.infer<typeof GetRecipeNutritionDetailsOutputSchema>;

export async function getRecipeNutritionDetails(input: GetRecipeNutritionDetailsInput): Promise<GetRecipeNutritionDetailsOutput> {
  return getRecipeNutritionDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getRecipeNutritionDetailsPrompt',
  input: {schema: GetRecipeNutritionDetailsInputSchema},
  output: {schema: GetRecipeNutritionDetailsOutputSchema},
  prompt: `Analyze the provided recipe details to estimate its nutritional content per serving.
Recipe Name: {{{recipeName}}}
Servings: {{{servings}}}

Ingredients:
{{#each ingredients}}
- {{{this}}}
{{/each}}

{{#if instructions}}
Instructions:
{{#each instructions}}
- {{{this}}}
{{/each}}
{{/if}}

Based on these details, provide the following nutritional information *per serving*:
1. Estimated total calories (number).
2. Estimated protein in grams (number).
3. Estimated carbohydrates in grams (number).
4. Estimated fat in grams (number).
5. A detailed breakdown of key micronutrients (Iron, Vitamin D, Fiber, Calcium, Vitamin C, Potassium), including value and unit. If possible, include RDA percentage, but it's optional.
6. A general textual summary of the recipe's nutritional profile.

Assume standard portion sizes and preparation methods if not explicitly stated. Focus on accuracy based on the provided ingredients.
`,
});

const getRecipeNutritionDetailsFlow = ai.defineFlow(
  {
    name: 'getRecipeNutritionDetailsFlow',
    inputSchema: GetRecipeNutritionDetailsInputSchema,
    outputSchema: GetRecipeNutritionDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI analysis did not return an output for recipe nutrition details.");
    }
    return output;
  }
);
