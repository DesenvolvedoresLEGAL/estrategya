import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Filter, X } from "lucide-react";

interface InitiativesFilterProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  search: string;
  iceMin: number;
  iceMax: number;
  who: string;
  has5W2H: string; // 'all' | 'complete' | 'incomplete'
  quadrant: string; // 'all' | 'fazer_agora' | 'planejar' | ...
}

export const InitiativesFilter = ({ onFilterChange }: InitiativesFilterProps) => {
  const [expanded, setExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    iceMin: 0,
    iceMax: 1000,
    who: '',
    has5W2H: 'all',
    quadrant: 'all',
  });

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const defaultFilters: FilterState = {
      search: '',
      iceMin: 0,
      iceMax: 1000,
      who: '',
      has5W2H: 'all',
      quadrant: 'all',
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const hasActiveFilters = 
    filters.search !== '' ||
    filters.iceMin !== 0 ||
    filters.iceMax !== 1000 ||
    filters.who !== '' ||
    filters.has5W2H !== 'all' ||
    filters.quadrant !== 'all';

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-semibold">Filtros</Label>
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs">
                  Ativos
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="text-xs"
              >
                {expanded ? 'Minimizar' : 'Expandir'}
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm">Buscar</Label>
            <Input
              id="search"
              placeholder="Pesquisar por título ou descrição..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>

          {expanded && (
            <>
              {/* ICE Score Range */}
              <div className="space-y-3">
                <Label className="text-sm">ICE Score: {filters.iceMin} - {filters.iceMax}</Label>
                <div className="px-2">
                  <Slider
                    value={[filters.iceMin, filters.iceMax]}
                    onValueChange={(value) => {
                      updateFilter('iceMin', value[0]);
                      updateFilter('iceMax', value[1]);
                    }}
                    min={0}
                    max={1000}
                    step={50}
                    className="[&_[role=slider]]:bg-primary"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>500</span>
                  <span>1000</span>
                </div>
              </div>

              {/* Who (Responsável) */}
              <div className="space-y-2">
                <Label htmlFor="who" className="text-sm">Responsável</Label>
                <Input
                  id="who"
                  placeholder="Ex: Gerente de Marketing"
                  value={filters.who}
                  onChange={(e) => updateFilter('who', e.target.value)}
                />
              </div>

              {/* Status 5W2H */}
              <div className="space-y-2">
                <Label htmlFor="has5w2h" className="text-sm">Status 5W2H</Label>
                <Select value={filters.has5W2H} onValueChange={(value) => updateFilter('has5W2H', value)}>
                  <SelectTrigger id="has5w2h">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="complete">Completo</SelectItem>
                    <SelectItem value="incomplete">Incompleto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quadrante */}
              <div className="space-y-2">
                <Label htmlFor="quadrant" className="text-sm">Quadrante de Prioridade</Label>
                <Select value={filters.quadrant} onValueChange={(value) => updateFilter('quadrant', value)}>
                  <SelectTrigger id="quadrant">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="fazer_agora">Fazer Agora</SelectItem>
                    <SelectItem value="planejar">Planejar</SelectItem>
                    <SelectItem value="oportunidades_rapidas">Quick Wins</SelectItem>
                    <SelectItem value="evitar">Evitar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
