"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/cc/AuthProvider";
import UtilityBar from "@/components/cc/UtilityBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, Settings, Bell, Shield, ArrowLeft, Users, Building2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { UserProfile } from "@/lib/types/user-profile";

export default function ProfilePage() {
  const { user, getModulePermissions } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [sessionWarnings, setSessionWarnings] = useState(true);
  const [moduleUpdates, setModuleUpdates] = useState(false);
  const [autoSaveRecentModules, setAutoSaveRecentModules] = useState(true);

  // Initialize form fields from user
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/user-profile?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEmailNotifications(data.preferences?.notifications?.email ?? true);
        setSessionWarnings(data.preferences?.notifications?.sessionWarnings ?? true);
        setModuleUpdates(data.preferences?.notifications?.moduleUpdates ?? false);
        setAutoSaveRecentModules(data.preferences?.autoSaveRecentModules ?? true);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  // Load profile on mount
  useEffect(() => {
    if (user) {
      loadProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Please Sign In</h2>
            <p className="text-muted-foreground text-center mb-4">
              You need to be signed in to view your profile.
            </p>
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const modulePermissions = getModulePermissions();

  const handleSave = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/user-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          firstName,
          lastName,
          preferences: {
            ...profile?.preferences,
            notifications: {
              ...profile?.preferences?.notifications,
              email: emailNotifications,
              sessionWarnings: sessionWarnings,
              moduleUpdates: moduleUpdates
            },
            autoSaveRecentModules: autoSaveRecentModules
          }
        })
      });
      
      if (response.ok) {
        const updated = await response.json();
        setProfile(updated);
        toast({
          title: "Profile updated",
          description: "Your profile has been saved successfully.",
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <UtilityBar />
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                Back to Command Center
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Profile & Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your account settings and preferences.
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" aria-hidden />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Your basic account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={user.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="operatingUnit">Operating Unit</Label>
                  <Input id="operatingUnit" defaultValue={user.operatingUnit.name} disabled />
                </div>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" aria-hidden />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Configure your notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about scan results and system changes
                    </p>
                  </div>
                  <Switch 
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Session warnings</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified before your session expires
                    </p>
                  </div>
                  <Switch 
                    checked={sessionWarnings}
                    onCheckedChange={setSessionWarnings}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Module updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications about new features and module changes
                    </p>
                  </div>
                  <Switch 
                    checked={moduleUpdates}
                    onCheckedChange={setModuleUpdates}
                  />
                </div>
                <Button onClick={handleSave} disabled={isLoading} variant="outline" className="mt-4">
                  {isLoading ? 'Saving...' : 'Save Preferences'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" aria-hidden />
                  Roles & Permissions
                </CardTitle>
                <CardDescription>
                  Your current roles and access permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Your Groups</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {user.groups.map((group) => (
                        <Badge key={group.id} variant="default" className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {group.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Operating Unit</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user.operatingUnit.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {user.operatingUnit.organization}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium">Module Access</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {Object.entries(modulePermissions).map(([moduleKey, accessLevel]) => (
                        <div key={moduleKey} className="flex items-center justify-between p-2 rounded border">
                          <span className="text-sm font-medium capitalize">
                            {moduleKey.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <Badge variant="outline" className="text-xs">
                              {accessLevel}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" aria-hidden />
                  Security
                </CardTitle>
                <CardDescription>
                  Manage your account security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Password</Label>
                  <p className="text-sm text-muted-foreground">
                    Last changed 30 days ago
                  </p>
                  <Button variant="outline">Change Password</Button>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" aria-hidden />
                  Preferences
                </CardTitle>
                <CardDescription>
                  Customize your Command Center experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dark mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Use dark theme for the interface
                    </p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-save recent modules</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically track recently accessed modules
                    </p>
                  </div>
                  <Switch 
                    checked={autoSaveRecentModules}
                    onCheckedChange={setAutoSaveRecentModules}
                  />
                </div>
                <Button onClick={handleSave} disabled={isLoading} variant="outline" className="mt-4">
                  {isLoading ? 'Saving...' : 'Save Preferences'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

