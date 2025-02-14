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

exports.searchMovie = async (req, res) => {
    const { input } = req.params;
    try {
        const query = `
            FOR d IN movieView 
            SEARCH ANALYZER(
                (d.title IN TOKENS('${input}', 'text_en')) OR 
                (d.description IN TOKENS('${input}', 'text_en')), 'text_en')
            SORT BM25(d) DESC
            LIMIT 10
            RETURN d
        `;
        const cursor = await db.query(query);
        const movies = await cursor.all();
        if (!movies) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        res.status(200).json(movies);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.similarMovies = async (req, res) => {
    const { movieId } = req.params;
    try {
        const query = `
        LET m = (FOR d IN movieView FILTER d._id == @movieId RETURN {title:d.title, description: d.description, genre: d.genre })
        LET movie = m[0]
        
        FOR d IN movieView
          SEARCH ANALYZER(d.description IN TOKENS(movie.description, 'text_en'), 'text_en')
          FILTER d._id != @movieId
          SORT TFIDF(d) DESC LIMIT 3
          
        RETURN {
          title: d.title,
          description: d.description,
          genre: d.genre
          }
        `;
        const cursor = await db.query(query, { movieId });
        const movies = await cursor.all();
        if (!movies) {
            return res.status(404).json({ error: 'Movies not found' });
        }
        res.status(200).json(movies);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: error.message });
    }
};
exports.moviesWithActorsInCommon = async (req, res) => {
    const { movieId } = req.params;
    try {
        const query = `
            LET sourceMovieActors = (
                FOR v, e IN 1..1 INBOUND '${movieId}' imdb_edges
                    FILTER e.$label == "ACTS_IN"
                    RETURN DISTINCT { _id: v._id, name: v.name }
            )
            FOR movie IN imdb_vertices
                FILTER movie.type == "Movie" && movie._id != '${movieId}'

                LET targetMovieActors = (
                    FOR v, e IN 1..1 INBOUND movie._id imdb_edges
                        FILTER e.$label == "ACTS_IN"
                        RETURN DISTINCT { _id: v._id, name: v.name }
                )
                LET commonActors = INTERSECTION(sourceMovieActors, targetMovieActors)
                FILTER LENGTH(commonActors) > 0
                SORT LENGTH(commonActors) DESC
                LIMIT 3
                RETURN {
                    movieId: movie._id,
                    title: movie.title,
                    commonActors
                }

        `;
        const cursor = await db.query(query);
        const movies = await cursor.all();
        if (!movies) {
            return res.status(404).json({ error: 'Movies not found' });
        }
        res.status(200).json(movies);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getMovieActors = async (req, res) => {
    const { id } = req.params;
    const decodedId = decodeURIComponent(id);
    
    try {
        const query = `
            FOR movie IN imdb_vertices
            FILTER movie._id == '${decodedId}'
            FOR edge IN imdb_edges
                FILTER edge._to == movie._id && edge.$label == 'ACTS_IN'
                RETURN DOCUMENT(edge._from)
        `;
        const cursor = await db.query(query);
        const actors = await cursor.all();
        if (actors.length === 0) {
            return res.status(404).json({ error: 'Movie Actors not found for ID: ' + decodedId });
        }
        res.status(200).json(actors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMovieDirectors = async (req, res) => {
    const { id } = req.params;
    const decodedId = decodeURIComponent(id);
    
    try {
        const query = `
            FOR movie IN imdb_vertices
            FILTER movie._id == '${decodedId}'
            FOR edge IN imdb_edges
                FILTER edge._to == movie._id && edge.$label == 'DIRECTED'
                RETURN DOCUMENT(edge._from)
        `;
        const cursor = await db.query(query);
        const directors = await cursor.all();
        if (directors.length === 0) {
            return res.status(404).json({ error: 'Movie directors not found for ID: ' + decodedId });
        }
        res.status(200).json(directors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMovieGenre = async (req, res) => {
    const { id } = req.params;
    const decodedId = decodeURIComponent(id);
    
    try {
        const query = `
            FOR movie IN imdb_vertices
            FILTER movie._id == '${decodedId}'
            FOR edge IN imdb_edges
                FILTER edge._to == movie._id && edge.$label == 'has_movie'
                RETURN DOCUMENT(edge._from)
        `;
        const cursor = await db.query(query);
        const genres = await cursor.all();
        if (genres.length === 0) {
            return res.status(404).json({ error: 'Movie genres not found for ID: ' + decodedId });
        }
        res.status(200).json(genres);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getComments = async (req, res) => {
    const { id } = req.params;
    const decodedId = decodeURIComponent(id);

    try {
        const cursor = await db.query(`
        FOR com in comments 
            FILTER com._to == '${decodedId}' AND
            com.$label == 'comments'
            RETURN com`)

        const comments = await cursor.all();
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.postComment = async (req, res) => {
    const { _from, _to, content, timestamp, $label } = req.body;

    if (!_to || !content || !timestamp || !$label) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const query = `
            INSERT {
                "_from": "${_from}",
                "_to": "${_to}",
                "content": "${content}",
                "timestamp": "${timestamp}",
                "$label": "${$label}"
            } INTO comments
        `;
        await db.query(query);
        res.status(201).json({ message: 'Comment added successfully' });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: error.message });
    }
};

