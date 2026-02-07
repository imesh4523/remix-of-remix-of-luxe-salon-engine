import { useState, useRef, useEffect } from 'react';
import {
  Store, MapPin, Phone, Mail, Camera, Check,
  LocateFixed, Loader2, Users, Scissors, Image as ImageIcon,
  Link as LinkIcon, Copy, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useUpdateSalon, useUploadSalonImage } from '@/hooks/useVendorData';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useProvinces, useDistricts, useTowns } from '@/hooks/useLocations';
import LocationSelector from '@/components/LocationSelector';
import { toast } from 'sonner';

interface SalonData {
  id: string;
  name: string;
  slug?: string;
  description: string | null;
  address: string;
  city: string;
  phone: string | null;
  email: string | null;
  cover_image: string | null;
  logo: string | null;
  latitude: number | null;
  longitude: number | null;
  province_id?: string | null;
  district_id?: string | null;
  town_id?: string | null;
}

interface SalonSettingsFormProps {
  salon: SalonData;
  staffCount: number;
  servicesCount: number;
}

export const SalonSettingsForm = ({ salon, staffCount, servicesCount }: SalonSettingsFormProps) => {
  const [formData, setFormData] = useState({
    name: salon.name || '',
    description: salon.description || '',
    address: salon.address || '',
    city: salon.city || '',
    phone: salon.phone || '',
    email: salon.email || '',
    latitude: salon.latitude,
    longitude: salon.longitude,
  });
  
  // Location hierarchy state
  const [selectedProvince, setSelectedProvince] = useState<string | null>(salon.province_id || null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(salon.district_id || null);
  const [selectedTown, setSelectedTown] = useState<string | null>(salon.town_id || null);
  
  const [coverPreview, setCoverPreview] = useState<string | null>(salon.cover_image);
  const [logoPreview, setLogoPreview] = useState<string | null>(salon.logo);
  const [uploading, setUploading] = useState<'cover' | 'logo' | null>(null);
  
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const updateSalon = useUpdateSalon();
  const uploadImage = useUploadSalonImage();
  const { latitude, longitude, loading: locationLoading, requestLocation } = useGeolocation();
  
  // Fetch location names for display
  const { data: towns } = useTowns(selectedDistrict);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (file: File, type: 'cover' | 'logo') => {
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    setUploading(type);
    
    try {
      const url = await uploadImage.mutateAsync({
        salonId: salon.id,
        file,
        type,
      });
      
      if (type === 'cover') {
        setCoverPreview(url);
      } else {
        setLogoPreview(url);
      }
      
      toast.success(`${type === 'cover' ? 'Cover image' : 'Logo'} updated!`);
    } catch (error) {
      toast.error(`Failed to upload ${type}`);
    } finally {
      setUploading(null);
    }
  };

  const handleUseCurrentLocation = async () => {
    await requestLocation();
    if (latitude && longitude) {
      setFormData(prev => ({
        ...prev,
        latitude,
        longitude,
      }));
      toast.success('Location updated!');
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Salon name is required');
      return;
    }
    
    // Update city based on selected town name
    let cityValue = formData.city;
    if (selectedTown && towns) {
      const selectedTownData = towns.find(t => t.id === selectedTown);
      if (selectedTownData) {
        cityValue = selectedTownData.name_en;
      }
    }
    
    await updateSalon.mutateAsync({
      salonId: salon.id,
      updates: {
        name: formData.name,
        description: formData.description || null,
        address: formData.address,
        city: cityValue,
        phone: formData.phone || null,
        email: formData.email || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        province_id: selectedProvince,
        district_id: selectedDistrict,
        town_id: selectedTown,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            Edit My Salon
          </h2>
          <p className="text-muted-foreground">Manage your salon details and settings</p>
        </div>
        <Button 
          onClick={handleSave} 
          className="gap-2 shadow-glow-rose"
          disabled={updateSalon.isPending}
        >
          {updateSalon.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Cover Image */}
      <Card className="glass-card border-border/50 overflow-hidden">
        <div className="relative h-48 sm:h-64 bg-muted/50">
          {coverPreview ? (
            <img
              src={coverPreview}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          
          <div className="absolute bottom-4 right-4">
            <input
              type="file"
              ref={coverInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'cover')}
            />
            <Button
              variant="secondary"
              className="gap-2 glass-card backdrop-blur-md"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploading === 'cover'}
            >
              {uploading === 'cover' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              Change Cover
            </Button>
          </div>
          
          {/* Logo overlapping cover */}
          <div className="absolute -bottom-12 left-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-background">
                <AvatarImage src={logoPreview || undefined} />
                <AvatarFallback className="text-2xl bg-primary/20">
                  {salon.name?.[0] || 'S'}
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                ref={logoInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'logo')}
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploading === 'logo'}
              >
                {uploading === 'logo' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Camera className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        <CardContent className="pt-16 pb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Logo & Cover Image</p>
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: Cover 1920x600, Logo 400x400
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                {staffCount} Staff
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Scissors className="h-3 w-3" />
                {servicesCount} Services
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Public URL */}
      {salon.slug && (
        <Card className="glass-card border-border/50 border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary" />
              Your Public Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Share this link with customers so they can view and book at your salon:
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 bg-background rounded-lg border border-border/50 font-mono text-sm break-all">
                {window.location.origin}/salon/{salon.slug}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/salon/${salon.slug}`);
                  toast.success('Link copied to clipboard!');
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => window.open(`/salon/${salon.slug}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 This URL is automatically generated from your salon name. It will update if you change the name.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Basic Info */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="font-serif text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Salon Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter salon name"
              className="bg-muted/50"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Tell customers about your salon..."
              className="bg-muted/50 min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+94 77 123 4567"
                  className="pl-10 bg-muted/50"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="salon@example.com"
                  className="pl-10 bg-muted/50"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Hierarchy Selector */}
          <div className="p-4 bg-muted/30 rounded-xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-primary" />
              Select Your Location
            </div>
            <LocationSelector
              selectedProvince={selectedProvince}
              selectedDistrict={selectedDistrict}
              selectedTown={selectedTown}
              onProvinceChange={setSelectedProvince}
              onDistrictChange={setSelectedDistrict}
              onTownChange={setSelectedTown}
              showLabels={true}
              required={true}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Street Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123 Main Street, Near Temple"
                className="bg-muted/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label>City (Auto-filled from Town)</Label>
              <Input
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Select town above"
                className="bg-muted/50"
                disabled={!!selectedTown}
              />
            </div>
          </div>
          
          {/* Coordinates */}
          <div className="p-4 bg-muted/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">GPS Coordinates</p>
                <p className="text-xs text-muted-foreground">
                  {formData.latitude && formData.longitude 
                    ? `${formData.latitude.toFixed(6)}, ${formData.longitude.toFixed(6)}`
                    : 'Not set - customers won\'t see distance'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleUseCurrentLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LocateFixed className="h-4 w-4" />
                )}
                Use Current Location
              </Button>
            </div>
            
            {formData.latitude && formData.longitude && (
              <Badge variant="secondary" className="bg-success/20 text-success">
                <Check className="h-3 w-3 mr-1" />
                Location Set
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
