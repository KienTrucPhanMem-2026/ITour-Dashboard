# TourHub Dashboard - Implementation Guide

## Overview

This is a professional Next.js (App Router) dashboard for tour management with a clean, soft aesthetic featuring rounded corners, minimal shadows, and a Zinc/Emerald color palette. The architecture follows Clean Architecture principles with clear separation between UI, services, and API layers.

## Architecture Overview

### 1. **Types Layer** (`types/index.ts`)
Defines TypeScript interfaces for type-safe development:
- `Tour` - Tour package details with status, pricing, capacity tracking
- `Booking` - Reservation information with customer and status details
- `User` - Customer profile with booking history and contact info
- `ApiResponse<T>` - Standardized API response wrapper
- `ListResponse<T>` - Paginated list response wrapper

### 2. **API Client Layer** (`lib/api-client.ts`)
A reusable HTTP client (`apiClient`) that handles:
- Base URL configuration from environment variables
- Query parameter building
- Standard headers and JSON serialization
- Error handling with fallback responses
- Methods: `get()`, `post()`, `put()`, `delete()`, `patch()`

**Usage:**
```typescript
const response = await apiClient.get<Tour>('/tours/1');
```

### 3. **Services Layer** (`services/`)

#### **tourService.ts**
```typescript
- getTours(params?) - Fetch paginated tours
- getTourById(id) - Get single tour details
- createTour(data) - Create new tour
- updateTour(id, data) - Update tour
- deleteTour(id) - Delete tour
- updateTourStatus(id, status) - Change tour status
- archiveTour(id) - Mark tour as completed
```

#### **bookingService.ts**
```typescript
- getBookings(params?) - Fetch paginated bookings
- getBookingById(id) - Get booking details
- getUserBookings(userId, params?) - Get user's bookings
- createBooking(data) - Create new booking
- updateStatus(id, status) - Update booking status
- confirmBooking(id) - Confirm pending booking
- cancelBooking(id) - Cancel booking
- updateBooking(id, data) - Update booking details
- deleteBooking(id) - Delete booking
```

#### **userService.ts**
```typescript
- getCustomers(params?) - Fetch paginated customers
- getUserById(id) - Get user details
- createUser(data) - Create new user
- updateUser(id, data) - Update user info
- deleteUser(id) - Delete user
- updateUserStatus(id, status) - Change user status
- searchUsers(query) - Search by name/email
- getUserStats(id) - Get user statistics
```

### 4. **UI Components Layer**

#### Core Dashboard Components
- **`components/dashboard/dashboard-layout.tsx`** - Main layout wrapper with sidebar and navbar
- **`components/dashboard/tour-table.tsx`** - Tour list display (enhanced with mock fallback)
- **`components/dashboard/booking-table.tsx`** - Booking reservations table
- **`components/dashboard/customer-table.tsx`** - Customer directory table

#### Styling Patterns
All components follow the v0 aesthetic:
- **Rounded corners**: `rounded-2xl`, `rounded-3xl`
- **Soft shadows**: `shadow-sm`, `hover:shadow-lg`
- **Color palette**: 
  - Primary: Emerald (`text-emerald-600`, `bg-emerald-100`)
  - Secondary: Slate (`text-slate-500`, `bg-slate-50`)
  - Status colors: Amber (Pending), Red (Cancelled/Error)
- **Icons**: lucide-react
- **Components**: shadcn/ui

### 5. **Pages Layer** (`app/`)

#### Dashboard (`app/page.tsx`)
Overview page with:
- Revenue, tours, bookings, and user statistics
- Interactive stat cards with charts
- Tour management table

#### Tours (`app/tours/page.tsx`)
- Full CRUD interface for tours
- Create tour button
- Tour table with status, capacity, booking info
- Fallback to mock data if API unavailable

#### Bookings (`app/bookings/page.tsx`)
- Reservation management
- Status badges (Pending, Confirmed, Cancelled, Completed)
- Real-time status updates
- Customer and tour information
- New booking creation

#### Customers (`app/customers/page.tsx`)
- Customer directory
- Contact information display
- Booking history tracking
- Total spending metrics
- Customer status management

## Environment Configuration

### `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

**Note**: The `NEXT_PUBLIC_` prefix makes it available in the browser.

## API Endpoint Structure

The service layer expects endpoints following this pattern:

```
GET    /api/v1/tours              - List tours
GET    /api/v1/tours/:id          - Get tour
POST   /api/v1/tours              - Create tour
PUT    /api/v1/tours/:id          - Update tour
DELETE /api/v1/tours/:id          - Delete tour
PATCH  /api/v1/tours/:id/status   - Update status

GET    /api/v1/bookings           - List bookings
GET    /api/v1/bookings/:id       - Get booking
GET    /api/v1/users/:id/bookings - User's bookings
POST   /api/v1/bookings           - Create booking
PATCH  /api/v1/bookings/:id/status - Update status
PUT    /api/v1/bookings/:id       - Update booking
DELETE /api/v1/bookings/:id       - Delete booking

GET    /api/v1/users              - List customers
GET    /api/v1/users/:id          - Get user
POST   /api/v1/users              - Create user
PUT    /api/v1/users/:id          - Update user
DELETE /api/v1/users/:id          - Delete user
PATCH  /api/v1/users/:id/status   - Update status
GET    /api/v1/users/search       - Search users
GET    /api/v1/users/:id/stats    - User statistics
```

