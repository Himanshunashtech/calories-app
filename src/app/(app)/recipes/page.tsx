
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Utensils, Search, Filter, Leaf, Sparkles, ArrowRight, ChefHat, BarChartHorizontalBig } from 'lucide-react';
import { getSelectedPlan, type UserPlan, getUserProfile, type UserProfile } from '@/lib/localStorage';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Placeholder recipe data
const placeholderRecipes = [
  { id: '1', name: 'Quinoa Salad with Roasted Vegetables', description: 'A light and healthy salad, perfect for lunch.', ecoScore: 'A', dietTags: ['vegan', 'gluten-free'], image: 'https://placehold.co/300x200.png?text=Quinoa+Salad', dataAiHint: 'salad healthy', prepTime: '15 mins', cookTime: '25 mins', servings: 2, ingredients: ['1 cup quinoa', '1 bell pepper', '1 zucchini', '1 red onion', '2 tbsp olive oil', 'Salt & pepper', 'Lemon juice'], instructions: ['Cook quinoa.', 'Chop & roast veggies.', 'Combine and dress.'] },
  { id: '2', name: 'Lentil Soup', description: 'Hearty and nutritious lentil soup.', ecoScore: 'A', dietTags: ['vegan', 'vegetarian'], image: 'https://placehold.co/300x200.png?text=Lentil+Soup', dataAiHint: 'soup lentil', prepTime: '10 mins', cookTime: '40 mins', servings: 4, ingredients: ['1 cup lentils', '1 onion', '2 carrots', '4 cups broth'], instructions: ['Sauté veggies.', 'Add lentils & broth.', 'Simmer.'] },
  { id: '3', name: 'Baked Salmon with Asparagus', description: 'Delicious and omega-3 rich baked salmon.', ecoScore: 'B', dietTags: ['pescatarian', 'fish'], image: 'https://placehold.co/300x200.png?text=Baked+Salmon', dataAiHint: 'salmon fish', prepTime: '10 mins', cookTime: '15 mins', servings: 2, ingredients: ['2 salmon fillets', 'Asparagus', 'Olive oil'], instructions: ['Season.', 'Bake.'] },
  { id: '4', name: 'Mushroom Risotto', description: 'Creamy and comforting mushroom risotto.', ecoScore: 'B', dietTags: ['vegetarian', 'gluten-free'], image: 'https://placehold.co/300x200.png?text=Mushroom+Risotto', dataAiHint: 'risotto mushroom', prepTime: '15 mins', cookTime: '30 mins', servings: 3, ingredients:['Arborio rice', 'Mushrooms', 'Broth', 'Parmesan', 'Dairy'], instructions:['Toast rice.', 'Add broth slowly.', 'Stir in mushrooms.'] },
  { id: '5', name: 'Chickpea Curry', description: 'Flavorful and satisfying chickpea curry.', ecoScore: 'A', dietTags: ['vegan', 'vegetarian'], image: 'https://placehold.co/300x200.png?text=Chickpea+Curry', dataAiHint: 'curry chickpea', prepTime: '10 mins', cookTime: '25 mins', servings: 4, ingredients:['Chickpeas', 'Coconut milk', 'Spices', 'Onion'], instructions:['Sauté onion.', 'Add spices & chickpeas.', 'Simmer in coconut milk.'] },
];

