# SP Mailtrace App

Web application for tracking and analyzing emails in the SP system.

## Features

- Email search by Message-ID, From or To
- Basic and Advanced search modes
- Detailed results visualization in table format
- Column filtering and sorting
- Request and response preview
- Modern responsive interface
- Multi-language support (English/Spanish)

## Technologies Used

- Vue.js 3
- Bootstrap Vue Next
- Custom CSS
- REST API

## Requirements

- Node.js (version 14 or higher)
- npm (version 6 or higher)

## Installation

1. Clone the repository:
```bash
git clone [REPOSITORY_URL]
cd sp-mailtrace-app
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with necessary configurations
```

4. Start development server:
```bash
npm run serve
```

## Project Structure

```
sp-mailtrace-app/
├── src/
│   ├── assets/
│   │   └── main.css
│   ├── components/
│   ├── App.vue
│   └── main.js
├── public/
├── package.json
└── README.md
```

## Recent Changes

### New Branch: UI/UX Improvements

#### Design and Layout
- Removed maximum width limits (max-width)
- Improved main content responsiveness
- Automatic space adjustment
- Better scroll and overflow handling

#### Results Table
- More compact and consistent design
- Optimized column widths
- Better long text handling
- Smooth horizontal scroll
- Unified typography

#### Column Selector
- More compact and functional design
- Better options organization
- Clear indicators for required columns
- Improved mobile experience

#### Paginator
- More compact and elegant design
- Better visual feedback
- Smooth animations
- Better mobile adaptation

#### Modal
- Entry/exit animations
- Better centering
- Close with Escape and outside click
- Better long content handling

#### Responsive
- Better adaptation to different screen sizes
- Mobile-optimized layout
- Better space handling on small screens
- Improved touch device user experience

## Contributing

1. Create a branch for the new feature
2. Make your changes
3. Test functionality
4. Create a Pull Request

## License

This project is licensed under the MIT License.
