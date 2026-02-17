# FieldBook Cambodia - Frontend

Modern, responsive React application for booking football fields and organizing matches in Cambodia.

## 🎨 Design Features

- **Premium Design System**: Custom CSS variables with modern color palette
- **Smooth Animations**: Micro-interactions and transitions throughout
- **Glassmorphism Effects**: Modern UI with backdrop blur and transparency
- **Responsive Layout**: Mobile-first design that works on all devices
- **Dark Theme**: Eye-friendly dark mode with vibrant accent colors

## 🚀 Tech Stack

- **React 19.2.0** - Modern UI library
- **React Router 7.13.0** - Client-side routing
- **Vite 7.3.1** - Fast build tool and dev server
- **Axios 1.13.5** - HTTP client for API calls
- **Lucide React 0.564.0** - Beautiful icon library
- **CSS3** - Custom styling with modern features

## 📁 Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── Navbar.jsx
│   └── Footer.jsx
├── pages/           # Page components
│   ├── Home.jsx
│   ├── Fields.jsx
│   ├── Teams.jsx
│   ├── Bookings.jsx
│   ├── Matchmaking.jsx
│   ├── LeagueMatches.jsx
│   ├── Login.jsx
│   └── Register.jsx
├── services/        # API services
│   └── api.js
├── utils/           # Utility functions
├── App.jsx          # Main app component
├── main.jsx         # Entry point
└── index.css        # Global styles & design system
```

## 🎯 Key Features Implemented

### ✅ Completed
- Modern navigation with mobile menu
- Stunning hero section with animations
- Fields browsing with search and filters
- Responsive card layouts
- Authentication pages (Login/Register)
- API service layer with axios
- Design system with CSS variables
- SEO optimization

### 🚧 To Be Implemented
- Field details and booking flow
- Team management interface
- Matchmaking system
- League matches integration
- User dashboard
- Profile management
- Real-time notifications

## 🛠️ Development

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation
```bash
npm install
```

### Environment Setup
```bash
cp .env.example .env
# Edit .env with your API URL
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🎨 Design System

### Color Palette
- **Primary Green**: `hsl(142, 76%, 36%)` - Main brand color
- **Accent Orange**: `hsl(25, 95%, 53%)` - Call-to-action
- **Accent Blue**: `hsl(210, 100%, 56%)` - Information
- **Accent Purple**: `hsl(271, 76%, 53%)` - Highlights
- **Dark Background**: `hsl(220, 26%, 8%)` - Main background

### Typography
- **Display Font**: Outfit - For headings
- **Body Font**: Inter - For content

### Spacing Scale
- XS: 0.25rem (4px)
- SM: 0.5rem (8px)
- MD: 1rem (16px)
- LG: 1.5rem (24px)
- XL: 2rem (32px)
- 2XL: 3rem (48px)
- 3XL: 4rem (64px)

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔗 API Integration

The app connects to the backend API at `http://localhost:5000/api` by default.

### Available Services
- `authService` - Authentication
- `fieldsService` - Field management
- `bookingsService` - Booking operations
- `teamsService` - Team management
- `matchmakingService` - Opponent finding
- `leaguesService` - League data

## 🎯 Next Steps

1. Connect pages to backend API
2. Implement authentication context
3. Add booking flow with calendar
4. Build team management interface
5. Create matchmaking algorithm UI
6. Integrate league data API
7. Add real-time features with WebSocket
8. Implement payment gateway

## 👥 Development Team

- **Scrum Master**: Phan Phoun
- **QA Testers**: Luch Samart, Pon Makara
- **Developers**: Soeng Chamrourn, Rose Rourn
- **Mentor**: Rady

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ for the Cambodian football community**