const premiumRecipes = [
    ...placeholderRecipes,
    { id: '6', name: 'Avocado Toast Deluxe', description: 'Classic avocado toast with a twist.', ecoScore: 'A', dietTags: ['vegetarian', 'vegan'], image: 'https://placehold.co/300x200.png?text=Avocado+Toast', dataAiHint: 'avocado toast', prepTime: '5 mins', cookTime: '5 mins', servings: 1, ingredients:['Bread', 'Avocado', 'Everything bagel seasoning', 'Gluten'], instructions:['Toast bread.', 'Mash avocado.', 'Season.'] },
    { id: '7', name: 'Beyond Burger Bowl', description: 'A plant-based burger experience in a bowl.', ecoScore: 'B', dietTags: ['vegan'], image: 'https://placehold.co/300x200.png?text=Burger+Bowl', dataAiHint: 'burger plant-based', prepTime: '15 mins', cookTime: '10 mins', servings: 2, ingredients:['Beyond Meat patty', 'Quinoa', 'Greens', 'Favorite toppings'], instructions:['Cook patty.', 'Assemble bowl.'] },
    { id: '8', name: 'Keto Chicken Stir-fry', description: 'Low-carb and high-protein chicken stir-fry.', ecoScore: 'C', dietTags: ['keto'], image: 'https://placehold.co/300x200.png?text=Keto+Stirfry', dataAiHint: 'keto chicken', prepTime: '15 mins', cookTime: '15 mins', servings: 2, ingredients:['Chicken breast', 'Broccoli', 'Soy sauce', 'Sesame oil', 'Soy'], instructions:['Stir-fry chicken.', 'Add broccoli.', 'Add sauce.'] },
    { id: '9', name: 'Vegan Tofu Scramble', description: 'A hearty and protein-packed breakfast alternative.', ecoScore: 'A', dietTags: ['vegan', 'gluten-free'], image: 'https://placehold.co/300x200.png?text=Tofu+Scramble', dataAiHint: 'tofu breakfast', prepTime: '5 mins', cookTime: '10 mins', servings: 2, ingredients:['Firm tofu', 'Nutritional yeast', 'Turmeric', 'Veggies', 'Soy'], instructions:['Crumble tofu.', 'Sauté veggies.', 'Combine and season.'] },
    { id: '10', name: 'Mediterranean Chickpea Salad', description: 'Refreshing and full of Mediterranean flavors.', ecoScore: 'A', dietTags: ['vegetarian', 'vegan', 'gluten-free'], image: 'https://placehold.co/300x200.png?text=Chickpea+Salad', dataAiHint: 'salad mediterranean', prepTime: '15 mins', cookTime: '0 mins', servings: 4, ingredients:['Chickpeas', 'Cucumber', 'Tomato', 'Olives', 'Lemon vinaigrette'], instructions:['Chop veggies.', 'Combine all.', 'Dress.'] },
];


