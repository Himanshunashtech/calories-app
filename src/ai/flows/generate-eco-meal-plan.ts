
'use server';
/**
 * @fileOverview Generates an eco-friendly meal plan based on user preferences.
 *
 * - generateEcoMealPlan - A function that returns a meal plan and grocery list.
 * - GenerateEcoMealPlanInput - The input type.
 * - GenerateEcoMealPlanOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UserProfileForMealPlanSchema = z.object({
    dietType: z.string().optional().describe("User's diet type, e.g., 'vegetarian', 'vegan', 'none', 'pescatarian'."),
    healthGoals: z.array(z.string()).optional().describe("User's health goals, e.g., ['Lose Weight', 'Eat Healthier']."),
    dietaryRestrictions: z.string().optional().describe("User's dietary restrictions or allergies, e.g., 'gluten-free', 'nut allergy'.")
});

const GenerateEcoMealPlanInputSchema = z.object({
  userProfile: UserProfileForMealPlanSchema.describe("The user's profile relevant to meal planning."),
  durationDays: z.number().min(1).max(7).default(3).describe("Number of days for the meal plan (e.g., 3 days)."),
});
export type GenerateEcoMealPlanInput = z.infer<typeof GenerateEcoMealPlanInputSchema>;

const MealSchema = z.object({
    name: z.string().describe("Name of the meal (e.g., 'Quinoa Salad with Roasted Vegetables')."),
    description: z.string().describe("A brief description of the meal and why it's suitable or eco-friendly."),
    lowCarbonScore: z.number().min(1).max(5).describe("A conceptual score from 1-5 indicating how low-carbon the meal is (5 being very low carbon).")
});

const DailyPlanSchema = z.object({
    day: z.string().describe("Label for the day (e.g., 'Day 1', 'Monday')."),
    meals: z.array(MealSchema).length(3).describe("An array of three meals: breakfast, lunch, and dinner.") // Forcing 3 meals
});

const GenerateEcoMealPlanOutputSchema = z.object({
  mealPlan: z.array(DailyPlanSchema).describe("An array of daily meal plans."),
  groceryList: z.array(z.string()).describe("A consolidated grocery list for the entire meal plan, suggesting local/seasonal ingredients where appropriate."),
  planTitle: z.string().optional().describe("A catchy title for the generated meal plan, e.g., 'Your 3-Day Low-Carbon Kickstart'.")
});
export type GenerateEcoMealPlanOutput = z.infer<typeof GenerateEcoMealPlanOutputSchema>;

export async function generateEcoMealPlan(input: GenerateEcoMealPlanInput): Promise<GenerateEcoMealPlanOutput> {
  return generateEcoMealPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEcoMealPlanPrompt',
  input: {schema: GenerateEcoMealPlanInputSchema},
  output: {schema: GenerateEcoMealPlanOutputSchema},
  prompt: `You are an expert nutritionist and eco-conscious meal planner.
Generate a low-carbon meal plan for {{durationDays}} days (provide breakfast, lunch, and dinner for each day).
The plan should be tailored to the user's profile:
- Diet Type: {{#if userProfile.dietType}}{{userProfile.dietType}}{{else}}Omnivore (no specific restriction){{/if}}
- Health Goals: {{#if userProfile.healthGoals}}{{#each userProfile.healthGoals}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}General well-being{{/if}}
- Dietary Restrictions/Allergies: {{#if userProfile.dietaryRestrictions}}{{userProfile.dietaryRestrictions}}{{else}}None specified{{/if}}

For each meal:
- Provide a name.
- Provide a brief description, highlighting eco-friendly aspects or suitability for the user.
- Assign a conceptual 'lowCarbonScore' (1-5, where 5 is extremely low carbon, 1 is relatively higher but still conscious). Base this on typical ingredients (e.g., plant-based meals score higher than red meat).

After the meal plan, create a consolidated grocery list for all {{durationDays}} days. Suggest local and seasonal ingredients where possible and appropriate.
Finally, give the meal plan a catchy title.

Ensure the meals are varied and nutritionally balanced for general health, considering the user's preferences.
Example meal structure for one day:
Day 1:
  - Breakfast: [Name], [Description], lowCarbonScore: [Score]
  - Lunch: [Name], [Description], lowCarbonScore: [Score]
  - Dinner: [Name], [Description], lowCarbonScore: [Score]
`,
});

const generateEcoMealPlanFlow = ai.defineFlow(
  {
    name: 'generateEcoMealPlanFlow',
    inputSchema: GenerateEcoMealPlanInputSchema,
    outputSchema: GenerateEcoMealPlanOutputSchema,
  },
  async (input: GenerateEcoMealPlanInput) => {
    const {output} = await prompt(input);
    if (!output || !output.mealPlan || output.mealPlan.length === 0) {
      throw new Error("AI did not return a valid meal plan.");
    }
    return output;
  }
);
