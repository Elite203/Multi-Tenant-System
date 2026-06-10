import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UserProfile } from '@/types/profile';
import { User } from 'lucide-react';

interface BioCardProps {
  profile: UserProfile;
  isEditing: boolean;
  formData: Partial<UserProfile>;
  onFormDataChange: (field: keyof UserProfile, value: string) => void;
}

export const BioCard = ({ 
  profile, 
  isEditing, 
  formData, 
  onFormDataChange 
}: BioCardProps) => {
  return (
    <Card className="bg-gradient-card border-0 shadow-elegant">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-lg font-semibold text-foreground">
          <User className="h-5 w-5 text-primary" />
          <span>About Me</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">Tell us a bit about yourself</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="bio" className="text-sm font-medium">
            Personal Bio
          </Label>
          <Textarea
            id="bio"
            value={isEditing ? (formData.bio ?? '') : (profile.bio || '')}
            onChange={(e) => onFormDataChange('bio', e.target.value)}
            disabled={!isEditing}
            className="min-h-[120px] resize-none transition-all duration-200 focus:shadow-glow"
            placeholder={isEditing ? "Share something about yourself, your interests, or your professional journey..." : "No bio added yet"}
          />
        </div>
      </CardContent>
    </Card>
  );
};