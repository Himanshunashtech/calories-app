
// src/ai/flows/analyze-food-photo.ts
'use server';

/**
 * @fileOverview Analyzes a photo of food to estimate calorie count and detailed nutritional information.
 *
 * - analyzeFoodPhoto - A function that handles the food photo analysis process.
 * - AnalyzeFoodPhotoInput - The input type for the analyzeFoodPhoto function.
 * - AnalyzeFoodPhotoOutput - The return type for the analyzeFoodPhoto function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeFoodPhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeFoodPhotoInput = z.infer<typeof AnalyzeFoodPhotoInputSchema>;

const DetailedNutrientSchema = z.object({
  value: z.number().describe('The estimated value of the nutrient.'),
  unit: z.string().describe('The unit for the nutrient value (e.g., "g", "mg", "mcg").'),
  rdaPercentage: z.number().optional().describe('Optional: Estimated percentage of Recommended Daily Allowance (RDA).')
});

const DetailedNutrientsSchema = z.object({
  iron: DetailedNutrientSchema.optional().describe("Estimated iron content."),
  vitaminD: DetailedNutrientSchema.optional().describe("Estimated Vitamin D content."),
  fiber: DetailedNutrientSchema.optional().describe("Estimated fiber content."),
  calcium: DetailedNutrientSchema.optional().describe("Estimated calcium content."),
  vitaminC: DetailedNutrientSchema.optional().describe("Estimated Vitamin C content."),
  potassium: DetailedNutrientSchema.optional().describe("Estimated potassium content."),
  // Add more common nutrients as needed
}).describe("A detailed breakdown of key micronutrients.");


const AnalyzeFoodPhotoOutputSchema = z.object({
  estimatedCalories: z
    .number()
    .describe('The estimated calorie count of the meal.'),
  nutritionalInformation: z.string().describe('A general textual summary of the nutritional information of the meal.'),
  detailedNutrients: DetailedNutrientsSchema,
});
export type AnalyzeFoodPhotoOutput = z.infer<typeof AnalyzeFoodPhotoOutputSchema>;

export async function analyzeFoodPhoto(input: AnalyzeFoodPhotoInput): Promise<AnalyzeFoodPhotoOutput> {
  return analyzeFoodPhotoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeFoodPhotoPrompt',
  input: {schema: AnalyzeFoodPhotoInputSchema},
  output: {schema: AnalyzeFoodPhotoOutputSchema},
  prompt: `Analyze the provided photo of a meal.
Photo: {{media url=photoDataUri}}

Respond with:
1. The estimated calorie count as a number.
2. A general textual summary of the meal's nutritional profile.
3. A detailed breakdown of key micronutrients. For each nutrient (like Iron, Vitamin D, Fiber, Calcium, Vitamin C, Potassium), provide its estimated value and unit (e.g., mg, g). If possible, also estimate its percentage of Recommended Daily Allowance (RDA), but this is optional.
`,
});

const analyzeFoodPhotoFlow = ai.defineFlow(
  {
    name: 'analyzeFoodPhotoFlow',
    inputSchema: AnalyzeFoodPhotoInputSchema,
    outputSchema: AnalyzeFoodPhotoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI analysis did not return an output for food photo.");
    }
    return output;
  }
);
