import { useMemo } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProvinces, useDistricts, useTowns } from '@/hooks/useLocations';

interface LocationSelectorProps {
  selectedProvince: string | null;
  selectedDistrict: string | null;
  selectedTown: string | null;
  onProvinceChange: (id: string | null) => void;
  onDistrictChange: (id: string | null) => void;
  onTownChange: (id: string | null) => void;
  showLabels?: boolean;
  showClearButton?: boolean;
  compact?: boolean;
  required?: boolean;
}

export const LocationSelector = ({
  selectedProvince,
  selectedDistrict,
  selectedTown,
  onProvinceChange,
  onDistrictChange,
  onTownChange,
  showLabels = true,
  showClearButton = false,
  compact = false,
  required = false,
}: LocationSelectorProps) => {
  const { data: provinces, isLoading: provincesLoading } = useProvinces();
  const { data: districts, isLoading: districtsLoading } = useDistricts(selectedProvince);
  const { data: towns, isLoading: townsLoading } = useTowns(selectedDistrict);

  const handleProvinceChange = (value: string) => {
    onProvinceChange(value === 'all' ? null : value);
    onDistrictChange(null);
    onTownChange(null);
  };

  const handleDistrictChange = (value: string) => {
    onDistrictChange(value === 'all' ? null : value);
    onTownChange(null);
  };

  const handleTownChange = (value: string) => {
    onTownChange(value === 'all' ? null : value);
  };

  const handleClear = () => {
    onProvinceChange(null);
    onDistrictChange(null);
    onTownChange(null);
  };

  const hasSelection = selectedProvince || selectedDistrict || selectedTown;

  const gridClass = compact 
    ? 'grid grid-cols-1 sm:grid-cols-3 gap-2' 
    : 'space-y-4';

  return (
    <div className={compact ? 'space-y-2' : 'space-y-4'}>
      {showLabels && !compact && (
        <div className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="h-4 w-4 text-primary" />
          Filter by Location
        </div>
      )}

      <div className={gridClass}>
        {/* Province Select */}
        <div className={compact ? '' : 'space-y-2'}>
          {showLabels && !compact && (
            <Label className="text-sm text-muted-foreground">
              Province {required && '*'}
            </Label>
          )}
          <Select
            value={selectedProvince || 'all'}
            onValueChange={handleProvinceChange}
          >
            <SelectTrigger className={compact ? 'h-9' : 'bg-muted/50'}>
              <SelectValue placeholder="Select Province">
                {provincesLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading...
                  </span>
                ) : selectedProvince ? (
                  provinces?.find(p => p.id === selectedProvince)?.name_en
                ) : (
                  'All Provinces'
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Provinces</SelectItem>
              {provinces?.map((province) => (
                <SelectItem key={province.id} value={province.id}>
                  {province.name_en} ({province.name_si})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* District Select */}
        <div className={compact ? '' : 'space-y-2'}>
          {showLabels && !compact && (
            <Label className="text-sm text-muted-foreground">
              District {required && '*'}
            </Label>
          )}
          <Select
            value={selectedDistrict || 'all'}
            onValueChange={handleDistrictChange}
            disabled={!selectedProvince}
          >
            <SelectTrigger className={`${compact ? 'h-9' : 'bg-muted/50'} ${!selectedProvince ? 'opacity-50' : ''}`}>
              <SelectValue placeholder="Select District">
                {districtsLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading...
                  </span>
                ) : selectedDistrict ? (
                  districts?.find(d => d.id === selectedDistrict)?.name_en
                ) : (
                  'All Districts'
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {districts?.map((district) => (
                <SelectItem key={district.id} value={district.id}>
                  {district.name_en} ({district.name_si})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Town Select */}
        <div className={compact ? '' : 'space-y-2'}>
          {showLabels && !compact && (
            <Label className="text-sm text-muted-foreground">
              Town {required && '*'}
            </Label>
          )}
          <Select
            value={selectedTown || 'all'}
            onValueChange={handleTownChange}
            disabled={!selectedDistrict}
          >
            <SelectTrigger className={`${compact ? 'h-9' : 'bg-muted/50'} ${!selectedDistrict ? 'opacity-50' : ''}`}>
              <SelectValue placeholder="Select Town">
                {townsLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading...
                  </span>
                ) : selectedTown ? (
                  towns?.find(t => t.id === selectedTown)?.name_en
                ) : (
                  'All Towns'
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Towns</SelectItem>
              {towns?.map((town) => (
                <SelectItem key={town.id} value={town.id}>
                  {town.name_en} ({town.name_si})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Clear Button */}
      {showClearButton && hasSelection && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground hover:text-foreground"
          onClick={handleClear}
        >
          <X className="h-3 w-3" />
          Clear Location Filter
        </Button>
      )}
    </div>
  );
};

export default LocationSelector;
