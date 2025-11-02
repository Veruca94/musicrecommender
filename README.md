# Music Recommender

A smart, personalized music recommendation web application that learns from your tastes and suggests artists you'll love.

## Features

- **Intelligent Recommendations**: Get personalized artist recommendations based on your ratings and preferences
- **Rating System**: Rate artists from 1-5 stars to help the algorithm learn your taste
- **Add Custom Artists**: Manually add your favorite artists with ratings
- **To Listen List**: Save artists you want to check out later
- **Shuffle Recommendations**: Get fresh recommendations at any time
- **Quick Remove**: Trash recommendations you're not interested in without rating
- **Local Storage**: All your data is saved locally in your browser
- **Comprehensive Database**: Over 100 culturally important artists across multiple genres and eras
- **Beautiful UI**: Modern, gradient-based design with smooth animations

## How It Works

1. **Start Rating**: Begin by rating some artists you know to help the app understand your taste
2. **Get Recommendations**: The algorithm analyzes your preferences (genres, themes, styles, eras) and suggests similar artists
3. **Interact**: Rate recommendations, add them to your "To Listen" list, or trash them to get new suggestions
4. **Add Artists**: Manually add artists you love that aren't in the database
5. **Shuffle**: Get fresh recommendations whenever you want

## Technology

- **HTML5** - Semantic structure
- **CSS3** - Modern, responsive design with gradients and animations
- **Vanilla JavaScript** - No frameworks, pure performance
- **Local Storage API** - Client-side data persistence
- **JSON Database** - 110 curated artists with rich metadata

## Database

The application includes 110 culturally significant artists across genres including:
- Rock (Classic Rock, Alternative, Indie, Punk, Grunge)
- Hip-Hop (Old School, Conscious, Gangsta, Jazz Rap)
- Electronic (House, IDM, Ambient, Trip-Hop)
- Jazz & Soul (Bebop, Funk, Neo-Soul)
- And many more...

Each artist is tagged with:
- Genres
- Themes
- Musical styles
- Year of formation
- Era classification

## Recommendation Algorithm

The recommendation engine:
1. Analyzes your ratings to build a preference profile
2. Weights genres, themes, and styles based on your highest-rated artists
3. Scores unrated artists based on similarity to your preferences
4. Adds controlled randomization for discovery
5. Filters out artists you've already rated or added to your list

## Deployment

This application is optimized for GitHub Pages:
- No build process required
- All assets are self-contained
- Fast loading and responsive
- Works offline after initial load

## Getting Started

Simply open `index.html` in a web browser, or deploy to GitHub Pages for online access.

## Privacy

All data is stored locally in your browser. Nothing is sent to any server. Your music taste is completely private.

## Browser Support

Works in all modern browsers that support:
- ES6+ JavaScript
- CSS Grid
- Local Storage
- Fetch API

## License

MIT License - Feel free to use and modify as you wish!