## Data Flow Example

### Fetching Tours
```
1. User navigates to /tours page
2. page.tsx calls tourService.getTours()
3. tourService calls apiClient.get('/tours')
4. apiClient builds full URL: http://localhost:8080/api/v1/tours
5. Response wrapped in ApiResponse<ListResponse<Tour>>
6. Error handling: if API fails, mockTours is used as fallback
7. UI renders <TourTable tours={tours} />
```

### Creating a Booking
```
1. User fills form and submits
2. page.tsx calls bookingService.createBooking(data)
3. apiClient.post('/bookings', data)
4. API returns created booking with ID
5. Local state updated
6. UI re-renders showing new booking
7. Error message shown if creation fails
```

## Error Handling Strategy

### API Client Level
- Network errors caught and logged
- HTTP errors (4xx, 5xx) handled
- Returns standardized `ApiResponse` with error details

### Page Level
- `try/catch` blocks around service calls
- Error messages displayed to user
- Mock data fallback for demonstration
- Loading states during fetch

### Example
```typescript
const response = await tourService.getTours();
if (response.success && response.data) {
  setTours(response.data.items);
} else {
  setError(response.message);
  // Fallback to mock data
  setTours(mockTours);
}
```

## Mock Data Fallback

Each management page includes mock data that displays when:
1. API is unavailable
2. Network request fails
3. Server is not running

This allows UI testing without a backend. Remove mock data once API is live.

## Component Reusability

All table components are designed for reuse:
```typescript
<TourTable tours={tours} isLoading={loading} />
<BookingTable 
  bookings={bookings} 
  onStatusChange={handleStatusChange}
  isLoading={loading}
/>
<CustomerTable
  customers={customers}
  onEdit={handleEdit}
  onDelete={handleDelete}
  isLoading={loading}
/>
```

## Styling Guide

### Applying the Dashboard Aesthetic
1. **Cards**: Use `Card` component with `rounded-3xl border-0 shadow-sm`
2. **Buttons**: Apply `rounded-2xl` for soft corners
3. **Status Badges**: Use `bg-[color]-100 text-[color]-700` pattern
4. **Icons**: Always from lucide-react
5. **Text**: Use slate color scale for neutral text
6. **Spacing**: Consistent with existing 6px/12px padding increments

### Color Usage
- ✅ Emerald (Primary actions, success states)
- ✅ Slate (Neutral, backgrounds, text)
- ✅ Amber (Pending/warning states)
- ✅ Red (Errors, cancellations)

## Next Steps / TODO

### Backend Integration
- [ ] Implement actual API server at `http://localhost:8080`
- [ ] Replace mock data with real API calls
- [ ] Add authentication/authorization
- [ ] Implement pagination fully

### UI Enhancements
- [ ] Create tour modal/form
- [ ] Create booking modal/form
- [ ] Create customer modal/form
- [ ] Add search/filter functionality
- [ ] Add export to CSV feature
- [ ] Implement full pagination

### Features
- [ ] Tour calendar view
- [ ] Booking confirmation emails
- [ ] Customer reporting dashboard
- [ ] Revenue analytics
- [ ] Bulk operations

## File Structure

```
project/
├── app/
│   ├── layout.tsx           # Root layout with ThemeProvider
│   ├── page.tsx             # Dashboard
│   ├── tours/page.tsx       # Tours management
│   ├── bookings/page.tsx    # Bookings management
│   ├── customers/page.tsx   # Customers management
│   └── globals.css
├── components/
│   ├── dashboard/
│   │   ├── dashboard-layout.tsx
│   │   ├── sidebar.tsx
│   │   ├── navbar.tsx
│   │   ├── tour-table.tsx
│   │   ├── booking-table.tsx  # NEW
│   │   ├── customer-table.tsx # NEW
│   │   └── stat-card.tsx
│   ├── ui/                  # shadcn/ui components
│   └── theme-provider.tsx
├── lib/
│   ├── utils.ts
│   └── api-client.ts        # NEW
├── services/                # NEW
│   ├── tourService.ts       # NEW
│   ├── bookingService.ts    # NEW
│   └── userService.ts       # NEW
├── types/                   # NEW
│   └── index.ts             # NEW
├── .env.local               # NEW
└── ... config files
```

## Development Tips

1. **Test with Mock Data**: Pages work immediately with mock fallback
2. **Logging**: Check browser console for API errors
3. **Type Safety**: All services return typed responses
4. **Hot Reload**: Next.js auto-refreshes on file changes
5. **Inspect Elements**: Use DevTools to verify class names match aesthetic

## Troubleshooting

### "Cannot find module" errors
- Check path aliases in `tsconfig.json`
- Verify all imports use `@/` prefix correctly

### API calls failing
- Ensure `NEXT_PUBLIC_API_URL` is set in `.env.local`
- Check browser console for CORS errors
- Verify backend is running on expected port

### Styling inconsistencies
- Verify Tailwind CSS is processing all files
- Check component uses correct color scheme (emerald/slate)
- Ensure rounded values match pattern (2xl/3xl)

## Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [shadcn/ui Components](https://ui.shadcn.com)
- [lucide-react Icons](https://lucide.dev)
- [Tailwind CSS](https://tailwindcss.com)
