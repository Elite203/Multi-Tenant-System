import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useUnifiedProfile } from '@/hooks/useUnifiedProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ProfilePhotoCard } from '@/components/profile/ProfilePhotoCard';
import { ContactInformationCard } from '@/components/profile/ContactInformationCard';
import { EmploymentDetailsCard } from '@/components/profile/EmploymentDetailsCard';
import { LeaveBalanceCard } from '@/components/profile/LeaveBalanceCard';
import { EnhancedEmergencyContactCard } from '@/components/profile/EnhancedEmergencyContactCard';
import { BioCard } from '@/components/profile/BioCard';
import { Edit, Save, X, Calendar } from 'lucide-react';
import { UserProfile } from '@/types/profile';
import { toast } from 'sonner';
import { clearAuthSession } from '@/utils/authUtils';

const Profile = () => {
  const { user } = useAuth();
  const { 
    profile, 
    leaveBalances, 
    emergencyContacts, 
    isEmployee, 
    isLoading, 
    isUpdating,
    updateProfile, 
    uploadAvatar,
    addEmergencyContact,
    updateEmergencyContact,
    deleteEmergencyContact
  } = useUnifiedProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  const handleEdit = () => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        email: profile.email || '',
        address: profile.address || '',
        bio: profile.bio || ''
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    const success = await updateProfile(formData);
    if (success) {
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } else {
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleFormDataChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-muted-foreground">Loading your profile...</p>
            <Button 
              variant="outline" 
              onClick={clearAuthSession}
              className="mt-4"
            >
              Clear Session (If stuck loading)
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <p className="text-muted-foreground">Unable to load profile data</p>
              <Button 
                variant="outline" 
                onClick={clearAuthSession}
              >
                Clear Session & Reload
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-hero p-8 mb-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-white/90 mt-2 text-lg">Manage your personal information and preferences</p>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <Button onClick={handleEdit} className="gap-2 bg-white/20 hover:bg-white/30 border-white/30 text-white">
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleCancel} className="gap-2 bg-white/10 hover:bg-white/20 border-white/30 text-white">
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isUpdating} className="gap-2 bg-white text-primary hover:bg-white/90">
                    {isUpdating ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Three-Column Profile Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Column 1: Profile Photo */}
          <div className="lg:col-span-1">
            <ProfilePhotoCard
              profile={profile}
              isEditing={isEditing}
              onUploadPhoto={uploadAvatar}
              isUpdating={isUpdating}
            />
          </div>

          {/* Column 2: Contact Information */}
          <div className="lg:col-span-1">
            <ContactInformationCard
              profile={profile}
              isEditing={isEditing}
              formData={formData}
              onFormDataChange={handleFormDataChange}
            />
          </div>

          {/* Column 3: Employment Details */}
          <div className="lg:col-span-1">
            {isEmployee ? (
              <EmploymentDetailsCard
                profile={profile}
                isEditing={isEditing}
              />
            ) : (
              <Card className="bg-gradient-card border-0 shadow-elegant h-full flex items-center justify-center">
                <CardContent className="text-center">
                  <p className="text-muted-foreground">No employment details available</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Bio Section */}
        <div className="mb-8">
          <BioCard
            profile={profile}
            isEditing={isEditing}
            formData={formData}
            onFormDataChange={handleFormDataChange}
          />
        </div>

        {/* Leave Balance Section */}
        {isEmployee && leaveBalances.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded bg-gradient-primary flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Leave Balance</h2>
                <p className="text-muted-foreground">Your current leave allocations and usage</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaveBalances.map((balance) => (
                <LeaveBalanceCard key={balance.id} balance={balance} />
              ))}
            </div>
          </div>
        )}

        {/* Emergency Contacts - Only show for employees */}
        {isEmployee && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Emergency Contacts</h2>
            <EnhancedEmergencyContactCard
              isEditing={isEditing}
              emergencyContacts={emergencyContacts}
              onAddContact={addEmergencyContact}
              onUpdateContact={updateEmergencyContact}
              onDeleteContact={deleteEmergencyContact}
              isUpdating={isUpdating}
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Profile;