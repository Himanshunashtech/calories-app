
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
import { Moon, Sun, Scale, Ruler, Bell, HelpCircle, FileText, Save, Palette, Weight, Droplet, ListFilter } from 'lucide-react';

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
      setSettings({
        ...defaultSettings, // Start with defaults
        ...(profile.appSettings || {}), // Override with saved app settings
        unitPreferences: { // Deep merge unitPreferences
            ...defaultSettings.unitPreferences!,
            ...(profile.appSettings?.unitPreferences || {}),
        }
      });
    }
    setIsLoading(false);
  }, []);
  
  const handleSwitchChange = (name: keyof AppSettings) => (checked: boolean) => {
    setSettings((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (name: 'weight' | 'height' | 'volume') => (value: string) => {
    setSettings(prev => ({
      ...prev,
      unitPreferences: {
        ...(prev.unitPreferences || defaultSettings.unitPreferences!),
        [name]: value,
      }
    }));
  };

  const handleSubmit = () => {
    if (userProfile) {
      const updatedProfile = { ...userProfile, appSettings: settings };
      saveUserProfile(updatedProfile);
      toast({
        title: 'Settings Saved',
        description: 'Your app settings have been updated.',
        action: <Save className="text-green-500" />,
      });
      // Note: Dark mode enabling/disabling would typically trigger a theme change here
      // document.documentElement.classList.toggle('dark', settings.darkModeEnabled);
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
            <p className="text-xs text-muted-foreground mt-1">Dark mode is a visual setting only for now. Full theme switching needs UI and CSS updates.</p>
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
             <p className="text-xs text-muted-foreground mt-1">Unit conversions throughout the app (e.g., water intake display) will reflect these settings where implemented.</p>
          </section>
          
          <section>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-foreground">Content Preferences</h3>
            <div className="flex items-center justify-between space-x-2 p-3 border rounded-md">
              <Label htmlFor="hideNonCompliantRecipes" className="flex items-center gap-2">
                <ListFilter className="h-5 w-5" />
                Hide Non-Compliant Recipes
                 <span className="text-xs text-muted-foreground">(Based on allergies/restrictions in profile)</span>
              </Label>
              <Switch 
                id="hideNonCompliantRecipes" 
                checked={settings.hideNonCompliantRecipes} 
                onCheckedChange={handleSwitchChange('hideNonCompliantRecipes')}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Recipe filtering logic is a placeholder. Actual filtering requires recipe data integration.</p>
          </section>


          <section>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3 text-foreground">Other Settings</h3>
             <Button variant="outline" className="w-full justify-start gap-2" onClick={() => router.push('/profile#reminderSettings')}>
              <Bell className="h-5 w-5"/> Manage Notification Preferences
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2 mt-2" onClick={() => router.push('/subscription')}>
              <FileText className="h-5 w-5"/> Manage Subscription
            </Button>
             <Button variant="outline" className="w-full justify-start gap-2 mt-2" onClick={() => router.push('/app/help-center')}>
              <HelpCircle className="h-5 w-5"/> Help Center
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
