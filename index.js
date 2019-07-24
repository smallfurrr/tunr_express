
/**
 * ===================================
 * Configurations and set up
 * ===================================
 */
const express = require('express');
const methodOverride = require('method-override');
const pg = require('pg');

// Initialise postgres client
const configs = {
  user: 'elisu',
  host: '127.0.0.1',
  database: 'tunr_db',
  port: 5432,
};

const pool = new pg.Pool(configs);
pool.on('error', function (err) {
  console.log('idle client error', err.message, err.stack);
});

// Init express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(methodOverride('_method'));

// Set react-views to be the default view engine
const reactEngine = require('express-react-views').createEngine();
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'jsx');
app.engine('jsx', reactEngine);

/**
 * ===================================
 * Routes
 * ===================================
 */

/* ==== Front Page ==== */
app.get('/', (request, response) => {
  // for now just say hello world
  response.send('Hello World!');
});

/* ==== Request Artist Index Page ==== */
app.get('/artists', (request, response) => {
    console.log("now getting artists");
    let queryString = "SELECT * FROM artists order by id";

    pool.query(queryString, (err, result) => {

        if (err) {
            console.log('query error:', err.stack);
            response.send('query error');
        } else {
            console.log('loading artists page');
            // response.send(result);
            response.render('artists.jsx', result);
        }
    });
});

/* ==== Request CREATE Individual Artist Page ==== */
app.get('/artists/new', (request, response) => {
    response.render('new.jsx');
});

/* ==== POSTING Individual Artist Page ==== */
app.post('/artists', (request, response) => {
    let newArtist = request.body;
    console.log(newArtist);

    let values = [request.body.name, request.body.photo_url, request.body.nationality];
    let queryString = "INSERT INTO artists(name,photo_url,nationality)VALUES($1,$2,$3)";

    pool.query(queryString, values, (err, result) => {
        if (err) {
            console.log(err);
            response.send("query error");
        } else {
            console.log("artist successfully added!")
            // let url = "/artists/" + newArtist.id;
            response.redirect('/artists');
        }
    })
});

/* ==== Request Individual Artist Page ==== */
app.get('/artists/:id', (request, response) => {
    artistId = parseInt(request.params.id);

    let values = [artistId];
    let queryString = "SELECT * FROM artists WHERE id =$1";

    pool.query(queryString, values, (err, result) => {

        if (err) {
            console.log('query error:', err.stack);
            response.send('query error');
        } else {
            console.log('loading individual artist page');
            response.render('artist.jsx', result);
        }
    });
})

/* ==== Request Edit Individual Artist ==== */
app.get('/artists/:id/edit', (request, response) => {
    artistId = parseInt(request.params.id);

    let values = [artistId];
    let queryString = "SELECT * FROM artists WHERE id =$1";

    pool.query(queryString, values, (err, result) => {

        if (err) {
            console.log('query error:', err.stack);
            response.send('query error');
        } else {
            console.log('loading individual artist edit page');
            response.render('edit.jsx', result);
        }
    });
});

/* ==== Accepting Edit Individual Request ==== */
app.put('/artists/:id', (request, response) => {
    let id = request.params.id;
    let editedArtist = request.body;
    let text = 'UPDATE artists SET name=$1, photo_url=$2, nationality=$3 WHERE id = $4';
    let values = [request.body.name, request.body.photo_url, request.body.nationality, id];

    pool.query(text, values, (err, result) => {
        if (err) {
            console.log(err);
            response.send("query error");
        } else {
            console.log("artist successfully edited!")
            response.redirect('/artists');
        }
    })
});

/* ==== Request Delete Artist ==== */
app.get('/artists/:id/delete', (request, response) => {
    let id = parseInt(request.params.id);
    let queryString = 'DELETE from artists WHERE artist_id = $1';
    let values = [id];

    pool.query(queryString, values, (err, result) => {
        if (err) {
            console.log(err);
            response.send("query error");
        } else {
            console.log("artist successfully deleted!")
            response.redirect('/artists');
        }
    })
})


/**
 * ===================================
 * Listen to requests on port 3000
 * ===================================
 */
const server = app.listen(3000, () => console.log('~~~ Tuning in to the waves of port 3000 ~~~'));

let onClose = function(){

  console.log("closing");

  server.close(() => {

    console.log('Process terminated');

    pool.end( () => console.log('Shut down db connection pool'));
  })
};

process.on('SIGTERM', onClose);
process.on('SIGINT', onClose);