import React, { useState, useEffect } from 'react';
import { Plus, X, Edit, Save, Trash2, RefreshCw, DollarSign, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { VariationPricingCalculator } from '@/utils/variationPricingCalculator';
import { CombinationPricingHelper } from '@/utils/combinationPricingHelper';
import { formatCurrency, formatPriceRange } from '@/utils/currency';
import axios from '@/lib/axios';

interface VariationValue {
  value: string;
  displayName?: string;
  colorCode?: string;
  image?: string;
  isActive: boolean;
  displayOrder: number;
}

interface VariationDefinition {
  _id?: string;
  name: string;
  displayOrder: number;
  affectsPrice: boolean;
  affectsStock: boolean;
  values: VariationValue[];
  isActive: boolean;
}

interface VariationCombination {
  _id?: string;
  combination: Array<{
    variationId: string;
    variationName: string;
    value: string;
  }>;
  sku?: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  stock: {
    quantity: number;
    reserved: number;
  };
  isActive: boolean;
  isDefault: boolean;
}

interface ProductVariationsProps {
  productId?: string;
  variationDefinitions: VariationDefinition[];
  variationCombinations: VariationCombination[];
  basePrice: number;
  baseComparePrice: number;
  baseCostPrice: number;
  onVariationsChange: (definitions: VariationDefinition[], combinations: VariationCombination[]) => void;
  mode: 'create' | 'edit';
}

const ProductVariations: React.FC<ProductVariationsProps> = ({
  productId,
  variationDefinitions = [],
  variationCombinations = [],
  basePrice,
  baseComparePrice,
  baseCostPrice,
  onVariationsChange,
  mode
}) => {
  const { toast } = useToast();
  const [definitions, setDefinitions] = useState<VariationDefinition[]>(variationDefinitions);
  const [combinations, setCombinations] = useState<VariationCombination[]>(variationCombinations);
  const [editingDefinition, setEditingDefinition] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<VariationDefinition>>({});
  const [newVariation, setNewVariation] = useState({
    name: '',
    affectsPrice: false,
    affectsStock: true,
    values: []
  });
  const [showNewVariation, setShowNewVariation] = useState(false);

  useEffect(() => {
    setDefinitions(variationDefinitions);
    setCombinations(variationCombinations);
  }, [variationDefinitions, variationCombinations]);

  // Generate all possible combinations from definitions
  const generateCombinations = (definitions: VariationDefinition[]): VariationCombination[] => {
    if (definitions.length === 0) return [];

    const activeDefinitions = definitions.filter(d => d.isActive && d.values.some(v => v.isActive));
    if (activeDefinitions.length === 0) return [];

    // If only one variation and it has values, create combinations for each value
    if (activeDefinitions.length === 1) {
      const definition = activeDefinitions[0];
      const activeValues = definition.values.filter(v => v.isActive);
      
      return activeValues.map((value, index) => ({
        combination: [{
          variationId: definition._id || `temp-${definition.name}`,
          variationName: definition.name,
          value: value.value
        }],
        sku: `${value.value.substring(0, 2).toUpperCase()}`,
        price: basePrice || 0,
        comparePrice: baseComparePrice || 0,
        costPrice: baseCostPrice || 0,
        stock: { quantity: 0, reserved: 0 },
        isActive: true,
        isDefault: index === 0
      }));
    }

    // For multiple variations, generate all combinations
    function generateCombos(defIndex: number, currentCombo: any[]): any[] {
      if (defIndex === activeDefinitions.length) {
        return [currentCombo];
      }

      const definition = activeDefinitions[defIndex];
      const activeValues = definition.values.filter(v => v.isActive);
      const combos: any[] = [];

      for (const value of activeValues) {
        const newCombo = [
          ...currentCombo,
          {
            variationId: definition._id || `temp-${definition.name}`,
            variationName: definition.name,
            value: value.value
          }
        ];
        combos.push(...generateCombos(defIndex + 1, newCombo));
      }

      return combos;
    }

    const allCombinations = generateCombos(0, []);
    
    return allCombinations.map((combination, index) => ({
      combination,
      sku: `${combination.map((c: any) => c.value.substring(0, 2).toUpperCase()).join('-')}`,
      price: basePrice || 0,
      comparePrice: baseComparePrice || 0,
      costPrice: baseCostPrice || 0,
      stock: { quantity: 0, reserved: 0 },
      isActive: true,
      isDefault: index === 0
    }));
  };

  const addVariationDefinition = () => {
    if (!newVariation.name.trim()) {
      toast({
        title: "Error",
        description: "Variation name is required",
        variant: "destructive",
      });
      return;
    }

    if (definitions.length >= 5) {
      toast({
        title: "Error",
        description: "Maximum 5 variations are allowed",
        variant: "destructive",
      });
      return;
    }

    const existingVariation = definitions.find(d => 
      d.name.toLowerCase() === newVariation.name.toLowerCase()
    );
    
    if (existingVariation) {
      toast({
        title: "Error",
        description: "Variation with this name already exists",
        variant: "destructive",
      });
      return;
    }

    const variationDefinition: VariationDefinition = {
      _id: `temp-${Date.now()}`,
      name: newVariation.name,
      displayOrder: definitions.length,
      affectsPrice: newVariation.affectsPrice,
      affectsStock: newVariation.affectsStock,
      values: [],
      isActive: true
    };

    const updatedDefinitions = [...definitions, variationDefinition];
    setDefinitions(updatedDefinitions);
    
    // Don't auto-generate combinations yet - let user add values first
    onVariationsChange(updatedDefinitions, combinations);
    
    setNewVariation({ name: '', affectsPrice: false, affectsStock: true, values: [] });
    setShowNewVariation(false);
  };

  const startEditingVariation = (definitionIndex: number) => {
    const definition = definitions[definitionIndex];
    setEditingDefinition(definition._id || `temp-${definitionIndex}`);
    setEditingData({
      name: definition.name,
      affectsPrice: definition.affectsPrice,
      affectsStock: definition.affectsStock
    });
  };

  const saveVariationEdit = async (definitionIndex: number) => {
    if (!editingData.name?.trim()) {
      toast({
        title: "Error",
        description: "Variation name is required",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate names (excluding current variation)
    const existingVariation = definitions.find((d, index) => 
      index !== definitionIndex && 
      d.name.toLowerCase() === editingData.name!.toLowerCase()
    );
    
    if (existingVariation) {
      toast({
        title: "Error",
        description: "Variation with this name already exists",
        variant: "destructive",
      });
      return;
    }

    const updatedDefinitions = [...definitions];
    const originalDefinition = updatedDefinitions[definitionIndex];
    
    updatedDefinitions[definitionIndex] = {
      ...originalDefinition,
      name: editingData.name!,
      affectsPrice: editingData.affectsPrice!,
      affectsStock: editingData.affectsStock!
    };

    // If in edit mode and we have a product ID, sync with backend
    if (mode === 'edit' && productId && originalDefinition._id) {
      try {
        const response = await axios.put(`/products/${productId}/variations/${originalDefinition._id}`, {
          name: editingData.name,
          affectsPrice: editingData.affectsPrice,
          affectsStock: editingData.affectsStock
        });

        if (response.data.success) {
          // Update with server response
          setDefinitions(response.data.data.variationDefinitions || updatedDefinitions);
          setCombinations(response.data.data.variationCombinations || combinations);
          onVariationsChange(
            response.data.data.variationDefinitions || updatedDefinitions, 
            response.data.data.variationCombinations || combinations
          );

          if (response.data.meta?.priceStockSettingsChanged) {
            toast({
              title: "Settings Updated",
              description: response.data.meta.suggestion || "Variation updated successfully",
            });
          } else {
            toast({
              title: "Success",
              description: "Variation updated successfully",
            });
          }
        }
      } catch (error: any) {
        console.error('Error updating variation:', error);
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to update variation",
          variant: "destructive",
        });
        return;
      }
    } else {
      // For create mode, just update locally
      setDefinitions(updatedDefinitions);
      
      // If price/stock settings changed, regenerate combinations to reflect changes
      const newCombinations = generateCombinations(updatedDefinitions);
      setCombinations(newCombinations);
      onVariationsChange(updatedDefinitions, newCombinations);
      
      toast({
        title: "Success",
        description: "Variation updated successfully",
      });
    }
    
    setEditingDefinition(null);
    setEditingData({});
  };

  const cancelVariationEdit = () => {
    setEditingDefinition(null);
    setEditingData({});
  };

  const removeVariationDefinition = (index: number) => {
    const updatedDefinitions = definitions.filter((_, i) => i !== index);
    setDefinitions(updatedDefinitions);
    
    // Regenerate combinations without this variation
    const newCombinations = generateCombinations(updatedDefinitions);
    setCombinations(newCombinations);
    onVariationsChange(updatedDefinitions, newCombinations);
  };

  const addVariationValue = (definitionIndex: number, value: string) => {
    if (!value.trim()) return;

    const updatedDefinitions = [...definitions];
    const definition = updatedDefinitions[definitionIndex];
    
    // Check if value already exists
    if (definition.values.some(v => v.value.toLowerCase() === value.toLowerCase())) {
      toast({
        title: "Error",
        description: "This value already exists",
        variant: "destructive",
      });
      return;
    }

    definition.values.push({
      value: value.trim(),
      isActive: true,
      displayOrder: definition.values.length
    });

    setDefinitions(updatedDefinitions);
    
    // Regenerate combinations with new value
    const newCombinations = generateCombinations(updatedDefinitions);
    setCombinations(newCombinations);
    onVariationsChange(updatedDefinitions, newCombinations);
  };

  const removeVariationValue = (definitionIndex: number, valueIndex: number) => {
    const updatedDefinitions = [...definitions];
    updatedDefinitions[definitionIndex].values.splice(valueIndex, 1);
    
    setDefinitions(updatedDefinitions);
    
    // Regenerate combinations without this value
    const newCombinations = generateCombinations(updatedDefinitions);
    setCombinations(newCombinations);
    onVariationsChange(updatedDefinitions, newCombinations);
  };

  const updateCombinationPrice = (combinationIndex: number, field: string, value: number) => {
    let updatedCombinations = [...combinations];
    
    if (field === 'stock.quantity') {
      updatedCombinations[combinationIndex].stock.quantity = value;
    } else if (field === 'price' || field === 'comparePrice' || field === 'costPrice') {
      // Use smart price syncing for price fields
      updatedCombinations = CombinationPricingHelper.syncPricesInGroup(
        updatedCombinations,
        definitions,
        combinationIndex,
        value,
        field as 'price' | 'comparePrice' | 'costPrice'
      );
    } else {
      (updatedCombinations[combinationIndex] as any)[field] = value;
    }
    
    setCombinations(updatedCombinations);
    onVariationsChange(definitions, updatedCombinations);
  };

  const setDefaultCombination = (combinationIndex: number) => {
    const updatedCombinations = combinations.map((combo, index) => ({
      ...combo,
      isDefault: index === combinationIndex
    }));
    
    setCombinations(updatedCombinations);
    onVariationsChange(definitions, updatedCombinations);
  };

  const removeCombination = (combinationIndex: number) => {
    const combinationToRemove = combinations[combinationIndex];
    const updatedCombinations = combinations.filter((_, index) => index !== combinationIndex);
    
    // If we removed the default combination, set the first remaining as default
    if (combinationToRemove.isDefault && updatedCombinations.length > 0) {
      updatedCombinations[0].isDefault = true;
    }
    
    setCombinations(updatedCombinations);
    onVariationsChange(definitions, updatedCombinations);
    
    toast({
      title: "Success",
      description: "Combination removed successfully",
    });
  };

  const applySuggestedPricing = () => {
    if (definitions.length === 0) return;
    
    const suggestions = VariationPricingCalculator.generatePricingSuggestions(basePrice, definitions);
    const updatedCombinations = combinations.map(combo => {
      let suggestedPrice = basePrice;
      
      // Apply suggestions for price-affecting variations
      combo.combination.forEach(comboVar => {
        const key = `${comboVar.variationName}:${comboVar.value}`;
        const modifier = suggestions.get(key);
        if (modifier !== undefined) {
          suggestedPrice += modifier;
        }
      });
      
      return {
        ...combo,
        price: Math.max(0, suggestedPrice)
      };
    });
    
    setCombinations(updatedCombinations);
    onVariationsChange(definitions, updatedCombinations);
    
    toast({
      title: "Success",
      description: "Applied suggested pricing based on variation types",
    });
  };

  const validatePricing = () => {
    const issues = VariationPricingCalculator.validateCombinationPricing(
      combinations, 
      definitions, 
      basePrice
    );
    
    if (issues.length === 0) {
      toast({
        title: "Validation Passed",
        description: "All combination pricing looks good!",
      });
    } else {
      const errors = issues.filter(i => i.severity === 'error').length;
      const warnings = issues.filter(i => i.severity === 'warning').length;
      
      toast({
        title: "Pricing Issues Found",
        description: `Found ${errors} errors and ${warnings} warnings in pricing`,
        variant: errors > 0 ? "destructive" : "default"
      });
    }
    
    return issues;
  };

  const regenerateAllCombinations = () => {
    const newCombinations = generateCombinations(definitions);
    setCombinations(newCombinations);
    onVariationsChange(definitions, newCombinations);
    
    toast({
      title: "Success",
      description: `Generated ${newCombinations.length} combinations`,
    });
  };

  return (
    <div className="space-y-2 px-0">
      {/* Variation Definitions */}
      <div>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Variation Definitions ({definitions.length}/5)</CardTitle>
            <Button
              type="button"
              onClick={() => setShowNewVariation(!showNewVariation)}
              disabled={definitions.length >= 5}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Variation
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Variation */}
          {showNewVariation && (
            <Card className="border-dashed">
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Variation Name</Label>
                    <Input
                      value={newVariation.name}
                      onChange={(e) => setNewVariation({ ...newVariation, name: e.target.value })}
                      placeholder="e.g., Color, Size, Material"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Affects Price</Label>
                      <Switch
                        checked={newVariation.affectsPrice}
                        onCheckedChange={(checked) => 
                          setNewVariation({ ...newVariation, affectsPrice: checked })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>Affects Stock</Label>
                      <Switch
                        checked={newVariation.affectsStock}
                        onCheckedChange={(checked) => 
                          setNewVariation({ ...newVariation, affectsStock: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button type="button" onClick={addVariationDefinition} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save Variation
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowNewVariation(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Variations */}
          {definitions.map((definition, defIndex) => {
            const isEditing = editingDefinition === (definition._id || `temp-${defIndex}`);
            
            return (
              <Card key={definition._id || defIndex}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editingData.name || ''}
                          onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                          className="max-w-xs"
                          placeholder="Variation name"
                        />
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => saveVariationEdit(defIndex)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={cancelVariationEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{definition.name}</CardTitle>
                        {definition.affectsPrice && (
                          <Badge variant="secondary">Affects Price</Badge>
                        )}
                        {definition.affectsStock && (
                          <Badge variant="outline">Affects Stock</Badge>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditingVariation(defIndex)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeVariationDefinition(defIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Edit settings when in edit mode */}
                  {isEditing && (
                    <div className="flex gap-4 mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Affects Price</Label>
                        <Switch
                          checked={editingData.affectsPrice || false}
                          onCheckedChange={(checked) => 
                            setEditingData({ ...editingData, affectsPrice: checked })
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Affects Stock</Label>
                        <Switch
                          checked={editingData.affectsStock !== false} // Default to true
                          onCheckedChange={(checked) => 
                            setEditingData({ ...editingData, affectsStock: checked })
                          }
                        />
                      </div>
                    </div>
                  )}
                </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Label>Values</Label>
                  
                  {/* Add Value Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder={`Add ${definition.name.toLowerCase()} value...`}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addVariationValue(defIndex, e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input?.value) {
                          addVariationValue(defIndex, input.value);
                          input.value = '';
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Existing Values */}
                  <div className="flex flex-wrap gap-2">
                    {definition.values.map((value, valueIndex) => (
                      <Badge
                        key={valueIndex}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {value.displayName || value.value}
                        <button
                          type="button"
                          onClick={() => removeVariationValue(defIndex, valueIndex)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        </CardContent>
      </div>

      {/* Variation Combinations */}
      {definitions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Variation Combinations ({combinations.length})
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {definitions.some(d => d.affectsPrice) 
                    ? `Set individual prices for each combination where variations affect pricing. Expected ${CombinationPricingHelper.calculateExpectedPriceGroups(definitions)} distinct price groups.`
                    : "Variations created - no individual pricing needed as variations don't affect price"
                  }
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={applySuggestedPricing}
                  size="sm"
                  variant="outline"
                  disabled={combinations.length === 0 || !definitions.some(d => d.affectsPrice)}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Suggest Pricing
                </Button>
                <Button
                  type="button"
                  onClick={validatePricing}
                  size="sm"
                  variant="outline"
                  disabled={combinations.length === 0}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Validate
                </Button>
                <Button
                  type="button"
                  onClick={regenerateAllCombinations}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {combinations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Add values to your variations to generate combinations
              </div>
            ) : (
              <div className="space-y-4">
                {/* Pricing Summary */}
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {definitions.some(d => d.affectsPrice) && (
                        <>
                          <div>
                            <Label className="text-xs text-muted-foreground">Price Range</Label>
                            <p className="font-medium">
                              {formatPriceRange(
                                VariationPricingCalculator.calculatePriceRange(combinations).min,
                                VariationPricingCalculator.calculatePriceRange(combinations).max
                              )}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Price Groups</Label>
                            <p className="font-medium">
                              {CombinationPricingHelper.groupCombinationsByPrice(combinations, definitions).size} distinct prices
                            </p>
                          </div>
                        </>
                      )}
                      {definitions.some(d => d.affectsStock) && (
                        <>
                          <div>
                            <Label className="text-xs text-muted-foreground">Total Stock</Label>
                            <p className="font-medium">
                              {VariationPricingCalculator.calculateTotalStock(combinations)} units
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Low Stock</Label>
                            <p className="font-medium text-orange-600">
                              {VariationPricingCalculator.findLowStockCombinations(combinations).length} combinations
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Out of Stock</Label>
                            <p className="font-medium text-red-600">
                              {VariationPricingCalculator.findOutOfStockCombinations(combinations).length} combinations
                            </p>
                          </div>
                        </>
                      )}
                      {!definitions.some(d => d.affectsPrice) && !definitions.some(d => d.affectsStock) && (
                        <div className="col-span-full text-center py-2 text-muted-foreground">
                          <p>Variations are for display purposes only - they don't affect pricing or stock.</p>
                          <p className="text-xs mt-1">Enable "Affects Price" or "Affects Stock" in variation settings to manage them.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Combinations List */}
                {combinations.map((combination, index) => {
                  const priceGroupKey = CombinationPricingHelper.generatePriceGroupKey(combination, definitions);
                  const relatedCombinations = CombinationPricingHelper.getRelatedPriceCombinations(
                    combination, 
                    combinations, 
                    definitions
                  );
                  const priceGroupSize = relatedCombinations.length;
                  const priceGroupName = CombinationPricingHelper.getPriceGroupDisplayName(priceGroupKey, definitions);
                  
                  return (
                    <Card key={index} className={combination.isDefault ? 'border-primary' : ''}>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Combination Details */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">
                                {combination.combination.map(c => c.value).join(' × ')}
                              </h4>
                              {combination.isDefault && (
                                <Badge variant="default">Default</Badge>
                              )}
                              {priceGroupSize > 1 && (
                                <Badge variant="secondary" className="text-xs">
                                  Shared Price ({priceGroupSize})
                                </Badge>
                              )}
                            </div>
                            
                            {priceGroupSize > 1 && (
                              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                <strong>Price Group:</strong> {priceGroupName}
                                <br />
                                <span className="text-blue-600">
                                  Price changes will sync across {priceGroupSize} combinations
                                </span>
                              </div>
                            )}
                            
                            <div className="text-sm text-muted-foreground">
                              SKU: {combination.sku}
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setDefaultCombination(index)}
                                disabled={combination.isDefault}
                              >
                                Set as Default
                              </Button>
                              
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeCombination(index)}
                                disabled={combinations.length <= 1}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>

                        {/* Pricing and Stock */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Only show price inputs if any variation affects price */}
                          {definitions.some(d => d.affectsPrice) && (
                            <>
                              <div className="space-y-2">
                                <Label className="text-xs">Price (KSH)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={combination.price}
                                  onChange={(e) => updateCombinationPrice(
                                    index, 
                                    'price', 
                                    parseFloat(e.target.value) || 0
                                  )}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-xs">Compare Price (KSH)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={combination.comparePrice || ''}
                                  onChange={(e) => updateCombinationPrice(
                                    index, 
                                    'comparePrice', 
                                    parseFloat(e.target.value) || 0
                                  )}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-xs">Cost Price (KSH)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={combination.costPrice || ''}
                                  onChange={(e) => updateCombinationPrice(
                                    index, 
                                    'costPrice', 
                                    parseFloat(e.target.value) || 0
                                  )}
                                />
                              </div>
                            </>
                          )}
                          
                          {/* Only show stock input if any variation affects stock */}
                          {definitions.some(d => d.affectsStock) && (
                            <div className="space-y-2">
                              <Label className="text-xs">Stock Quantity</Label>
                              <Input
                                type="number"
                                min="0"
                                value={combination.stock.quantity}
                                onChange={(e) => updateCombinationPrice(
                                  index, 
                                  'stock.quantity', 
                                  parseInt(e.target.value) || 0
                                )}
                              />
                            </div>
                          )}
                          
                          {/* Show message if no pricing or stock management */}
                          {!definitions.some(d => d.affectsPrice) && !definitions.some(d => d.affectsStock) && (
                            <div className="col-span-2 text-center py-4 text-muted-foreground text-sm">
                              This variation doesn't affect pricing or stock. 
                              <br />
                              Enable "Affects Price" or "Affects Stock" in variation settings to manage them here.
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductVariations;
