import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload } from 'lucide-react';
import { UserProfile } from '@/types/profile';

interface ProfilePhotoCardProps {
  profile: UserProfile;
  isEditing: boolean;
  onUploadPhoto: (file: File) => Promise<boolean>;
  isUpdating: boolean;
}

export const ProfilePhotoCard = ({ 
  profile, 
  isEditing, 
  onUploadPhoto, 
  isUpdating 
}: ProfilePhotoCardProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    await onUploadPhoto(file);
    setIsUploading(false);
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'hr': return 'default';
      case 'manager': return 'secondary';
      default: return 'outline';
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || 'U';
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-card border-0 shadow-elegant">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Avatar with Upload Button */}
          <div className="relative group">
            <Avatar className="h-32 w-32 bg-gradient-primary shadow-glow transition-all duration-300 group-hover:shadow-hero">
              <AvatarImage 
                src={profile.avatar_url} 
                alt={`${profile.first_name} ${profile.last_name}`}
                className="object-cover"
              />
              <AvatarFallback className="text-2xl font-bold bg-gradient-primary text-primary-foreground">
                {getInitials(profile.first_name, profile.last_name)}
              </AvatarFallback>
            </Avatar>
            
            {isEditing && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute -bottom-2 -right-2 rounded-full shadow-lg hover:shadow-glow transition-all duration-200"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isUpdating}
                >
                  {isUploading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </>
            )}
          </div>

          {/* Name and Position */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground">
              {profile.first_name} {profile.last_name}
            </h3>
            <p className="text-muted-foreground">
              {profile.email}
            </p>
          </div>

          {/* Role Badge */}
          {profile.role && (
            <Badge 
              variant={getRoleBadgeVariant(profile.role)}
              className="text-xs font-medium px-3 py-1 transition-all duration-200 hover:shadow-sm"
            >
              {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
            </Badge>
          )}

          {/* Upload Helper */}
          {isEditing && (
            <div className="flex items-center text-xs text-muted-foreground space-x-1 mt-4">
              <Upload className="h-3 w-3" />
              <span>Click camera to upload photo</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};