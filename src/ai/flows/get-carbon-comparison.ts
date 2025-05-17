
'use server';
/**
 * @fileOverview Compares the user's diet carbon footprint to a general regional average.
 *
 * - getCarbonComparison - A function that returns the comparison.
 * - GetCarbonComparisonInput - The input type.
 * - GetCarbonComparisonOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MealCarbonDataSchema = z.object({
    description: z.string().optional().describe("Description of the meal."),
    carbonFootprintEstimate: z.number().optional().describe("Estimated carbon footprint in kg CO2e."),
    date: z.string().describe("Date of the meal (ISO string).")
});

const GetCarbonComparisonInputSchema = z.object({
  userMeals: z.array(MealCarbonDataSchema).describe("An array of the user's recent meal entries, each containing an estimated carbon footprint."),
  // User location could be added here for more specific regional averages, but for now, we'll use a general one.
});
export type GetCarbonComparisonInput = z.infer<typeof GetCarbonComparisonInputSchema>;

const GetCarbonComparisonOutputSchema = z.object({
  comparisonText: z.string().describe("A textual comparison, e.g., 'Your average daily meal carbon footprint is Y kg CO2e, which is Z% lower than the general average.'"),
  userAverageDailyCF: z.number().describe("User's average daily carbon footprint from meals in kg CO2e."),
  generalAverageDailyCF: z.number().describe("A general average daily carbon footprint for meals, provided by the AI (e.g., 2.5 kg CO2e)."),
});
export type GetCarbonComparisonOutput = z.infer<typeof GetCarbonComparisonOutputSchema>;

export async function getCarbonComparison(input: GetCarbonComparisonInput): Promise<GetCarbonComparisonOutput> {
  if (!input.userMeals || input.userMeals.length === 0) {
    return {
        comparisonText: "Not enough meal data with carbon footprint estimates to make a comparison. Keep logging your meals with EcoPro!",
        userAverageDailyCF: 0,
        generalAverageDailyCF: 2.5 // Default general average
    }
  }
  const mealsWithCF = input.userMeals.filter(m => typeof m.carbonFootprintEstimate === 'number');
  if (mealsWithCF.length < 3) { // Require a few meals for a meaningful average
     return {
        comparisonText: "Log a few more meals with carbon footprint estimates to see your comparison.",
        userAverageDailyCF: 0,
        generalAverageDailyCF: 2.5
    }
  }
  return getCarbonComparisonFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getCarbonComparisonPrompt',
  input: {schema: GetCarbonComparisonInputSchema},
  output: {schema: GetCarbonComparisonOutputSchema},
  prompt: `You are an environmental impact analyst.
The user has provided a list of their recent meals with estimated carbon footprints (in kg CO2e).
Calculate the user's average daily carbon footprint based on these meals. Assume the provided meals cover a representative period (e.g., a few days to a week).
Then, compare this to a general average daily carbon footprint for meals in a typical developed country (e.g., you can assume a general average like 2.0 to 3.0 kg CO2e per person per day from food, pick a value you deem representative).

User's Meals:
{{#each userMeals}}
{{#if this.carbonFootprintEstimate}}
- Meal on {{this.date}}: {{this.description | default:"A meal"}} - Carbon Footprint: {{this.carbonFootprintEstimate}} kg CO2e
{{/if}}
{{/each}}

Based on this:
1. Calculate and state the user's average daily carbon footprint.
2. State the general average daily carbon footprint you are using for comparison.
3. Provide a comparison text, including the percentage difference. Example: "Your average daily meal carbon footprint is X kg CO2e, which is Y% lower/higher than our general estimate of Z kg CO2e for daily food consumption."

If there are very few meals or carbon footprints are missing, state that more data is needed.
`,
});

const getCarbonComparisonFlow = ai.defineFlow(
  {
    name: 'getCarbonComparisonFlow',
    inputSchema: GetCarbonComparisonInputSchema,
    outputSchema: GetCarbonComparisonOutputSchema,
  },
  async (input: GetCarbonComparisonInput) => {
    // Pre-calculate user's average daily CF to pass to the prompt for verification or if LLM struggles.
    // This is a bit complex as it depends on how many days the meals span.
    // For simplicity here, we'll let the LLM do the primary calculation based on the list.
    // In a real app, you'd normalize this by days.

    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI did not return carbon comparison data.");
    }
    return output;
  }
);
