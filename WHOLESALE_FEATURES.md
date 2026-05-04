# Wholesale POS Features

## Overview
The POS system now supports wholesale unit selection for products that have wholesale pricing enabled.

## Features Added

### 1. Product Display
- **Wholesale Badge**: Products with wholesale enabled show a purple "Wholesale" badge
- **Visual Indicators**: Easy identification of wholesale-enabled products

### 2. Wholesale Unit Selection Modal
- **Automatic Trigger**: Clicking a wholesale product opens the unit selection modal
- **Unit Options**: Shows all active wholesale units with:
  - Unit name (e.g., "မူး", "1ကျင်း", "3ကျင်း")
  - Conversion rate (e.g., "1 မူး = 1000 pieces")
  - Buying and selling prices
  - Profit calculation per unit
- **Individual Option**: Option to sell by individual pieces
- **Responsive Design**: Works on all screen sizes

### 3. Cart Management
- **Wholesale Labels**: Cart items show selected unit with purple badge
- **Conversion Display**: Shows conversion rate for clarity
- **Separate Tracking**: Same product can be added with different units
- **Stock Validation**: Proper stock checking based on unit conversion
- **Quantity Controls**: Add/remove/modify quantities per unit type

### 4. Pricing & Calculations
- **Dynamic Pricing**: Uses wholesale unit price when selected
- **Accurate Totals**: Correctly calculates totals based on unit pricing
- **Profit Display**: Shows profit per wholesale unit in selector

### 5. Receipt Printing
- **Unit Labels**: Receipts show unit type in product name
- **Correct Pricing**: Uses appropriate pricing for each unit type
- **Clear Documentation**: Professional receipt format

## User Flow

1. **Product Selection**: User clicks on a wholesale-enabled product
2. **Unit Selection**: Modal opens with available wholesale units
3. **Choice**: User selects wholesale unit or individual pieces
4. **Cart Update**: Product added to cart with selected unit
5. **Quantity Management**: User can modify quantity per unit type
6. **Checkout**: Normal checkout process with correct pricing

## Technical Implementation

### Data Structures
- `CartItem`: Extended with `selectedWholesaleUnit` and `isWholesaleMode`
- `StorefrontStockInventory`: Extended with `isWholesale` and `wholesaleUnits`
- `WholesaleUnit`: New interface for unit definitions

### Key Functions
- `addToCart()`: Handles wholesale detection and modal triggering
- `addProductToCart()`: Adds products with unit selection
- `updateQty()` / `setQty()`: Unit-aware quantity management
- `removeFromCart()`: Unit-aware cart item removal
- `getItemPrice()`: Dynamic pricing based on unit selection

### Stock Management
- **Conversion Logic**: Stock validation based on unit conversion rates
- **Availability**: Proper stock checking for wholesale vs individual units
- **Validation**: Prevents overselling based on available stock

## Example Usage

For a product like "ကျောက်" (Stone):
- **Individual**: 150 MMK per piece
- **မူး**: 140,000 MMK (1000 pieces)
- **1ကျင်း**: 14,500 MMK (100 pieces)  
- **3ကျင်း**: 43,000 MMK (300 pieces)

## Benefits

1. **Flexible Pricing**: Support for different unit types and pricing
2. **User-Friendly**: Clear interface for unit selection
3. **Accurate Inventory**: Proper stock management with conversions
4. **Professional Receipts**: Clear documentation of unit types
5. **Scalable**: Easy to add new wholesale units to products

## Future Enhancements

- Bulk discount support for wholesale units
- Unit conversion calculator
- Wholesale-specific reporting
- Customer wholesale pricing tiers
