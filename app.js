// Music Recommender App
class MusicRecommender {
    constructor() {
        this.artists = [];
        this.userRatings = {};
        this.toListenList = [];
        this.currentRecommendations = [];
        this.recentlyShown = []; // Track recently shown artists for shuffle
        this.recommendationCount = 6;

        this.init();
    }

    async init() {
        // Load data from local storage
        this.loadFromStorage();

        // Load artists database
        await this.loadArtists();

        // Initialize UI
        this.setupEventListeners();
        this.updateUI();
        this.generateRecommendations();
    }

    // Load artists from JSON file
    async loadArtists() {
        try {
            const response = await fetch('artists.json');
            const data = await response.json();
            this.artists = data.artists;
        } catch (error) {
            console.error('Error loading artists:', error);
            this.artists = [];
        }
    }

    // Local Storage Methods
    loadFromStorage() {
        const ratingsData = localStorage.getItem('musicRecommender_ratings');
        const toListenData = localStorage.getItem('musicRecommender_toListen');

        if (ratingsData) {
            this.userRatings = JSON.parse(ratingsData);
        }

        if (toListenData) {
            this.toListenList = JSON.parse(toListenData);
        }
    }

    saveToStorage() {
        localStorage.setItem('musicRecommender_ratings', JSON.stringify(this.userRatings));
        localStorage.setItem('musicRecommender_toListen', JSON.stringify(this.toListenList));
    }

    clearStorage() {
        if (confirm('Are you sure you want to clear all your data? This cannot be undone.')) {
            localStorage.removeItem('musicRecommender_ratings');
            localStorage.removeItem('musicRecommender_toListen');
            this.userRatings = {};
            this.toListenList = [];
            this.currentRecommendations = [];
            this.updateUI();
            this.generateRecommendations();
        }
    }

    // Rating Methods
    rateArtist(artistId, rating) {
        this.userRatings[artistId] = {
            rating: rating,
            timestamp: Date.now()
        };
        this.saveToStorage();
        this.updateUI();
    }

    addCustomArtist(name, rating) {
        // Create a custom artist entry
        const customId = `custom_${Date.now()}`;
        const customArtist = {
            id: customId,
            name: name,
            genres: ['user-added'],
            themes: ['custom'],
            styles: ['personal'],
            year: new Date().getFullYear(),
            era: '2020s',
            isCustom: true
        };

        this.artists.push(customArtist);
        this.rateArtist(customId, rating);
        this.generateRecommendations();
    }

    // Recommendation Algorithm
    generateRecommendations() {
        const rated = Object.keys(this.userRatings);
        const container = document.getElementById('recommendationsContainer');
        const emptyState = document.getElementById('emptyState');
        const panelTitle = document.getElementById('panelTitle');

        // Always hide empty state and show container
        container.classList.remove('hidden');
        emptyState.classList.add('hidden');

        // If no ratings yet, show initial popular bands
        if (rated.length === 0) {
            panelTitle.textContent = 'Popular Artists to Rate';
            this.currentRecommendations = this.getInitialBands();
            this.renderRecommendations();
            return;
        }

        // Update title for personalized recommendations
        panelTitle.textContent = 'Recommended For You';

        // Get user preferences based on ratings
        const preferences = this.getUserPreferences();

        // Filter out already rated artists and those in to-listen list
        const unratedArtists = this.artists.filter(artist =>
            !this.userRatings[artist.id] &&
            !this.toListenList.some(item => item.id === artist.id)
        );

        // Calculate scores for unrated artists
        const scoredArtists = unratedArtists.map(artist => ({
            ...artist,
            score: this.calculateArtistScore(artist, preferences)
        }));

        // Sort by score and get top recommendations
        scoredArtists.sort((a, b) => b.score - a.score);

        // Select recommendations with some randomization
        this.currentRecommendations = this.selectRecommendations(scoredArtists);

        // Render recommendations
        this.renderRecommendations();
    }

    // Get initial popular bands for first-time users
    getInitialBands() {
        const allInitialBands = this.getInitialBandsPool();

        // Filter out rated, to-listen, and recently shown
        const availableBands = allInitialBands.filter(artist =>
            !this.userRatings[artist.id] &&
            !this.toListenList.some(item => item.id === artist.id) &&
            !this.recentlyShown.includes(artist.id)
        );

        // If we've exhausted the pool, reset recently shown
        if (availableBands.length < this.recommendationCount) {
            this.recentlyShown = [];
            return this.getInitialBands(); // Recursive call with cleared history
        }

        // Shuffle and select a subset
        const shuffled = [...availableBands].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, this.recommendationCount);

