# FieldBook Cambodia - Design System Color Palette

## 🎨 Color Palette Reference

### Primary Colors

#### Primary Green
- **Hex**: `#22c55e`
- **HSL**: `hsl(142, 76%, 36%)`
- **Usage**: Main brand color, primary buttons, success states, active links
- **Variants**:
  - Light: `hsl(142, 76%, 46%)`
  - Dark: `hsl(142, 76%, 26%)`
  - Glow: `hsla(142, 76%, 46%, 0.3)`

### Accent Colors

#### Accent Orange
- **Hex**: `#f97316`
- **HSL**: `hsl(25, 95%, 53%)`
- **Usage**: Call-to-action buttons, highlights, important notifications
- **Variants**:
  - Light: `hsl(25, 95%, 63%)`

#### Accent Blue
- **Hex**: `#3b82f6`
- **HSL**: `hsl(210, 100%, 56%)`
- **Usage**: Information, links, secondary actions
- **Variants**: Used in gradients with primary green

#### Accent Purple
- **Hex**: `#a855f7`
- **HSL**: `hsl(271, 76%, 53%)`
- **Usage**: Special features, premium elements

#### Accent Yellow
- **Hex**: `#fbbf24`
- **HSL**: `hsl(48, 100%, 67%)`
- **Usage**: Ratings, stars, warnings

### Neutral Colors

#### Dark Background
- **Hex**: `#0c0f17`
- **HSL**: `hsl(220, 26%, 8%)`
- **Usage**: Main page background

#### Dark Surface
- **Hex**: `#1a1f2e`
- **HSL**: `hsl(220, 26%, 12%)`
- **Usage**: Card backgrounds, elevated surfaces

#### Dark Surface Elevated
- **Hex**: `#252b3d`
- **HSL**: `hsl(220, 26%, 16%)`
- **Usage**: Hover states, input fields

#### Dark Border
- **Hex**: `#2f3548`
- **HSL**: `hsl(220, 26%, 20%)`
- **Usage**: Borders, dividers

### Text Colors

#### Text Primary
- **Hex**: `#fafafa`
- **HSL**: `hsl(0, 0%, 98%)`
- **Usage**: Headings, primary text

#### Text Secondary
- **Hex**: `#b3b3b3`
- **HSL**: `hsl(0, 0%, 70%)`
- **Usage**: Body text, descriptions

#### Text Muted
- **Hex**: `#808080`
- **HSL**: `hsl(0, 0%, 50%)`
- **Usage**: Placeholders, disabled text

### Semantic Colors

#### Success
- **Color**: Primary Green `#22c55e`
- **Usage**: Success messages, available status

#### Warning
- **Hex**: `#f59e0b`
- **HSL**: `hsl(38, 92%, 50%)`
- **Usage**: Warning messages, pending status

#### Error
- **Hex**: `#ef4444`
- **HSL**: `hsl(0, 84%, 60%)`
- **Usage**: Error messages, cancelled status

#### Info
- **Color**: Accent Blue `#3b82f6`
- **Usage**: Information messages

---

## 🌈 Gradients

### Primary Gradient
```css
linear-gradient(135deg, #22c55e 0%, #3b82f6 100%)
```
**Usage**: Primary buttons, hero sections, premium elements

### Accent Gradient
```css
linear-gradient(135deg, #f97316 0%, #a855f7 100%)
```
**Usage**: Accent buttons, special CTAs

### Dark Gradient
```css
linear-gradient(180deg, #1a1f2e 0%, #0c0f17 100%)
```
**Usage**: Background variations

### Glow Gradient
```css
radial-gradient(circle at center, hsla(142, 76%, 46%, 0.3) 0%, transparent 70%)
```
**Usage**: Glowing effects, hover states

---

## 📏 Usage Guidelines

### Do's ✅
- Use Primary Green for main actions and brand elements
- Use Accent Orange sparingly for important CTAs
- Maintain sufficient contrast for text readability
- Use gradients for premium, eye-catching elements
- Apply glow effects to highlight interactive elements

### Don'ts ❌
- Don't use too many accent colors in one section
- Don't use low contrast color combinations
- Don't overuse gradients (keep them special)
- Don't mix warm and cool colors randomly
- Don't use pure white or black (use text colors instead)

---

## 🎯 Color Application Examples

### Buttons
- **Primary**: Primary Green gradient
- **Secondary**: Accent Orange gradient
- **Outline**: Border with Primary Green
- **Ghost**: Transparent with hover effect

### Cards
- **Default**: Dark Surface background
- **Elevated**: Dark Surface Elevated
- **Glass**: Semi-transparent with backdrop blur

### Status Badges
- **Available**: Success green
- **Pending**: Warning yellow
- **Cancelled**: Error red
- **Confirmed**: Info blue

### Interactive States
- **Hover**: Lighter shade or glow effect
- **Active**: Primary Green with glow
- **Focus**: Border with Primary Green + glow
- **Disabled**: Text Muted with reduced opacity

---

## 🖼️ Visual Hierarchy

1. **Primary Elements**: Primary Green, large, bold
2. **Secondary Elements**: Accent colors, medium weight
3. **Tertiary Elements**: Neutral colors, subtle
4. **Background**: Dark colors, minimal contrast

---

## 🌓 Dark Theme Philosophy

The entire application uses a dark theme because:
- ✅ Reduces eye strain for users
- ✅ Makes vibrant colors pop more
- ✅ Feels modern and premium
- ✅ Better for low-light environments
- ✅ Saves battery on OLED screens

---

## 📱 Accessibility

### Contrast Ratios
- **Primary Green on Dark BG**: 7.2:1 (AAA)
- **Text Primary on Dark BG**: 18.5:1 (AAA)
- **Text Secondary on Dark BG**: 9.8:1 (AAA)

All color combinations meet WCAG 2.1 Level AA standards for accessibility.

---

**Color palette designed for maximum visual impact and user engagement** ✨
