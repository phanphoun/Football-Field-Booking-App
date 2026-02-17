# Quick Start Guide - FieldBook Cambodia Frontend

## 🚀 Getting Started in 5 Minutes

### 1. Open the Application
The development server is already running at:
```
http://localhost:5173/
```

### 2. Navigate the Application

#### Main Pages Available:
- **Home** (`/`) - Landing page with hero section
- **Fields** (`/fields`) - Browse available football fields
- **Teams** (`/teams`) - Team management
- **Matchmaking** (`/matchmaking`) - Find opponents
- **Bookings** (`/bookings`) - View your bookings
- **Leagues** (`/leagues`) - European league matches
- **Login** (`/login`) - User login
- **Register** (`/register`) - Create account

### 3. Test the Features

#### Search Fields
1. Go to `/fields`
2. Use the search bar to filter by name
3. Select city or field type from dropdowns
4. Click "View Details" on any field card

#### Mobile Menu
1. Resize browser to mobile width (< 768px)
2. Click hamburger menu icon
3. Navigate through mobile menu

---

## 🎨 Using the Design System

### Quick Component Reference

#### Buttons
```jsx
// Primary button (green gradient)
<button className="btn btn-primary">Book Now</button>

// Accent button (orange gradient)
<button className="btn btn-accent">Get Started</button>

// Outline button
<button className="btn btn-outline">Learn More</button>

// Ghost button (transparent)
<button className="btn btn-ghost">Cancel</button>

// Small button
<button className="btn btn-primary btn-sm">Small</button>

// Large button
<button className="btn btn-primary btn-lg">Large</button>
```

#### Cards
```jsx
// Standard card
<div className="card">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>

// Elevated card
<div className="card card-elevated">Content</div>

// Glass effect card
<div className="card card-glass">Content</div>
```

#### Input Fields
```jsx
// Standard input
<input className="input" type="text" placeholder="Enter text" />

// Input with icon
<div className="input-group">
  <Search className="input-icon" size={18} />
  <input className="input" type="text" placeholder="Search..." />
</div>
```

#### Badges
```jsx
<span className="badge badge-success">Available</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-error">Cancelled</span>
<span className="badge badge-info">Info</span>
```

#### Animations
```jsx
// Fade in animation
<div className="animate-fadeIn">Content</div>

// Slide in from left
<div className="animate-slideInLeft">Content</div>

// Slide in from right
<div className="animate-slideInRight">Content</div>

// Pulse animation
<div className="animate-pulse">Loading...</div>

// Glow animation
<div className="animate-glow">Premium</div>
```

---

## 📁 File Structure Guide

### Where to Add New Features

#### New Page Component
```
src/pages/YourPage.jsx
src/pages/YourPage.css
```

#### New Reusable Component
```
src/components/YourComponent.jsx
src/components/YourComponent.css
```

#### New API Service
```
src/services/yourService.js
```

#### New Utility Function
```
src/utils/yourUtil.js
```

---

## 🎯 Common Tasks

### Adding a New Page

1. **Create the component:**
```jsx
// src/pages/NewPage.jsx
const NewPage = () => {
  return (
    <div className="container" style={{ padding: '4rem 0' }}>
      <h1>New Page</h1>
      <p>Your content here</p>
    </div>
  );
};

export default NewPage;
```

2. **Add route in App.jsx:**
```jsx
import NewPage from './pages/NewPage';

// In Routes:
<Route path="/new-page" element={<NewPage />} />
```

3. **Add to navigation (optional):**
```jsx
// In Navbar.jsx navLinks array:
{ path: '/new-page', label: 'New Page', icon: YourIcon }
```

### Making an API Call

```jsx
import { fieldsService } from '../services/api';

const MyComponent = () => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await fieldsService.getAll();
        setFields(response.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFields();
  }, []);

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div>
      {fields.map(field => (
        <div key={field.id}>{field.name}</div>
      ))}
    </div>
  );
};
```

### Creating a Form

```jsx
import { useState } from 'react';

const MyForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form data:', formData);
    // Make API call here
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Name</label>
        <input
          className="input"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      
      <button type="submit" className="btn btn-primary">
        Submit
      </button>
    </form>
  );
};
```

---

## 🐛 Troubleshooting

### Development Server Won't Start
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Page Not Found (404)
- Check route is defined in `App.jsx`
- Verify component import path
- Ensure component is exported correctly

### Styles Not Applying
- Check CSS file is imported in component
- Verify class names match CSS file
- Check for typos in className
- Ensure CSS file is in correct location

### API Calls Failing
- Check backend server is running (port 5000)
- Verify API URL in `.env` file
- Check network tab in browser DevTools
- Verify endpoint exists in `services/api.js`

---

## 📚 Resources

### Documentation
- **React**: https://react.dev
- **React Router**: https://reactrouter.com
- **Vite**: https://vitejs.dev
- **Lucide Icons**: https://lucide.dev

### Design References
- **Color Palette**: See `COLOR_PALETTE.md`
- **Full Implementation**: See `IMPLEMENTATION_SUMMARY.md`
- **Project README**: See `README.md`

### CSS Variables
All design tokens are in `src/index.css`:
- Colors: `--primary-green`, `--accent-orange`, etc.
- Spacing: `--space-sm`, `--space-md`, etc.
- Typography: `--font-size-lg`, `--font-weight-bold`, etc.
- Shadows: `--shadow-md`, `--shadow-glow`, etc.

---

## ✅ Checklist for New Features

Before committing new code:
- [ ] Component works on mobile, tablet, desktop
- [ ] Follows design system (colors, spacing, typography)
- [ ] Includes loading and error states
- [ ] Has smooth animations/transitions
- [ ] Code is clean and commented
- [ ] No console errors
- [ ] Tested in browser

---

## 🎉 Tips for Success

1. **Use the design system** - Don't create custom colors or spacing
2. **Keep it responsive** - Test on different screen sizes
3. **Add animations** - Use existing animation classes
4. **Follow the structure** - Keep files organized
5. **Comment your code** - Help your team understand
6. **Test thoroughly** - Check all user flows
7. **Ask for help** - Don't hesitate to reach out

---

## 🚀 Next Steps

1. **Connect to Backend**
   - Update `.env` with backend URL
   - Test API endpoints
   - Add error handling

2. **Implement Features**
   - Field booking flow
   - Team management
   - Matchmaking system

3. **Polish UI**
   - Add loading states
   - Improve animations
   - Optimize performance

---

**Happy Coding! ⚽️**

For questions, contact the development team or check the documentation files.
