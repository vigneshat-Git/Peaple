import { Sun, Moon, Monitor, User, Camera, Loader2, Check } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef } from "react";
import { apiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import UserAvatar from "@/components/peaple/UserAvatar";

const themeOptions = [
  { value: "light" as const, label: "Light", icon: Sun, description: "Classic light appearance" },
  { value: "dark" as const, label: "Dark", icon: Moon, description: "Reduced glare, easier on eyes" },
  { value: "system" as const, label: "System", icon: Monitor, description: "Match your device settings" },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [profileImage, setProfileImage] = useState(user?.avatar || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Error",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Error",
        description: "Only JPEG, PNG, and WebP images are allowed",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const { uploadUrl, fileUrl } = await apiService.generateUploadUrl(file.type);
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      setProfileImage(fileUrl);
      toast({
        title: "Success",
        description: "Profile image uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await apiService.updateUser({
        username: username.trim(),
        bio: bio.trim(),
        profile_image: profileImage,
      });

      const updatedUser = (response as any).data || response;
      
      updateUser({
        username: updatedUser.username || username,
        bio: updatedUser.bio || bio,
        avatar: updatedUser.profile_image || profileImage,
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = 
    username !== user?.username || 
    bio !== (user?.bio || "") || 
    profileImage !== (user?.avatar || "");

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-foreground mb-6">Settings</h1>

      {/* Profile Settings */}
      <section className="bg-card border rounded-md p-5 mb-4">
        <h2 className="text-base font-semibold text-foreground mb-1">Profile</h2>
        <p className="text-sm text-muted-foreground mb-4">Customize your public profile.</p>

        <div className="space-y-4">
          {/* Profile Image */}
          <div className="flex items-center gap-4">
            <div 
              className="relative cursor-pointer group"
              onClick={handleImageClick}
            >
              <UserAvatar 
                name={username || user?.username || "User"} 
                image={profileImage} 
                size="lg" 
              />
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploading ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <div>
              <p className="text-sm font-medium text-foreground">Profile Picture</p>
              <p className="text-xs text-muted-foreground">
                Click to upload (max 5MB, JPEG/PNG/WebP)
              </p>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-10 pr-3 py-2 rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={3}
              maxLength={160}
              className="w-full px-3 py-2 rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {bio.length}/160
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isLoading || !user}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium transition-colors duration-150 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </section>

      {/* Display Settings */}
      <section className="bg-card border rounded-md p-5 mb-4">
        <h2 className="text-base font-semibold text-foreground mb-1">Display</h2>
        <p className="text-sm text-muted-foreground mb-4">Choose how Peaple looks to you.</p>

        <div className="space-y-2">
          {themeOptions.map(opt => {
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`w-full flex items-center gap-3 p-3 rounded-md border text-left transition-colors duration-150 ${
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-secondary"
                }`}
              >
                <opt.icon className={`h-5 w-5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className={`text-sm font-medium ${active ? "text-foreground" : "text-foreground"}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
                {active && (
                  <div className="ml-auto h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Account Info */}
      <section className="bg-card border rounded-md p-5">
        <h2 className="text-base font-semibold text-foreground mb-1">Account</h2>
        <p className="text-sm text-muted-foreground mb-4">Your account information.</p>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Email</span>
            <span className="text-foreground">{user?.email || "Not available"}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Member since</span>
            <span className="text-foreground">
              {user?.created_at 
                ? new Date(user.created_at).toLocaleDateString() 
                : "Not available"}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
