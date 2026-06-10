import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin } from 'lucide-react';
import { UserProfile } from '@/types/profile';

interface ContactInformationCardProps {
  profile: UserProfile;
  isEditing: boolean;
  formData: Partial<UserProfile>;
  onFormDataChange: (field: keyof UserProfile, value: string) => void;
}

export const ContactInformationCard = ({ 
  profile, 
  isEditing, 
  formData, 
  onFormDataChange 
}: ContactInformationCardProps) => {
  return (
    <Card className="bg-gradient-card border-0 shadow-elegant">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-lg font-semibold text-foreground">
          <Mail className="h-5 w-5 text-primary" />
          <span>Contact Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center space-x-2 text-sm font-medium">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>Email Address</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={isEditing ? (formData.email ?? '') : (profile.email || '')}
            onChange={(e) => onFormDataChange('email', e.target.value)}
            disabled={!isEditing}
            className="transition-all duration-200 focus:shadow-glow"
            placeholder="Enter your email address"
          />
        </div>

        {/* Phone Field */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center space-x-2 text-sm font-medium">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>Phone Number</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            value={isEditing ? (formData.phone ?? '') : (profile.phone || '')}
            onChange={(e) => onFormDataChange('phone', e.target.value)}
            disabled={!isEditing}
            className="transition-all duration-200 focus:shadow-glow"
            placeholder="Enter your phone number"
          />
        </div>

        {/* Address Field */}
        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center space-x-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>Address</span>
          </Label>
          <Textarea
            id="address"
            value={isEditing ? (formData.address ?? '') : (profile.address || '')}
            onChange={(e) => onFormDataChange('address', e.target.value)}
            disabled={!isEditing}
            className="min-h-[80px] resize-none transition-all duration-200 focus:shadow-glow"
            placeholder="Enter your address"
          />
        </div>
      </CardContent>
    </Card>
  );
};