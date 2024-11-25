# AI Chat Assistant Interface

A sophisticated chat interface that integrates with an AI assistant, specifically designed for procurement teams. The application features a responsive design with a resizable chat panel and seamless iframe integration.

## Features

### Core Functionality
- Real-time AI chat interface
- Procurement-focused query builder
- Smart response handling with typing animations
- Markdown rendering support
- Code block syntax highlighting
- Copy-to-clipboard functionality

### UI/UX Features
- Resizable chat panel
- Collapsible quick prompts
- Responsive design for all screen sizes
- Smooth animations and transitions
- Loading indicators with dynamic messages
- Modern, clean interface

## Technical Components

### Frontend Structure
- HTML template with dynamic content rendering
- Modular CSS architecture
- Vanilla JavaScript implementation
- Material Icons integration
- Font Awesome integration

### Styling
The application uses a modern CSS architecture with:
- CSS Custom Properties (variables) for theming
- Responsive breakpoints
- Flexible grid layouts
- Advanced animations and transitions

### JavaScript Features
- Dynamic message handling
- Real-time chat resizing
- Markdown parsing and rendering
- Code syntax highlighting
- Animated thinking indicators
- Smart prompt builder

## API Integration

The application communicates with a Flask backend that integrates with OpenAI's GPT models:

## Quick Prompts System

The interface includes a sophisticated prompt builder with:
- PO (Purchase Order) search functionality
- Part number lookup
- Email history integration
- Timeline tracking
- Status updates

## Responsive Design

The interface adapts to different screen sizes:
- Desktop: Full-width with resizable chat panel
- Tablet: Fixed-width chat panel
- Mobile: Full-screen chat interface

### Breakpoints
- Large screens (>1500px): Flexible width
- Medium screens (≤1500px): Fixed 400px width
- Mobile screens (≤768px): Full width

## Installation

1. Clone the repository
2. Install Python dependencies:

```bash 
pip install flask openai
```

3. Set up your OpenAI API key:

```bash
export OPENAI_API_KEY='your-api-key-here'
```

4. Run the Flask application:

```bash
python app.py
```

## Configuration

### Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key

### Customization
The interface can be customized through CSS variables defined in:

```css:static/css/chat-bot.css
startLine: 1
endLine: 32
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Dependencies

### Frontend
- Material Icons
- Font Awesome 6.4.0
- Highlight.js 11.8.0
- Markdown-it 13.0.1
- Inter font family

### Backend
- Flask
- OpenAI Python SDK


## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request