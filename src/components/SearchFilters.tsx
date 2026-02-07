import { motion } from 'framer-motion';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface SearchFiltersProps {
  onSearch?: (query: string) => void;
  onFilterChange?: (filter: string, value: string) => void;
}

export const SearchFilters = ({ onSearch, onFilterChange }: SearchFiltersProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const categories = [
    { id: 'haircut', label: 'Haircut' },
    { id: 'coloring', label: 'Coloring' },
    { id: 'spa', label: 'Spa' },
    { id: 'nails', label: 'Nails' },
    { id: 'makeup', label: 'Makeup' },
  ];

  const toggleFilter = (filterId: string) => {
    setActiveFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((f) => f !== filterId)
        : [...prev, filterId]
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 md:p-6 space-y-4"
    >
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search salons, services, or stylists..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearch?.(e.target.value);
            }}
            className="pl-10 bg-muted/50 border-border/50 focus:border-primary"
          />
        </div>
        <Button variant="outline" className="gap-2 hidden md:flex">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Select onValueChange={(value) => onFilterChange?.('sort', value)}>
          <SelectTrigger className="w-[140px] bg-muted/50 border-border/50">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="distance">Nearest</SelectItem>
            <SelectItem value="rating">Top Rated</SelectItem>
            <SelectItem value="price_low">Price: Low</SelectItem>
            <SelectItem value="price_high">Price: High</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(value) => onFilterChange?.('price', value)}>
          <SelectTrigger className="w-[140px] bg-muted/50 border-border/50">
            <SelectValue placeholder="Price Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="budget">Budget</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
            <SelectItem value="luxury">Luxury</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        {categories.map((category) => (
          <Badge
            key={category.id}
            variant={activeFilters.includes(category.id) ? 'default' : 'outline'}
            className={`cursor-pointer transition-all ${
              activeFilters.includes(category.id)
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
            onClick={() => toggleFilter(category.id)}
          >
            {category.label}
          </Badge>
        ))}
      </div>
    </motion.div>
  );
};

export default SearchFilters;
