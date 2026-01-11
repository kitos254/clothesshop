/**
 * Utility functions for managing variation combination pricing and grouping
 */

interface VariationDefinition {
  _id?: string;
  name: string;
  affectsPrice: boolean;
  affectsStock: boolean;
  values: Array<{
    value: string;
    displayName?: string;
    colorCode?: string;
    image?: string;
    isActive: boolean;
    displayOrder: number;
  }>;
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

export class CombinationPricingHelper {
  /**
   * Generate a price group key based on variations that affect price
   */
  static generatePriceGroupKey(
    combination: VariationCombination, 
    definitions: VariationDefinition[]
  ): string {
    const priceAffectingVariations = definitions.filter(d => d.affectsPrice);
    const priceValues = combination.combination
      .filter(c => priceAffectingVariations.some(d => d.name === c.variationName))
      .map(c => `${c.variationName}:${c.value}`)
      .sort()
      .join('|');
    
    return priceValues || 'base-price';
  }

  /**
   * Group combinations by their price-affecting variations
   */
  static groupCombinationsByPrice(
    combinations: VariationCombination[],
    definitions: VariationDefinition[]
  ): Map<string, VariationCombination[]> {
    const groups = new Map<string, VariationCombination[]>();
    
    combinations.forEach(combination => {
      const key = this.generatePriceGroupKey(combination, definitions);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(combination);
    });
    
    return groups;
  }

  /**
   * Sync prices across combinations in the same price group
   */
  static syncPricesInGroup(
    combinations: VariationCombination[],
    definitions: VariationDefinition[],
    updatedCombinationIndex: number,
    newPrice: number,
    priceField: 'price' | 'comparePrice' | 'costPrice'
  ): VariationCombination[] {
    const updatedCombinations = [...combinations];
    const targetCombination = updatedCombinations[updatedCombinationIndex];
    const priceGroupKey = this.generatePriceGroupKey(targetCombination, definitions);
    
    // Find all combinations in the same price group
    updatedCombinations.forEach((combination, index) => {
      const combinationPriceKey = this.generatePriceGroupKey(combination, definitions);
      if (combinationPriceKey === priceGroupKey) {
        (combination as any)[priceField] = newPrice;
      }
    });
    
    return updatedCombinations;
  }

  /**
   * Generate display name for a price group
   */
  static getPriceGroupDisplayName(
    priceGroupKey: string,
    definitions: VariationDefinition[]
  ): string {
    if (priceGroupKey === 'base-price') {
      return 'Base Price (No variations affect price)';
    }
    
    const priceAffectingVariations = definitions.filter(d => d.affectsPrice);
    if (priceAffectingVariations.length === 0) {
      return 'Base Price';
    }
    
    // Parse the key back to readable format
    const parts = priceGroupKey.split('|');
    const values = parts.map(part => {
      const [variationName, value] = part.split(':');
      return `${variationName}: ${value}`;
    });
    
    return values.join(', ');
  }

  /**
   * Calculate expected number of distinct prices
   */
  static calculateExpectedPriceGroups(definitions: VariationDefinition[]): number {
    const priceAffectingVariations = definitions.filter(d => d.affectsPrice && d.isActive);
    
    if (priceAffectingVariations.length === 0) {
      return 1; // Only base price
    }
    
    return priceAffectingVariations.reduce((total, variation) => {
      const activeValues = variation.values.filter(v => v.isActive).length;
      return total * Math.max(1, activeValues);
    }, 1);
  }

  /**
   * Get combinations that share the same price group as the given combination
   */
  static getRelatedPriceCombinations(
    targetCombination: VariationCombination,
    allCombinations: VariationCombination[],
    definitions: VariationDefinition[]
  ): VariationCombination[] {
    const targetKey = this.generatePriceGroupKey(targetCombination, definitions);
    
    return allCombinations.filter(combination => {
      const key = this.generatePriceGroupKey(combination, definitions);
      return key === targetKey;
    });
  }
}