export default function RecipesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dietFilter, setDietFilter] = useState('');
  const [ecoFilter, setEcoFilter] = useState('');
  const [userPlan, setUserPlan] = useState<UserPlan>('free');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    setIsClient(true);
    setUserPlan(getSelectedPlan());
    setUserProfile(getUserProfile());
  }, []);

  const availableRecipes = userPlan === 'free' ? placeholderRecipes.slice(0,5) : premiumRecipes;

  const filteredRecipes = availableRecipes.filter(recipe => {
    const searchMatch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        recipe.ingredients.join(' ').toLowerCase().includes(searchTerm.toLowerCase());
    
    const dietMatch = dietFilter === '' || recipe.dietTags.includes(dietFilter);
    const ecoMatch = ecoFilter === '' || recipe.ecoScore === ecoFilter;
    
    let restrictionMatch = true;
    if (userProfile?.appSettings?.hideNonCompliantRecipes && userProfile.dietaryRestrictions && userProfile.dietaryRestrictions.length > 0) {
      const recipeIngredientsString = recipe.ingredients.join(' ').toLowerCase();
      const recipeDietTagsString = recipe.dietTags.join(' ').toLowerCase();
      
      restrictionMatch = !userProfile.dietaryRestrictions.some(restriction => {
        const lowerRestriction = restriction.toLowerCase();
        return recipeIngredientsString.includes(lowerRestriction) || recipeDietTagsString.includes(lowerRestriction);
      });
    }

    return searchMatch && dietMatch && ecoMatch && restrictionMatch;
  });
  
  const handleSurpriseMe = () => {
    if (filteredRecipes.length > 0) {
        const randomIndex = Math.floor(Math.random() * filteredRecipes.length);
        const randomRecipeId = filteredRecipes[randomIndex].id;
        toast({
            title: "Bon Appétit!",
            description: `Opening recipe: ${filteredRecipes[randomIndex].name}`
        });
        // Assuming you have a router instance if not already available
        // import { useRouter } from 'next/navigation';
        // const router = useRouter();
        // router.push(`/app/recipes/${randomRecipeId}`);
        // For now, we'll just log it as router might not be in scope here without adding hook
        console.log(`Would navigate to /app/recipes/${randomRecipeId}`);
         window.location.href = `/app/recipes/${randomRecipeId}`; // Simple navigation for now
    } else {
        toast({
            title: "No Recipes Found",
            description: "Try adjusting your filters for more options!",
            variant: "default"
        });
    }
  }

  if (!isClient) {
    return (
       <div className="space-y-6 p-4">
        <Card className="shadow-lg"><CardHeader><div className="h-8 w-1/2 bg-muted rounded animate-pulse"></div></CardHeader><CardContent><div className="h-10 bg-muted rounded animate-pulse w-full"></div></CardContent></Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => ( <Card key={i} className="shadow-lg"><CardHeader><div className="h-40 bg-muted rounded animate-pulse"></div><div className="h-6 w-3/4 bg-muted rounded animate-pulse mt-2"></div></CardHeader><CardContent><div className="h-4 w-full bg-muted rounded animate-pulse"></div><div className="h-4 w-2/3 bg-muted rounded animate-pulse mt-1"></div></CardContent><CardFooter><div className="h-10 w-full bg-muted rounded animate-pulse"></div></CardFooter></Card> ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <ChefHat className="h-7 w-7 text-primary" />
            Eco-Friendly Recipes
          </CardTitle>
          <CardDescription>
            Discover delicious and sustainable meals. 
            {userPlan === 'free' && ` You're viewing 5 complimentary recipes. Upgrade to Pro or EcoPro for 50+ premium recipes!`}
            {userProfile?.appSettings?.hideNonCompliantRecipes && " Recipes that don't match your dietary restrictions are hidden."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search recipes, ingredients..."
                className="pl-8 sm:w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={dietFilter} onValueChange={setDietFilter}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Filter by Diet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Diets</SelectItem>
                <SelectItem value="vegan">Vegan</SelectItem>
                <SelectItem value="vegetarian">Vegetarian</SelectItem>
                <SelectItem value="pescatarian">Pescatarian</SelectItem>
                <SelectItem value="keto">Keto</SelectItem>
                <SelectItem value="gluten-free">Gluten-Free</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ecoFilter} onValueChange={setEcoFilter}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Filter by Eco-Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Eco-Scores</SelectItem>
                <SelectItem value="A">A (Very Low Impact)</SelectItem>
                <SelectItem value="B">B (Low Impact)</SelectItem>
                <SelectItem value="C">C (Moderate Impact)</SelectItem>
              </SelectContent>
            </Select>
             {(userPlan === 'pro' || userPlan === 'ecopro') && (
              <Button variant="outline" className="sm:w-auto" onClick={handleSurpriseMe} >
                <Sparkles className="mr-2 h-4 w-4" /> Surprise Me!
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map(recipe => (
            <Card key={recipe.id} className="flex flex-col overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out">
              <CardHeader className="p-0 relative">
                <Link href={`/app/recipes/${recipe.id}`} passHref>
                  <Image 
                    src={recipe.image} 
                    alt={recipe.name} 
                    width={300} 
                    height={200} 
                    className="w-full h-48 object-cover cursor-pointer"
                    data-ai-hint={recipe.dataAiHint} 
                  />
                </Link>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg mb-1 hover:text-primary transition-colors">
                    <Link href={`/app/recipes/${recipe.id}`}>{recipe.name}</Link>
                </CardTitle>
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <Badge variant={recipe.ecoScore === 'A' ? 'default' : 'secondary'} className={cn('text-xs', recipe.ecoScore === 'A' ? 'bg-green-600 hover:bg-green-700 text-white' : recipe.ecoScore === 'B' ? 'bg-yellow-500 text-yellow-foreground' : 'bg-orange-500 text-orange-foreground' )}>
                        <Leaf className="mr-1 h-3 w-3" /> Eco: {recipe.ecoScore}
                    </Badge>
                    {recipe.dietTags.map(tag => <Badge key={tag} variant="outline" className="capitalize text-xs">{tag}</Badge>)}
                </div>
                <CardDescription className="text-sm text-muted-foreground line-clamp-3">{recipe.description}</CardDescription>
              </CardContent>
              <CardFooter className="p-4 border-t">
                <Link href={`/app/recipes/${recipe.id}`} passHref legacyBehavior>
                  <Button className="w-full">View Recipe <ArrowRight className="ml-2 h-4 w-4"/></Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground text-lg">No recipes match your filters.</p>
            <p className="text-sm text-muted-foreground mt-1">Try broadening your search or adjusting the filters!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    