        // Track these as recently shown
        selected.forEach(artist => {
            this.recentlyShown.push(artist.id);
        });

        // Keep recently shown list manageable (last 18 artists)
        if (this.recentlyShown.length > 18) {
            this.recentlyShown = this.recentlyShown.slice(-18);
        }

        return selected;
    }

    getUserPreferences() {
        const preferences = {
            genres: {},
            themes: {},
            styles: {},
            eras: {},
            averageRating: 0
        };

        let totalRating = 0;
        let ratingCount = 0;

        Object.entries(this.userRatings).forEach(([artistId, data]) => {
            const artist = this.artists.find(a => a.id == artistId);
            if (!artist) return;

            const weight = data.rating; // Higher rated artists have more weight

            // Count genres
            artist.genres.forEach(genre => {
                preferences.genres[genre] = (preferences.genres[genre] || 0) + weight;
            });

            // Count themes
            artist.themes.forEach(theme => {
                preferences.themes[theme] = (preferences.themes[theme] || 0) + weight;
            });

            // Count styles
            artist.styles.forEach(style => {
                preferences.styles[style] = (preferences.styles[style] || 0) + weight;
            });

            // Count eras
            preferences.eras[artist.era] = (preferences.eras[artist.era] || 0) + weight;

            totalRating += data.rating;
            ratingCount++;
        });

        preferences.averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

        return preferences;
    }

    calculateArtistScore(artist, preferences) {
        let score = 0;

        // Genre matching (high weight)
        artist.genres.forEach(genre => {
            score += (preferences.genres[genre] || 0) * 3;
        });

        // Theme matching (medium weight)
        artist.themes.forEach(theme => {
            score += (preferences.themes[theme] || 0) * 2;
        });

        // Style matching (medium weight)
        artist.styles.forEach(style => {
            score += (preferences.styles[style] || 0) * 2;
        });

        // Era matching (low weight)
        score += (preferences.eras[artist.era] || 0) * 1;

        // Add some randomness for diversity
        score += Math.random() * 10;

        return score;
    }

    selectRecommendations(scoredArtists) {
        const recommendations = [];
        const count = Math.min(this.recommendationCount, scoredArtists.length);

        // Filter out recently shown artists for fresh recommendations
        const freshArtists = scoredArtists.filter(artist =>
            !this.recentlyShown.includes(artist.id)
        );

        // If we don't have enough fresh artists, use all scored artists
        const availableArtists = freshArtists.length >= count ? freshArtists : scoredArtists;

        // Take top 70% from highest scores, and 30% from random selection for diversity
        const topCount = Math.ceil(count * 0.7);
        const randomCount = count - topCount;

        // Add top scored artists
        recommendations.push(...availableArtists.slice(0, topCount));

        // Add random artists from the rest
        const remaining = availableArtists.slice(topCount);
        for (let i = 0; i < randomCount && remaining.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * remaining.length);
            recommendations.push(remaining.splice(randomIndex, 1)[0]);
        }

        // Track these as recently shown
        recommendations.forEach(artist => {
            if (!this.recentlyShown.includes(artist.id)) {
                this.recentlyShown.push(artist.id);
            }
        });

        // Keep recently shown list manageable (last 24 artists)
        if (this.recentlyShown.length > 24) {
            this.recentlyShown = this.recentlyShown.slice(-24);
        }

        return recommendations;
    }

    shuffleRecommendations() {
        this.generateRecommendations();
    }

    removeRecommendation(artistId) {
        // Remove from current recommendations
        this.currentRecommendations = this.currentRecommendations.filter(
            artist => artist.id !== artistId
        );

        const rated = Object.keys(this.userRatings);

        // If no ratings yet, get replacement from initial bands pool
        if (rated.length === 0) {
            const allInitialBands = this.getInitialBandsPool();
            const availableBands = allInitialBands.filter(artist =>
                !this.currentRecommendations.some(rec => rec.id === artist.id) &&
                !this.toListenList.some(item => item.id === artist.id)
            );

            if (availableBands.length > 0) {
                // Pick a random band from available pool
                const randomIndex = Math.floor(Math.random() * availableBands.length);
                this.currentRecommendations.push(availableBands[randomIndex]);
            }
        } else {
            // Get a new recommendation based on preferences
            const preferences = this.getUserPreferences();
            const unratedArtists = this.artists.filter(artist =>
                !this.userRatings[artist.id] &&
                !this.toListenList.some(item => item.id === artist.id) &&
                !this.currentRecommendations.some(rec => rec.id === artist.id)
            );

            if (unratedArtists.length > 0) {
                const scoredArtists = unratedArtists.map(artist => ({
                    ...artist,
                    score: this.calculateArtistScore(artist, preferences)
                }));

                scoredArtists.sort((a, b) => b.score - a.score);

                // Add with some randomness
                const index = Math.floor(Math.random() * Math.min(10, scoredArtists.length));
                this.currentRecommendations.push(scoredArtists[index]);
            }
        }

        this.renderRecommendations();
    }

    // Get full pool of initial bands (not just the subset shown)
    getInitialBandsPool() {
        const popularBandIds = [
            // Classic Rock
            1,   // The Beatles
            2,   // Led Zeppelin
            3,   // Pink Floyd
            11,  // The Rolling Stones
            18,  // Jimi Hendrix
            21,  // Queen
            44,  // The Who
            43,  // The Beach Boys
            47,  // The Doors
            9,   // The Velvet Underground
            56,  // The Kinks

            // Hard Rock & Metal
            26,  // Black Sabbath
            33,  // Metallica
            82,  // Slayer

            // Punk & Post-Punk
            13,  // The Clash
            31,  // The Ramones
            20,  // Joy Division
            27,  // The Cure
            71,  // Television
            98,  // Bauhaus

            // Alternative & Indie
            8,   // Nirvana
            7,   // Radiohead
            22,  // The Smiths
            42,  // Pixies
            65,  // R.E.M.
            79,  // The White Stripes
            88,  // The Strokes
            38,  // Sonic Youth
            48,  // Pavement
            77,  // Smashing Pumpkins
            107, // Arcade Fire

            // Influential Solo Artists
            6,   // David Bowie
            5,   // Bob Dylan
            52,  // Neil Young
            53,  // Patti Smith
            78,  // Tom Waits

            // Pop & R&B Icons
            12,  // Michael Jackson
            16,  // Prince
            25,  // Stevie Wonder
            15,  // Aretha Franklin
            19,  // Marvin Gaye

            // Reggae & World
            39,  // Bob Marley
            49,  // Fela Kuti
            93,  // Buena Vista Social Club

            // Hip-Hop
            10,  // Public Enemy
            23,  // Wu-Tang Clan
            54,  // N.W.A
            50,  // The Notorious B.I.G.
            70,  // Tupac Shakur

            // Electronic & Experimental
            14,  // Kraftwerk
            34,  // Daft Punk
            28,  // Talking Heads
            60,  // New Order
            45,  // Depeche Mode
        ];

        return popularBandIds
            .map(id => this.artists.find(artist => artist.id === id))
            .filter(artist => artist);
    }

    // To Listen List Methods
    addToListenList(artist) {
        if (this.toListenList.some(item => item.id === artist.id)) {
            return; // Already in list
        }

        this.toListenList.push({
            id: artist.id,
            name: artist.name,
            genres: artist.genres,
            timestamp: Date.now()
        });

        this.saveToStorage();
        this.updateToListenUI();

        // Remove from recommendations
        this.removeRecommendation(artist.id);
    }

    removeFromListenList(artistId) {
        this.toListenList = this.toListenList.filter(item => item.id !== artistId);
        this.saveToStorage();
        this.updateToListenUI();
    }

    // UI Rendering Methods
    renderRecommendations() {
        const container = document.getElementById('recommendationsContainer');
        const template = document.getElementById('recommendationCardTemplate');

        container.innerHTML = '';

        this.currentRecommendations.forEach(artist => {
            const card = template.content.cloneNode(true);

            // Set artist name
            card.querySelector('.artist-name').textContent = artist.name;

            // Set year and era
            card.querySelector('.year-badge').textContent = artist.year;
            card.querySelector('.era-badge').textContent = artist.era;

            // Set genres
            const genresContainer = card.querySelector('.genres-list');
            artist.genres.slice(0, 3).forEach(genre => {
                const tag = document.createElement('span');
                tag.className = 'genre-tag';
                tag.textContent = genre;
                genresContainer.appendChild(tag);
            });

            // Set themes
            const themesContainer = card.querySelector('.themes-list');
            artist.themes.slice(0, 4).forEach(theme => {
                const tag = document.createElement('span');
                tag.className = 'theme-tag';
                tag.textContent = theme;
                themesContainer.appendChild(tag);
            });

            // Setup rating stars
            const ratingStars = card.querySelector('.rating-stars');
            const starButtons = ratingStars.querySelectorAll('.star-btn');

            starButtons.forEach(star => {
                // Click handler
                star.addEventListener('click', (e) => {
                    const rating = parseInt(e.target.dataset.rating);
                    this.rateArtist(artist.id, rating);
                    this.removeRecommendation(artist.id);
                    this.generateRecommendations();
                });

                // Hover effect - light up all stars up to hovered one
                star.addEventListener('mouseenter', (e) => {
                    const rating = parseInt(e.target.dataset.rating);
                    starButtons.forEach(s => {
                        const starRating = parseInt(s.dataset.rating);
                        if (starRating <= rating) {
                            s.classList.add('hover');
                        } else {
                            s.classList.remove('hover');
                        }
                    });
                });
            });

            // Remove hover effect when leaving the entire star container
            ratingStars.addEventListener('mouseleave', () => {
                starButtons.forEach(s => s.classList.remove('hover'));
            });

            // Setup trash button
            const trashBtn = card.querySelector('.trash-btn');
            trashBtn.addEventListener('click', () => {
                this.removeRecommendation(artist.id);
            });

            // Setup to-listen button
            const toListenBtn = card.querySelector('.btn-to-listen');
            toListenBtn.addEventListener('click', () => {
                this.addToListenList(artist);
            });

            container.appendChild(card);
        });
    }

    updateToListenUI() {
        const container = document.getElementById('toListenList');
        const countBadge = document.getElementById('toListenCount');
        const template = document.getElementById('toListenItemTemplate');

        countBadge.textContent = this.toListenList.length;

        if (this.toListenList.length === 0) {
            container.innerHTML = '<div class="empty-message">No artists in your list yet</div>';
            return;
        }

        container.innerHTML = '';

        // Sort by most recent
        const sorted = [...this.toListenList].sort((a, b) => b.timestamp - a.timestamp);

        sorted.forEach(item => {
            const element = template.content.cloneNode(true);

            element.querySelector('.to-listen-name').textContent = item.name;
            element.querySelector('.to-listen-genres').textContent = item.genres.join(', ');

            const removeBtn = element.querySelector('.to-listen-remove');
            removeBtn.addEventListener('click', () => {
                this.removeFromListenList(item.id);
            });

            container.appendChild(element);
        });
    }

    updateStatsUI() {
        const ratedCount = Object.keys(this.userRatings).length;
        const avgRating = this.calculateAverageRating();
        const genreCount = this.calculateUniqueGenres();

        document.getElementById('ratedCount').textContent = ratedCount;
        document.getElementById('avgRating').textContent = avgRating;
        document.getElementById('genreCount').textContent = genreCount;
    }

    calculateAverageRating() {
        const ratings = Object.values(this.userRatings);
        if (ratings.length === 0) return '0';

        const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
        return (sum / ratings.length).toFixed(1);
    }

    calculateUniqueGenres() {
        const genres = new Set();

        Object.keys(this.userRatings).forEach(artistId => {
            const artist = this.artists.find(a => a.id == artistId);
            if (artist) {
                artist.genres.forEach(genre => genres.add(genre));
            }
        });

        return genres.size;
    }

    updateUI() {
        this.updateToListenUI();
        this.updateStatsUI();
    }

    // Event Listeners
    setupEventListeners() {
        // Shuffle button
        document.getElementById('shuffleBtn').addEventListener('click', () => {
            this.shuffleRecommendations();
        });

        // Clear data button
        document.getElementById('clearDataBtn').addEventListener('click', () => {
            this.clearStorage();
        });

        // Add artist form
        const form = document.getElementById('addArtistForm');
        const ratingInput = document.getElementById('addArtistRating');
        let selectedRating = 0;

        // Rating input for add artist form
        const starButtons = ratingInput.querySelectorAll('.star-btn');

        starButtons.forEach(star => {
            star.addEventListener('click', (e) => {
                e.preventDefault();
                selectedRating = parseInt(e.target.dataset.rating);

                // Update visual state
                starButtons.forEach(s => {
                    if (parseInt(s.dataset.rating) <= selectedRating) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });
            });

            star.addEventListener('mouseenter', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                starButtons.forEach(s => {
                    if (parseInt(s.dataset.rating) <= rating) {
                        s.classList.add('hover');
                    } else {
                        s.classList.remove('hover');
                    }
                });
            });
        });

        ratingInput.addEventListener('mouseleave', () => {
            starButtons.forEach(s => {
                s.classList.remove('hover');
            });
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const artistName = document.getElementById('artistName').value.trim();

            if (!artistName) {
                alert('Please enter an artist name');
                return;
            }

            if (selectedRating === 0) {
                alert('Please select a rating');
                return;
            }

            this.addCustomArtist(artistName, selectedRating);

            // Reset form
            form.reset();
            selectedRating = 0;
            starButtons.forEach(s => {
                s.classList.remove('active');
                s.classList.remove('hover');
            });

            // Show success feedback
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="icon">✓</span> Added!';
            submitBtn.style.background = 'var(--success)';

            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.style.background = '';
            }, 2000);
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MusicRecommender();
});
