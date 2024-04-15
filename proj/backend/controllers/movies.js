const db = require('../database');

exports.getMovies = async (req, res) => {
    try {
        const query = `
        FOR doc IN imdb_vertices
        FILTER doc.type == "Movie"
        LIMIT 20
        RETURN doc
        `;

        const cursor = await db.query(query);
        const movies = await cursor.all();
        res.status(200).json(movies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMovie = async (req, res) => {
    const { id } = req.params;
    
    try {
        const query = `
            FOR movie IN imdb_vertices
            FILTER movie._id == '${id}'
            RETURN movie
        `;
        const cursor = await db.query(query);
        const movie = await cursor.next();
        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        res.status(200).json(movie);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMovieActors = async (req, res) => {
    const { id } = req.params;
    
    try {
        const query = `
            FOR movie IN imdb_vertices
            FILTER movie._id == '${id}'
            FOR actor, edge IN 1..1 OUTBOUND movie imdb_edges
                FILTER edge.$label == 'ACTS_IN'
                RETURN actor
        `;
        const cursor = await db.query(query);
        const actors = await cursor.all();
        if (actors.length === 0) {
            return res.status(404).json({ error: 'Movie Actors not found' });
        }
        res.status(200).json(actors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

