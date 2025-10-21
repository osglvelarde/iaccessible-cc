"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, Mail, User, Building2 } from 'lucide-react';
import { UserWithDetails, CreateUserRequest, OperatingUnit, UserGroup } from '@/lib/types/users-roles';
import { createUser } from '@/lib/users-roles-api';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated: (user: UserWithDetails) => void;
  operatingUnits: OperatingUnit[];
  groups: UserGroup[];
}

export default function UserFormDialog({ 
  open, 
  onOpenChange, 
  onUserCreated,
  operatingUnits,
  groups 
}: UserFormDialogProps) {
  const [formData, setFormData] = useState<CreateUserRequest>({
    email: '',
    firstName: '',
    lastName: '',
    operatingUnitId: '',
    groupIds: [],
    sendInvitation: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        operatingUnitId: '',
        groupIds: [],
        sendInvitation: true
      });
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.email || !formData.firstName || !formData.lastName || !formData.operatingUnitId) {
        setError('Please fill in all required fields');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return;
      }

      const newUser = await createUser(formData);
      onUserCreated(newUser);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroupToggle = (groupId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      groupIds: checked 
        ? [...prev.groupIds, groupId]
        : prev.groupIds.filter(id => id !== groupId)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New User
          </DialogTitle>
          <DialogDescription>
            Create a new user account and assign them to groups and operating units.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="pl-10"
                  placeholder="John"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="pl-10"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="pl-10"
                placeholder="john.doe@example.gov"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="operatingUnit">Operating Unit *</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Select
                value={formData.operatingUnitId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, operatingUnitId: value }))}
                required
              >
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Select operating unit" />
                </SelectTrigger>
                <SelectContent>
                  {operatingUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name} ({unit.organization})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>User Groups</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-3">
              {groups.map((group) => (
                <div key={group.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`group-${group.id}`}
                    checked={formData.groupIds.includes(group.id)}
                    onCheckedChange={(checked) => handleGroupToggle(group.id, checked as boolean)}
                  />
                  <Label 
                    htmlFor={`group-${group.id}`} 
                    className="text-sm font-normal cursor-pointer"
                  >
                    {group.name}
                    {group.description && (
                      <span className="text-muted-foreground ml-1">
                        - {group.description}
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="sendInvitation"
              checked={formData.sendInvitation}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendInvitation: checked as boolean }))}
            />
            <Label htmlFor="sendInvitation" className="text-sm font-normal">
              Send invitation email
            </Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
