# Hood System Division - Modular Architecture Guide

## Overview

The Hood System division is built with a modular, scalable architecture that makes it easy to add new services and products without duplicating code. All configuration is centralized in a JSON data file, and each page follows a consistent template pattern.

## Directory Structure

```
/hood/system/
├── index.html                 # Main division page
├── data.json                  # Central configuration (services & products)
├── README.md                  # This file
├── diagnostics-reports/
│   └── index.html            # Service page template
├── hood-cleaning/
│   ├── index.html
│   ├── images/               # Service images
│   └── documents/            # Service documents
├── access-panels/
├── emergency-ansul-clean-up/
├── duct-cleaning/
├── exhaust-system-diagram/
├── variable-frequency-drive/
└── products/
    ├── index.html            # Main products page
    ├── filters/
    │   └── index.html        # Product page template
    ├── belts/
    ├── exhaust-fans/
    ├── motors/
    ├── fan-blades/
    ├── hinges/
    ├── grease-cup/
    ├── pillow-block-bearing/
    └── light-fixture/
```

## Adding a New Service

### Step 1: Update data.json

Add a new service object to the `services` array in `data.json`:

```json
{
  "id": "service-slug",
  "name": "Service Name",
  "slug": "service-slug",
  "shortDesc": "Brief description for cards",
  "fullDesc": "Longer description for service page",
  "icon": "M path d attribute for SVG",
  "benefits": [
    {
      "icon": "✓",
      "title": "Benefit Title",
      "desc": "Benefit description"
    }
  ],
  "process": [
    {
      "number": "1",
      "title": "Step Title",
      "desc": "Step description"
    }
  ],
  "faqs": [
    {
      "question": "Question?",
      "answer": "Answer..."
    }
  ]
}
```

### Step 2: Create Service Folder & Files

1. Create a new folder: `/hood/system/service-slug/`
2. Create subdirectories: `images/` and `documents/`
3. Copy `diagnostics-reports/index.html` to your new folder
4. Update the HTML with your service data:
   - Change the page title and meta description
   - Update hero section with service name
   - Update breadcrumb links
   - Replace placeholder content with your service details
   - Update links to point to correct paths

### Step 3: Update Main Page

The main `/hood/system/index.html` automatically shows all services from `data.json`. Services appear in the order they're listed in the JSON file. No manual updates needed to the main page.

## Adding a New Product

### Step 1: Update data.json

Add a new product object to the `products` array in `data.json`:

```json
{
  "id": "product-slug",
  "name": "Product Name",
  "slug": "product-slug",
  "shortDesc": "Brief description",
  "fullDesc": "Full description",
  "icon": "M path d attribute for SVG",
  "applications": [
    "Application 1",
    "Application 2"
  ],
  "benefits": [
    "Benefit 1",
    "Benefit 2"
  ],
  "specs": [
    {
      "label": "Specification",
      "value": "Value"
    }
  ]
}
```

### Step 2: Create Product Folder & Files

1. Create a new folder: `/hood/system/products/product-slug/`
2. Create subdirectories: `images/`
3. Copy `/hood/system/products/filters/index.html` to your new folder
4. Update the HTML with your product data:
   - Change page title and description
   - Update hero with product name
   - Replace specifications section
   - Update applications and benefits
   - Update links

### Step 3: Products Main Page

Like services, the products page automatically displays all products from `data.json`. No manual updates needed.

## Page Templates

### Service Page Template Structure

Every service page should follow this structure:

```html
1. Navigation (navbar with mega menu)
2. Breadcrumb navigation
3. Hero section with eyebrow, title, description
4. Main visual + content section
5. Benefits/Features grid
6. Process/Timeline section
7. Gallery/Documentation section
8. FAQ accordion section
9. Final CTA section
10. Footer
```

### Product Page Template Structure

Every product page should include:

```html
1. Navigation
2. Breadcrumb
3. Hero section
4. Main visual + description
5. Applications section
6. Benefits/Features grid
7. Technical specifications table
8. Gallery section
9. FAQ section
10. Request Quote CTA
11. Footer
```

## Customization Guide

### Colors

All colors are defined as CSS variables in the `<style>` section. Modify these to match your brand:

```css
:root {
    --blue: #1a5cff;
    --blue-mid: #3b6fd4;
    --gray-900: #111110;
    /* etc. */
}
```

### Fonts

Currently using `Inter` font family from Google Fonts. To change:
1. Update the Google Fonts link in the `<head>`
2. Update the `--font` CSS variable

### SVG Icons

