
'use client';

import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, Target, Salad, Coffee, CheckCircle, Leaf, Sparkles, Utensils, ShieldQuestion, HeartHandshake } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import type { OnboardingData } from '@/types';

const TOTAL_STEPS = 6; // Increased total steps

const defaultFormData: OnboardingData = {
  name: '',
  age: '',
  gender: '',
  height: '',
  heightUnit: 'cm',
  weight: '',
  weightUnit: 'kg',
  activityLevel: '',
  healthGoals: [],
  exerciseFrequency: '',
  dietType: '',
  dietaryRestrictions: '',
  favoriteCuisines: '',
  dislikedIngredients: '',
  enableCarbonTracking: false,
  sleepHours: '',
  stressLevel: '',
};

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>(defaultFormData);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({
        ...prev,
        healthGoals: checked
          ? [...prev.healthGoals, value]
          : prev.healthGoals.filter((goal) => goal !== value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSwitchChange = (name: keyof OnboardingData) => (checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (name: keyof OnboardingData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value as any }));
  };
  
  const handleRadioChange = (name: keyof OnboardingData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      // Basic validation for current step before proceeding
      if (currentStep === 1 && (!formData.name || !formData.age || !formData.gender || !formData.height || !formData.weight)) {
        toast({ variant: "destructive", title: "Missing fields", description: "Please fill in all personal details." });
        return;
      }
      if (currentStep === 2 && (!formData.activityLevel || formData.healthGoals.length === 0 || !formData.exerciseFrequency)) {
        toast({ variant: "destructive", title: "Missing fields", description: "Please complete all fields for goals and activity." });
        return;
      }
      if (currentStep === 3 && !formData.dietType) {
        toast({ variant: "destructive", title: "Missing fields", description: "Please select your diet type." });
        return;
      }
      if (currentStep === 4 && (!formData.sleepHours || !formData.stressLevel)) {
        toast({ variant: "destructive", title: "Missing fields", description: "Please complete all lifestyle fields." });
        return;
      }
      // No specific validation for step 5 (Eco Mission placeholder) yet
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('Onboarding Data:', formData);
    // Save to new UserProfile structure
    const existingProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const userProfileData = { ...existingProfile, ...formData }; // Merge, onboarding data takes precedence for its fields
    localStorage.setItem('userProfile', JSON.stringify(userProfileData));
    localStorage.setItem('onboardingComplete', 'true');


    toast({
      title: 'Onboarding Complete!',
      description: "Let's choose a plan that's right for you.",
      action: <CheckCircle className="text-green-500" />,
    });
    router.push('/subscription');
  };

  const progressValue = (currentStep / TOTAL_STEPS) * 100;
  
  const healthGoalOptions = [
    { id: 'lose-weight', label: 'Lose Weight' },
    { id: 'gain-muscle', label: 'Gain Muscle' },
    { id: 'maintain-weight', label: 'Maintain Weight' },
    { id: 'eat-healthier', label: 'Eat Healthier' },
    { id: 'improve-energy', label: 'Improve Energy Levels' },
    { id: 'track-sustainability', label: 'Track Sustainability Impact'},
  ];


  return (
    <Card className="w-full shadow-2xl">
      <CardHeader>
        <div className="flex justify-center mb-2">
          <Leaf className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-center text-3xl font-bold text-primary">
          Let's Get to Know You
        </CardTitle>
        <CardDescription className="text-center">
          Help us tailor EcoAI to your unique needs. ({currentStep}/{TOTAL_STEPS})
        </CardDescription>
        <Progress value={progressValue} className="w-full mt-4 h-2 [&>div]:bg-primary" />
      </CardHeader>

      <CardContent>
        {!isClient ? (
           <div className="space-y-6">
            <div className="h-10 bg-muted rounded-md animate-pulse"></div>
            <div className="h-10 bg-muted rounded-md animate-pulse"></div>
            <div className="h-10 bg-muted rounded-md animate-pulse"></div>
             <div className="flex justify-between mt-8">
                <div className="h-10 w-20 bg-muted rounded-md animate-pulse"></div>
                <div className="h-10 w-20 bg-muted rounded-md animate-pulse ml-auto"></div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStep === 1 && (
              <section className="space-y-4 animate-in fade-in duration-500">
                <h3 className="text-xl font-semibold flex items-center gap-2 text-primary"><User className="h-6 w-6" /> Personal Details</h3>
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="E.g., Alex Green" required />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" name="age" type="number" value={formData.age} onChange={handleChange} placeholder="E.g., 30" required />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select name="gender" value={formData.gender} onValueChange={handleSelectChange('gender')}>
                    <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="height">Height</Label>
                    <div className="flex gap-2">
                    <Input id="height" name="height" type="number" value={formData.height} onChange={handleChange} placeholder="E.g., 170" className="flex-grow" required/>
                      <Select name="heightUnit" value={formData.heightUnit} onValueChange={handleSelectChange('heightUnit')}>
                        <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cm">cm</SelectItem>
                          <SelectItem value="in">in</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight</Label>
                    <div className="flex gap-2">
                    <Input id="weight" name="weight" type="number" value={formData.weight} onChange={handleChange} placeholder="E.g., 65" className="flex-grow" required/>
                      <Select name="weightUnit" value={formData.weightUnit} onValueChange={handleSelectChange('weightUnit')}>
                        <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="lbs">lbs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {currentStep === 2 && (
              <section className="space-y-4 animate-in fade-in duration-500">
                <h3 className="text-xl font-semibold flex items-center gap-2 text-primary"><Target className="h-6 w-6" /> Goals & Activity</h3>
                <div>
                  <Label>Primary Health Goals (select all that apply)</Label>
                  <div className="space-y-2 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {healthGoalOptions.map((goal) => (
                      <div key={goal.id} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-muted/50">
                        <Checkbox
                          id={goal.id}
                          value={goal.label}
                          checked={formData.healthGoals.includes(goal.label)}
                          onCheckedChange={(checked) => {
                            setFormData((prev) => ({
                              ...prev,
                              healthGoals: checked
                                ? [...prev.healthGoals, goal.label]
                                : prev.healthGoals.filter((g) => g !== goal.label),
                            }));
                          }}
                        />
                        <Label htmlFor={goal.id} className="font-normal cursor-pointer">{goal.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Typical Activity Level</Label>
                  <RadioGroup name="activityLevel" value={formData.activityLevel} onValueChange={handleRadioChange('activityLevel')} className="mt-2 space-y-1">
                      <div className="flex items-center space-x-2"><RadioGroupItem value="sedentary" id="sedentary" /><Label htmlFor="sedentary">Sedentary (little to no exercise)</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="light" id="light" /><Label htmlFor="light">Lightly Active (light exercise/sports 1-3 days/week)</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="moderate" id="moderate" /><Label htmlFor="moderate">Moderately Active (moderate exercise/sports 3-5 days/week)</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="very" id="very" /><Label htmlFor="very">Very Active (hard exercise/sports 6-7 days a week)</Label></div>
                    </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="exerciseFrequency">How many days a week do you typically exercise?</Label>
                  <Select name="exerciseFrequency" value={formData.exerciseFrequency} onValueChange={handleSelectChange('exerciseFrequency')}>
                    <SelectTrigger id="exerciseFrequency"><SelectValue placeholder="Select frequency" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 days</SelectItem>
                      <SelectItem value="1-2">1-2 days</SelectItem>
                      <SelectItem value="3-4">3-4 days</SelectItem>
                      <SelectItem value="5+">5+ days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </section>
            )}

            {currentStep === 3 && (
              <section className="space-y-4 animate-in fade-in duration-500">
                <h3 className="text-xl font-semibold flex items-center gap-2 text-primary"><Utensils className="h-6 w-6" /> Diet Preferences</h3>
                 <div>
                  <Label htmlFor="dietType">Are you following any specific diet?</Label>
                  <Select name="dietType" value={formData.dietType} onValueChange={handleSelectChange('dietType')}>
                    <SelectTrigger id="dietType"><SelectValue placeholder="Select diet type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                      <SelectItem value="keto">Keto</SelectItem>
                      <SelectItem value="paleo">Paleo</SelectItem>
                      <SelectItem value="pescatarian">Pescatarian</SelectItem>
                      <SelectItem value="mediterranean">Mediterranean</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dietaryRestrictions">Any dietary restrictions or allergies? (e.g., gluten-free, lactose intolerant, nut allergy)</Label>
                  <Textarea id="dietaryRestrictions" name="dietaryRestrictions" value={formData.dietaryRestrictions} onChange={handleChange} placeholder="List any relevant restrictions" />
                </div>
                <div>
                  <Label htmlFor="favoriteCuisines">Favorite Cuisines (Optional)</Label>
                  <Input id="favoriteCuisines" name="favoriteCuisines" value={formData.favoriteCuisines} onChange={handleChange} placeholder="E.g., Italian, Mexican, Indian" />
                </div>
                <div>
                  <Label htmlFor="dislikedIngredients">Disliked Ingredients (Optional)</Label>
                  <Input id="dislikedIngredients" name="dislikedIngredients" value={formData.dislikedIngredients} onChange={handleChange} placeholder="E.g., Cilantro, Olives, Mushrooms" />
                </div>
                 <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
                  <Label htmlFor="enableCarbonTracking" className="flex flex-col">
                    <span>Enable Carbon Tracking?</span>
                    <span className="text-xs text-muted-foreground">Track the environmental impact of your meals (EcoPro feature).</span>
                  </Label>
                  <Switch id="enableCarbonTracking" checked={formData.enableCarbonTracking} onCheckedChange={handleSwitchChange('enableCarbonTracking')} />
                </div>
              </section>
            )}
            
            {currentStep === 4 && (
              <section className="space-y-4 animate-in fade-in duration-500">
                <h3 className="text-xl font-semibold flex items-center gap-2 text-primary"><ShieldQuestion className="h-6 w-6" /> Lifestyle</h3>
                <div>
                  <Label htmlFor="sleepHours">On average, how many hours of sleep do you get per night?</Label>
                  <Select name="sleepHours" value={formData.sleepHours} onValueChange={handleSelectChange('sleepHours')}>
                    <SelectTrigger id="sleepHours"><SelectValue placeholder="Select sleep hours" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<5">&lt;5 hours</SelectItem>
                      <SelectItem value="5-6">5-6 hours</SelectItem>
                      <SelectItem value="7-8">7-8 hours</SelectItem>
                      <SelectItem value="8+">8+ hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>How would you rate your typical stress levels?</Label>
                  <RadioGroup name="stressLevel" value={formData.stressLevel} onValueChange={handleRadioChange('stressLevel')} className="mt-2 space-y-1">
                      <div className="flex items-center space-x-2"><RadioGroupItem value="low" id="stress_low" /><Label htmlFor="stress_low">Low</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="moderate" id="stress_moderate" /><Label htmlFor="stress_moderate">Moderate</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="high" id="stress_high" /><Label htmlFor="stress_high">High</Label></div>
                    </RadioGroup>
                </div>
              </section>
            )}

            {currentStep === 5 && (
               <section className="space-y-4 animate-in fade-in duration-500 text-center">
                <h3 className="text-xl font-semibold flex items-center justify-center gap-2 text-primary"><HeartHandshake className="h-8 w-8" /> Our Eco Mission</h3>
                <p className="text-muted-foreground">
                  At EcoAI, we believe that healthy living and a healthy planet go hand-in-hand. 
                  By making conscious food choices, you're not just nurturing your body, but also contributing to a more sustainable future.
                </p>
                <div className="p-4 bg-primary/10 rounded-lg">
                    <Leaf className="h-10 w-10 text-primary mx-auto mb-2"/>
                    <p className="font-semibold text-primary">Join thousands of users reducing their carbon footprint, one meal at a time!</p>
                </div>
                <p className="text-sm text-muted-foreground">
                    Features like carbon tracking and eco-friendly recipe suggestions are designed to empower you on this journey.
                </p>
              </section>
            )}

            {currentStep === TOTAL_STEPS && (
              <section className="space-y-4 animate-in fade-in duration-500">
                <h3 className="text-xl font-semibold flex items-center gap-2 text-primary"><CheckCircle className="h-6 w-6" /> Review & Confirm</h3>
                <p className="text-muted-foreground">Please review your information before we create your personalized plan.</p>
                <div className="space-y-2 border p-4 rounded-md bg-muted/30 max-h-96 overflow-y-auto text-sm">
                  <p><strong>Name:</strong> {formData.name}</p>
                  <p><strong>Age:</strong> {formData.age}</p>
                  <p><strong>Gender:</strong> {formData.gender}</p>
                  <p><strong>Height:</strong> {formData.height} {formData.heightUnit}</p>
                  <p><strong>Weight:</strong> {formData.weight} {formData.weightUnit}</p>
                  <p><strong>Activity Level:</strong> {formData.activityLevel}</p>
                  <p><strong>Health Goals:</strong> {formData.healthGoals.join(', ')}</p>
                  <p><strong>Exercise Frequency:</strong> {formData.exerciseFrequency}</p>
                  <p><strong>Diet Type:</strong> {formData.dietType}</p>
                  <p><strong>Dietary Restrictions:</strong> {formData.dietaryRestrictions || 'None'}</p>
                  <p><strong>Favorite Cuisines:</strong> {formData.favoriteCuisines || 'None specified'}</p>
                  <p><strong>Disliked Ingredients:</strong> {formData.dislikedIngredients || 'None specified'}</p>
                  <p><strong>Enable Carbon Tracking:</strong> {formData.enableCarbonTracking ? 'Yes' : 'No'}</p>
                  <p><strong>Sleep per night:</strong> {formData.sleepHours}</p>
                  <p><strong>Stress Level:</strong> {formData.stressLevel}</p>
                </div>
                <div className="flex items-center gap-2 mt-4 p-3 bg-primary/10 rounded-md">
                    <Leaf className="h-5 w-5 text-primary"/>
                    <p className="text-sm text-primary-foreground">EcoAI is committed to helping you achieve your health goals sustainably!</p>
                </div>
              </section>
            )}

            <CardFooter className="flex justify-between mt-8 p-0">
              <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
                Previous
              </Button>
              {currentStep < TOTAL_STEPS ? (
                <Button type="button" onClick={handleNext} className="ml-auto">
                  Next
                </Button>
              ) : (
                <Button type="submit" className="ml-auto">
                  Create My EcoAI Plan <Sparkles className="ml-2 h-4 w-4"/>
                </Button>
              )}
            </CardFooter>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
