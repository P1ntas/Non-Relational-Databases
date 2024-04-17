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
    const decodedId = decodeURIComponent(id);
    
    console.log("Encoded ID:", id);
    console.log("Decoded ID:", decodedId);
    
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

exports.getComment = async (req, res) => {
    const { id } = req.params;
    const decodedId = decodeURIComponent(id);

    try {
        const cursor = await db.query(`
        FOR comments in imdb_edges 
            FILTER comments._to == '${decodedId}' AND
            comments.$label == 'comments'
            RETURN comments`)

        const movies = await cursor.all();
        res.status(200).json(movies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.postComment = async (req, res) => {
    console.log("Received data:", req.body);
    const { _to, content, timestamp, $label } = req.body;

    if (!_to || !content || !timestamp || !$label) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const query = `
            INSERT {
                "_from": "Users/15029",
                "_to": "${_to}",
                "content": "${content}",
                "timestamp": "${timestamp}",
                "$label": "${$label}"
            } INTO imdb_edges
        `;
        await db.query(query);
        res.status(201).json({ message: 'Comment added successfully' });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getLikeStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            FOR edge IN imdb_edges
            FILTER edge._from == 'Users/15029' && edge._to == '${id}' && edge.$label == 'reacts'
            RETURN edge
        `;
        const cursor = await db.query(query);
        const result = await cursor.next();
        res.status(200).json(result ? result.like : 0);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.postLike = async (req, res) => {
    const { id } = req.params;
    const { like } = req.body;
    try {
        const query = `
            UPSERT {_from: 'Users/15029', _to: '${id}', $label: 'reacts'}
            INSERT {_from: 'Users/15029', _to: '${id}', \`like\`: ${like}, $label: 'reacts'}
            UPDATE {\`like\`: ${like}}
            IN imdb_edges
        `;
        await db.query(query);
        res.status(200).json({ message: 'Like status updated' });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: error.message });
    }
};