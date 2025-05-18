
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getUserProfile, saveUserProfile, type UserProfile, type AppSettings } from '@/lib/localStorage';
import { Moon, Sun, Bell, HelpCircle, FileText, Save, Palette, Weight, Droplet, ListFilter, Ruler } from 'lucide-react'; // Added Ruler
import { cn } from '@/lib/utils';

const defaultSettings: AppSettings = {
  darkModeEnabled: false,
  unitPreferences: {
    weight: 'kg',
    height: 'cm',
    volume: 'ml',
  },
  hideNonCompliantRecipes: false,
};

export default function AppSettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    const profile = getUserProfile();
    if (profile) {
      setUserProfile(profile);
      const currentAppSettings = profile.appSettings || {};
      const currentUnitPrefs = currentAppSettings.unitPreferences || {};
      setSettings({
        ...defaultSettings, 
        ...currentAppSettings,
        unitPreferences: {
            ...defaultSettings.unitPreferences!,
            ...currentUnitPrefs,
        }
      });
    }
    setIsLoading(false);
  }, []);

  const handleSwitchChange = (name: keyof AppSettings) => (checked: boolean) => {
    setSettings((prev) => ({ ...prev, [name]: checked }));
    if (name === 'darkModeEnabled') {
        document.documentElement.classList.toggle('dark', checked); // Basic theme toggle
    }
  };

  const handleSelectChange = (name: 'weight' | 'height' | 'volume') => (value: string) => {
    setSettings(prev => ({
      ...prev,
      unitPreferences: {
        ...(prev.unitPreferences || defaultSettings.unitPreferences!),
        [name]: value as any, // Type assertion as value is string
      }
    }));
  };

  const handleSubmit = () => {
    if (userProfile) {
      const updatedProfile: UserProfile = { 
        ...userProfile, 
        appSettings: settings 
      };
      saveUserProfile(updatedProfile); // This saves the whole profile
      toast({
        title: 'Settings Saved',
        description: 'Your app settings have been updated.',
        action: <Save className="text-green-500" />,
      });
    }
  };
  
  if (!isClient || isLoading) {
    return (
      <div className="space-y-6 p-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="shadow-lg">
            <CardHeader><div className="h-6 w-2/4 bg-muted rounded animate-pulse"></div></CardHeader>
            <CardContent className="space-y-4">
              <div className="h-10 bg-muted rounded animate-pulse"></div>
              <div className="h-10 bg-muted rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2"><Palette/> App Settings</CardTitle>
          <CardDescription>Customize your EcoAI Calorie Tracker experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-foreground">Appearance</h3>
            <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
              <Label htmlFor="darkModeEnabled" className="flex items-center gap-2">
                {settings.darkModeEnabled ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                Dark Mode
              </Label>
              <Switch 
                id="darkModeEnabled" 
                checked={settings.darkModeEnabled} 
                onCheckedChange={handleSwitchChange('darkModeEnabled')}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Toggling Dark Mode will apply basic theme changes. Refresh may be needed for full effect.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-foreground">Unit Preferences</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="unitWeight"><Weight className="inline mr-1 h-4 w-4"/>Weight</Label>
                <Select 
                  value={settings.unitPreferences?.weight || 'kg'} 
                  onValueChange={handleSelectChange('weight')}
                >
                  <SelectTrigger id="unitWeight"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="unitHeight"><Ruler className="inline mr-1 h-4 w-4"/>Height</Label>
                <Select 
                  value={settings.unitPreferences?.height || 'cm'}
                  onValueChange={handleSelectChange('height')}
                >
                  <SelectTrigger id="unitHeight"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cm">Centimeters (cm)</SelectItem>
                    <SelectItem value="in">Inches (in)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <div>
                <Label htmlFor="unitVolume"><Droplet className="inline mr-1 h-4 w-4"/>Volume</Label>
                <Select 
                  value={settings.unitPreferences?.volume || 'ml'}
                  onValueChange={handleSelectChange('volume')}
                >
                  <SelectTrigger id="unitVolume"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ml">Milliliters (ml)</SelectItem>
                    <SelectItem value="fl oz">Fluid Ounces (fl oz)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
             <p className="text-xs text-muted-foreground mt-1">These preferences will be reflected in relevant parts of the app like your profile and water tracking.</p>
          </section>
          
          <section>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-foreground">Content Preferences</h3>
            <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
              <div className="flex-1">
                <Label htmlFor="hideNonCompliantRecipes" className="flex items-center gap-2">
                    <ListFilter className="h-5 w-5" />
                    Hide Non-Compliant Recipes
                </Label>
                <p className="text-xs text-muted-foreground">Based on allergies/restrictions in your profile.</p>
              </div>
              <Switch 
                id="hideNonCompliantRecipes" 
                checked={settings.hideNonCompliantRecipes} 
                onCheckedChange={handleSwitchChange('hideNonCompliantRecipes')}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Recipe filtering is based on simple keyword matching in placeholder recipe data. Actual implementation may vary.</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-foreground">Account &amp; Support</h3>
            <Button variant="outline" className="w-full justify-start gap-2 mt-2" onClick={() => router.push('/subscription')}>
              <FileText className="h-5 w-5"/> Manage Subscription
            </Button>
             <Button variant="outline" className="w-full justify-start gap-2 mt-2" onClick={() => router.push('/help-center')}>
              <HelpCircle className="h-5 w-5"/> Help Center &amp; Support
            </Button>
          </section>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit} className="w-full text-lg py-6">
            <Save className="mr-2 h-5 w-5" />
            Save App Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