Service and product icons are inline SVGs. To create new icons:
1. Use simple, clean SVG designs
2. Set stroke-width to 1.5 for consistency
3. Keep viewBox at 24x24 for consistency

### Images & Media

- Store service images in `/service-slug/images/`
- Store product images in `/products/product-slug/images/`
- Use placeholder images initially, replace with real images later
- All images are protected from right-click and drag operations

## SEO Optimization

Each page includes:
- Unique, descriptive `<title>` tag (60-70 characters)
- Meta description (120-160 characters)
- Proper heading hierarchy (H1, H2, H3)
- Semantic HTML structure
- Clean, descriptive URLs
- Breadcrumb navigation for crawlers

## Responsive Design

All pages are fully responsive with breakpoints at:
- 1280px (desktop)
- 768px (tablet)
- 480px (mobile)

Use these media queries for testing:

```css
@media (max-width: 768px) { /* Tablet */ }
@media (max-width: 480px) { /* Mobile */ }
```

## Animation & Interactions

### Scroll Reveal Animation

Add `class="reveal"` to elements that should animate on scroll:

```html
<div class="reveal">Content appears on scroll</div>
<div class="reveal reveal-delay-1">With 0.1s delay</div>
<div class="reveal reveal-delay-2">With 0.2s delay</div>
```

### Hover Effects

Cards, buttons, and links have built-in hover effects:
- Color transitions
- Shadow changes
- Scale transforms
- Border color changes

## JavaScript Functionality

Each page includes JavaScript for:

1. **Navbar scroll effect** - Changes navbar appearance on scroll
2. **Scroll reveal animation** - Reveals elements as user scrolls
3. **FAQ accordion** - Toggle FAQ answers (service pages only)
4. **Mega menu** - Dropdown navigation menu
5. **Image protection** - Prevents right-click, drag, and save on images

## Performance Considerations

- All CSS is inline to reduce HTTP requests
- SVG icons are inline to eliminate image requests
- JavaScript is minimal and doesn't require external libraries
- Font preconnect links are included for Google Fonts
- Smooth scrolling is CSS-based for better performance

## Updating Content

### Quick Content Updates

Edit the relevant HTML file directly:
1. Open the `.html` file in a text editor
2. Find the section to update
3. Replace the content
4. Save the file

### Bulk Updates

To update multiple services/products:
1. Edit the relevant entries in `data.json`
2. Update the corresponding HTML files
3. Ensure consistency across files

## Link Structure

### Service Links

- Division home: `/hood/system/`
- Service page: `/hood/system/service-slug/`
- Service from main: Service cards link to `/hood/system/service-slug/`

### Product Links

- Products main: `/hood/system/products/`
- Individual product: `/hood/system/products/product-slug/`
- From main page: Product cards link to individual product pages

### Cross-Links

- Services link back to division home via breadcrumb
- Products link back to `/hood/system/products/` via breadcrumb
- Main division page has section for featured products with link to `/hood/system/products/`

## Future Enhancements

### Potential Additions

1. **Dynamic service generation** - Use PHP/Node.js to generate pages from data.json
2. **Blog section** - Add industry news and tips
3. **Case studies** - Showcase successful projects
4. **Testimonials** - Client reviews and ratings
5. **Pricing calculator** - Estimate service costs
6. **Online booking** - Schedule services directly
7. **Customer portal** - Track service history

### Database Integration

When ready to add backend functionality:
1. Convert `data.json` to database
2. Create API endpoints for data retrieval
3. Generate HTML pages dynamically
4. Implement user authentication
5. Add admin panel for content management

## Troubleshooting

### Links Not Working

- Check that file paths match exactly (case-sensitive)
- Verify .htaccess rules for URL rewriting
- Test in different browsers

### Images Not Showing

- Verify image path is correct
- Check that images are in the right folder
- Ensure file permissions allow reading

### Styles Not Applying

- Check that CSS is inside `<style>` tags in `<head>`
- Verify class names match CSS selectors
- Check browser console for CSS errors

### JavaScript Not Working

- Verify script is inside `<script>` tags before closing `</body>`
- Check browser console for JavaScript errors
- Ensure DOM elements have correct IDs/classes

## Support & Maintenance

For questions or issues:
1. Check this README
2. Review existing service/product pages for patterns
3. Test changes in multiple browsers
4. Validate HTML at validator.w3.org
5. Check responsive design on actual devices

## Version History

- v1.0 (2025-07-15) - Initial modular architecture
  - 8 services configured
  - 9 products configured
  - Fully responsive design
  - SEO optimized
  - Modular template system

---

**Last Updated**: July 15, 2025
**Maintained By**: PRIME Facility Services
**License**: Internal Use Only
