/**
 * Utility functions for calculating and validating product variation pricing
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

interface PricingMode {
  mode: 'base' | 'combination' | 'mixed';
  description: string;
}

export class VariationPricingCalculator {
  /**
   * Determine the pricing mode based on variation definitions
   */
  static determinePricingMode(variations: VariationDefinition[]): PricingMode {
    const priceAffectingVariations = variations.filter(v => v.affectsPrice && v.isActive);
    
    if (priceAffectingVariations.length === 0) {
      return {
        mode: 'base',
        description: 'All combinations use the base product price'
      };
    }
    
    if (priceAffectingVariations.length === variations.filter(v => v.isActive).length) {
      return {
        mode: 'combination',
        description: 'Each combination has individual pricing'
      };
    }
    
    return {
      mode: 'mixed',
      description: 'Some variations affect price, others use base price'
    };
  }

  /**
   * Calculate price for a specific combination based on pricing mode
   */
  static calculateCombinationPrice(
    combination: VariationCombination,
    basePrice: number,
    variations: VariationDefinition[],
    pricingRules?: Map<string, number>
  ): number {
    const pricingMode = this.determinePricingMode(variations);
    
    switch (pricingMode.mode) {
      case 'base':
        return basePrice;
        
      case 'combination':
        return combination.price || basePrice;
        
      case 'mixed':
        return this.calculateMixedPrice(combination, basePrice, variations, pricingRules);
        
      default:
        return basePrice;
    }
  }

  /**
   * Calculate price for mixed pricing mode (some variations affect price)
   */
  private static calculateMixedPrice(
    combination: VariationCombination,
    basePrice: number,
    variations: VariationDefinition[],
    pricingRules?: Map<string, number>
  ): number {
    let calculatedPrice = basePrice;
    
    // Find variations that affect price in this combination
    const priceAffectingValues = combination.combination.filter(combo => {
      const variation = variations.find(v => v.name === combo.variationName);
      return variation?.affectsPrice;
    });
    
    // Apply pricing rules if provided
    if (pricingRules) {
      priceAffectingValues.forEach(comboValue => {
        const ruleKey = `${comboValue.variationName}:${comboValue.value}`;
        const priceModifier = pricingRules.get(ruleKey);
        
        if (priceModifier !== undefined) {
          calculatedPrice += priceModifier;
        }
      });
    }
    
    return Math.max(0, calculatedPrice);
  }

  /**
   * Validate combination pricing consistency
   */
  static validateCombinationPricing(
    combinations: VariationCombination[],
    variations: VariationDefinition[],
    basePrice: number
  ): Array<{ combinationId: string; issue: string; severity: 'warning' | 'error' }> {
    const issues: Array<{ combinationId: string; issue: string; severity: 'warning' | 'error' }> = [];
    
    combinations.forEach(combination => {
      const combinationId = combination._id || 'unknown';
      
      // Check for negative prices
      if (combination.price < 0) {
        issues.push({
          combinationId,
          issue: 'Price cannot be negative',
          severity: 'error'
        });
      }
      
      // Check for compare price consistency
      if (combination.comparePrice && combination.comparePrice <= combination.price) {
        issues.push({
          combinationId,
          issue: 'Compare price should be higher than sale price',
          severity: 'warning'
        });
      }
      
      // Check for cost price consistency
      if (combination.costPrice && combination.costPrice > combination.price) {
        issues.push({
          combinationId,
          issue: 'Cost price is higher than sale price (negative margin)',
          severity: 'warning'
        });
      }
      
      // Check for significant price variations without price-affecting variations
      const pricingMode = this.determinePricingMode(variations);
      if (pricingMode.mode === 'base') {
        const priceVariance = Math.abs(combination.price - basePrice) / basePrice;
        if (priceVariance > 0.1) { // More than 10% variance
          issues.push({
            combinationId,
            issue: 'Significant price difference without price-affecting variations',
            severity: 'warning'
          });
        }
      }
    });
    
    return issues;
  }

  /**
   * Calculate price range for all combinations
   */
  static calculatePriceRange(combinations: VariationCombination[]): { min: number; max: number } {
    if (combinations.length === 0) {
      return { min: 0, max: 0 };
    }
    
    const activeCombinations = combinations.filter(c => c.isActive);
    if (activeCombinations.length === 0) {
      return { min: 0, max: 0 };
    }
    
    const prices = activeCombinations.map(c => c.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  }

  /**
   * Generate pricing suggestions based on base price and variation types
   */
  static generatePricingSuggestions(
    basePrice: number,
    variations: VariationDefinition[]
  ): Map<string, number> {
    const suggestions = new Map<string, number>();
    
    variations.forEach(variation => {
      if (!variation.affectsPrice || !variation.isActive) return;
      
      variation.values.forEach(value => {
        if (!value.isActive) return;
        
        const key = `${variation.name}:${value.value}`;
        let modifier = 0;
        
        // Apply heuristic-based pricing suggestions
        switch (variation.name.toLowerCase()) {
          case 'size':
            modifier = this.getSizePriceModifier(value.value, basePrice);
            break;
          case 'material':
            modifier = this.getMaterialPriceModifier(value.value, basePrice);
            break;
          case 'color':
            modifier = this.getColorPriceModifier(value.value, basePrice);
            break;
          case 'quality':
          case 'grade':
            modifier = this.getQualityPriceModifier(value.value, basePrice);
            break;
          default:
            modifier = 0; // No automatic suggestion for unknown variation types
        }
        
        suggestions.set(key, modifier);
      });
    });
    
    return suggestions;
  }

  /**
   * Size-based price modifier suggestions
   */
  private static getSizePriceModifier(size: string, basePrice: number): number {
    const sizeValue = size.toLowerCase();
    const baseModifier = basePrice * 0.1; // 10% of base price
    
    if (sizeValue.includes('xs') || sizeValue.includes('extra small')) return -baseModifier;
    if (sizeValue.includes('s') || sizeValue.includes('small')) return -baseModifier * 0.5;
    if (sizeValue.includes('m') || sizeValue.includes('medium')) return 0;
    if (sizeValue.includes('l') || sizeValue.includes('large')) return baseModifier * 0.5;
    if (sizeValue.includes('xl') || sizeValue.includes('extra large')) return baseModifier;
    if (sizeValue.includes('xxl') || sizeValue.includes('2xl')) return baseModifier * 1.5;
    
    return 0;
  }

  /**
   * Material-based price modifier suggestions
   */
  private static getMaterialPriceModifier(material: string, basePrice: number): number {
    const materialValue = material.toLowerCase();
    const baseModifier = basePrice * 0.15; // 15% of base price
    
    // Premium materials
    if (materialValue.includes('silk') || materialValue.includes('cashmere') || 
        materialValue.includes('leather') || materialValue.includes('wool')) {
      return baseModifier * 2;
    }
    
    // Standard materials
    if (materialValue.includes('cotton') || materialValue.includes('linen')) {
      return 0;
    }
    
    // Budget materials
    if (materialValue.includes('polyester') || materialValue.includes('synthetic')) {
      return -baseModifier;
    }
    
    return 0;
  }

  /**
   * Color-based price modifier suggestions
   */
  private static getColorPriceModifier(color: string, basePrice: number): number {
    const colorValue = color.toLowerCase();
    const baseModifier = basePrice * 0.05; // 5% of base price
    
    // Special/premium colors
    if (colorValue.includes('gold') || colorValue.includes('silver') || 
        colorValue.includes('rose gold') || colorValue.includes('metallic')) {
      return baseModifier;
    }
    
    return 0; // Most colors don't affect price
  }

  /**
   * Quality/grade-based price modifier suggestions
   */
  private static getQualityPriceModifier(quality: string, basePrice: number): number {
    const qualityValue = quality.toLowerCase();
    const baseModifier = basePrice * 0.2; // 20% of base price
    
    if (qualityValue.includes('premium') || qualityValue.includes('a+')) return baseModifier * 2;
    if (qualityValue.includes('standard') || qualityValue.includes('a')) return 0;
    if (qualityValue.includes('basic') || qualityValue.includes('b')) return -baseModifier;
    if (qualityValue.includes('economy') || qualityValue.includes('c')) return -baseModifier * 1.5;
    
    return 0;
  }

  /**
   * Calculate total stock across all combinations
   */
  static calculateTotalStock(combinations: VariationCombination[]): number {
    return combinations
      .filter(c => c.isActive)
      .reduce((total, combo) => total + Math.max(0, combo.stock.quantity - combo.stock.reserved), 0);
  }

  /**
   * Find low stock combinations
   */
  static findLowStockCombinations(
    combinations: VariationCombination[],
    threshold: number = 5
  ): VariationCombination[] {
    return combinations.filter(combo => 
      combo.isActive && 
      (combo.stock.quantity - combo.stock.reserved) <= threshold &&
      (combo.stock.quantity - combo.stock.reserved) > 0
    );
  }

  /**
   * Find out of stock combinations
   */
  static findOutOfStockCombinations(combinations: VariationCombination[]): VariationCombination[] {
    return combinations.filter(combo => 
      combo.isActive && (combo.stock.quantity - combo.stock.reserved) <= 0
    );
  }

  /**
   * Generate SKU for a combination
   */
  static generateCombinationSku(
    baseSku: string,
    combination: Array<{ variationName: string; value: string }>
  ): string {
    if (!combination || combination.length === 0) return baseSku;
    
    const variationCode = combination
      .map(c => c.value.substring(0, 2).toUpperCase())
      .join('-');
    
    return `${baseSku}-${variationCode}`;
  }
}

export default VariationPricingCalculator;
