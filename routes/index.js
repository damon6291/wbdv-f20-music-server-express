var express = require('express');
var request = require('request');
var router = express.Router();
var body_parser = require('body-parser');
var cors = require('cors');

var app = express();

app.use(cors());
app.use(body_parser.json());

const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://Hussein1324:Hussein1324@users.xnopa.mongodb.net/Users?retryWrites=true&w=majority';
const client = new MongoClient(uri);
//newListing is the document to insert
async function createUser(client, newListing) {
  await client.connect();
  await client.db('Users').collection('Login').insertOne(newListing);
  await client.db('Users').collection('Followers').insertOne();
}

async function createUserFollowers(client, newListing) {
  await client.connect();
  await client.db('Users').collection('Followers').insertOne(newListing);
}

async function retrieveUsers(client) {
  await client.connect();
  const result = await client.db('Users').collection('Login').find({}).toArray();
  return result;
}

async function retrieveFollowers(client) {
  await client.connect();
  const result = await client.db('Users').collection('Followers').find({}).toArray();
  return result;
}

async function retrieveAllPosts(client) {
  await client.connect();
  const result = await client.db('Users').collection('Posts').find({}).toArray();
  return result;
}

async function retrieveAllTokens(client) {
  await client.connect();
  const result = await client.db('Users').collection('SpotifyTokens').find({}).toArray();
  return result;
}

async function updatePost(client, id, updatedListing) {
  var myquery = { id: id };
  var newvalues = { $set: updatedListing };
  await client.connect();
  await client
    .db('Users')
    .collection('Posts')
    .updateOne(myquery, newvalues, function (err, res) {
      if (err) throw err;
      console.log('1 document updated');
      db.close();
    });
}

async function updateFollowing(client, username, updatedListing) {
  var myquery = { username: username };
  var newvalues = { $set: updatedListing };
  await client.connect();
  await client
    .db('Users')
    .collection('Followers')
    .updateOne(myquery, newvalues, function (err, res) {
      if (err) throw err;
      db.close();
    });
}

async function createPost(client, newListing) {
  await client.connect();
  await client.db('Users').collection('Posts').insertOne(newListing);
}

async function deletePost(client, id) {
  await client.connect();
  await client
    .db('Users')
    .collection('Posts')
    .deleteOne({ _id: new mongodb.ObjectID(id) });
}

app.post('/api/registerUser', (req, res) => {
  username = req.body.username;
  password = req.body.password;
  display_name = req.body.displayName;

  async function getAllUsers() {
    error = false;
    arr = await retrieveUsers(client);
    for (i = 0; i < arr.length; i++) {
      if (username == arr[i].username) {
        error = true;
        break;
      }
    }
    if (error) {
      res.json({
        message: 'UserName: ' + username + ' already taken. Please choose a new name.',
      });
    } else {
      try {
        await createUser(client, { username, password, display_name });
        await createUserFollowers(client, { username, followers: [], following: [] });
        console.log('user created successfully');
        res.json({
          message: 'Success',
        });
      } catch (e) {
        console.log(e);
        res.json({
          message: "We're Sorry, there was an issue creating your account. Try again later!",
        });
      }
    }
  }
  getAllUsers();
});

app.post('/loginUser', (req, res) => {
  username = req.body.username;
  password = req.body.password;

  async function getAllUsers() {
    arr = await retrieveAllSaved(client);
    for (i = 0; i < arr.length; i++) {
      if (username == arr[i].username) {
        if (password == arr[i].password) {
          success = true;
          break;
        }
      }
    }
    if (!success) {
      res.json({
        message: 'UserName: ' + username + ' not found or password is incorrect',
      });
    } else {
      res.json({
        message: 'Success',
      });
    }
  }
  getAllUsers();
});

app.post('/followUser', (req, res) => {
  userName = req.body.userName;
  userToFollow = req.body.userToFollow;

  async function followUser() {
    error = false;
    arr = await retrieveFollowers(client);
    user = arr.find((user) => user.username == userToFollow);
    user['followers'].push(userName);
    newListing = { followers: user['followers'] };
    updateFollowing(client, userToFollow, newListing);

    userII = arr.find((user) => user.username == userName);
    userII['following'].push(userToFollow);
    newListingII = { following: user['following'] };
    updateFollowing(client, userToFollow, newListingII);
  }
  followUser();
});

app.post('/createPost', (req, res) => {
  username = req.body.post_username;
  post_heading = req.body.post_heading;
  post_paragraph = req.body.post_paragraph;
  post_link = req.body.post_link;
  post_time = new Date();
  post_likes = 0;

  async function makePost() {
    try {
      await createPost(client, {
        username,
        heading: post_heading,
        body: post_paragraph,
        src: post_link,
        time: post_time,
        likes: post_likes,
      });
      return res.send(JSON.stringify({ message: 'Success' }));
    } catch (e) {
      return res.send(
        JSON.stringify({ message: 'There was an error creating your post. Please retry' })
      );
      console.log(e);
    }
  }
  makePost();
});

app.post('/getAllPosts', (req, res) => {
  async function getPosts() {
    try {
      arr = await retrieveAllPosts(client);
      res.json({
        results: arr,
      });
    } catch (e) {
      console.log(e);
      res.json({
        message: 'There was an error retrieving posts',
      });
    }
  }
  getPosts();
});

app.get('/likedPost', (req, res) => {
  post_id = req.body.post_id;
  post_likes = req.body.prev_post_likes + 1;

  async function updatedLike() {
    try {
      await updatePost(client, post_id, { post_likes: post_likes });
      res.json({
        message: 'Success',
      });
    } catch (e) {
      res.json({
        message: 'There was an error updating the likes to this post ',
      });
    }
  }
  updatedLike();
});

app.post('/updatePost', (req, res) => {
  post_id = req.body.post_id;
  updated_post = req.body.updated_post;
  async function updatePosts() {
    try {
      await updatePost(client, post_id, updated_post);
      res.json({
        message: 'Success',
      });
    } catch (e) {
      console.log(e);
      res.json({
        message: 'There was an error updating Post. Please try again later',
      });
    }
  }
  updatePost();
});

app.post('/deletePost', (req, res) => {
  post_id = req.body.post_id;
  async function deletePosts() {
    try {
      await deletePost(client, post_id);
      res.json({
        message: 'Success',
      });
    } catch (e) {
      res.json({
        message: 'Cannot Delete Post. Please try again later',
      });
    }
  }
  deletePosts();
});

//For test server
var serverUrl = 'http://localhost:8080/';
var clientUrl = 'http://localhost:3000/';

//For deployment
//var serverUrl = 'https://wbdv-f20-music-server-spotify.herokuapp.com/';
//var clientUrl = 'https://wbdv-f20-music.herokuapp.com/';

//Hussein
var client_id = '64a311df55f24059a326323c754eedfd';
var client_Secret = '71ed2c4226d746488ca2afd497128671';

//Damon
//var client_id = '33f50a3d11604feda7d71a1676962fd4';
//var client_Secret = 'f668a134308b44bb83e1e6f051ef6a8a';

var redirect_uri = `${serverUrl}post_authentication`;
var constant_access_token =
  ['BQCSTtFbENz0sLDQW2VJbtns02QPLIcnnG-perIleJGSa_r8M5AXOrS0O7PewyyG3K-Ad46RIpnvLCkJf_shsT89baXzqZK5BDnk0D-8pFf50M8YTXAtjH8-KzQCHaGiFDKtTS7f33nDuoxqR7-oQ5_CqeVRlcMycbrvyixXo67X0Nj9iwNxo_WXB7S2TmSnMJwHy_bc-PTiUQ7-sGBzmIGYo-oXE5JL7HTLU4HLj30cKcxLjNn_-6uk9jYVdfoSHUezOmAjGmIHozRFkjZGzSDd'];
var constant_refresh_token =
  ['AQCKvYSAjSY4q9_86018kjOuzA46cy2i8_Tz6WAO-V72pXtxr2RJcupWNxPUodU8k-QifMC6LzxOdG_hMEAwj9FrGSLCvSeWY3MqyNt7vfT4RpwJV51yo7ZCX_3J_CRLsW4'];
var access_token = constant_access_token[0];

app.get('/api/spotifylogin/:userName', (req, res) => {
  const username = req.params.userName;
  var scope =
    'ugc-image-upload%20user-read-recently-played%20' +
    'user-read-playback-position%20user-top-read%20' +
    'playlist-modify-private%20playlist-read-collaborative%20' +
    'playlist-read-private%20playlist-modify-public%20' +
    'user-read-email%20user-read-private%20streaming%20app-remote-control%20user-follow-read%20' +
    'user-follow-modify%20user-library-modify%20user-library-read%20user-read-currently-playing%20' +
    'user-read-playback-state%20 + user-modify-playback-state';
  res.redirect(
    'https://accounts.spotify.com/authorize?client_id=' +
      client_id +
      '&response_type=code&redirect_uri=' +
      redirect_uri +
      '&scope=' +
      scope +
      '&show_dialog=true'
  );
  app.get('/post_authentication', (req, res) => {
    code = req.query.code;
    console.log(code);
  
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code',
      },
      headers: {
        Authorization: 'Basic ' + new Buffer(client_id + ':' + client_Secret).toString('base64'),
      },
      json: true,
    };
  
    request.post(authOptions, (error, response, body) => {
      if (error) {
        console.log('there has been an error with authentication');
        console.log(error);
      } else {
        console.log(body);
        access_token = body.access_token;
        console.log('access token is ');
        console.log(access_token);
  
        registerUserNameSpotifyToken(client, {
          username,
          access_token: body.access_token,
          refresh_token: body.refresh_token,
        });
        res.redirect(clientUrl + 'Home');
      }
    });
  });
});

function registerUserNameSpotifyToken(client, newListing) {
  async function registerToken() {
    try {
      await client.connect();
      await client.db('Users').collection('SpotifyTokens').insertOne(newListing);
    } catch (e) {
      console.log(e);
    }
  }
  registerToken();
};

function refresh_access_spotify_constant() {
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      refresh_token: constant_refresh_token[0],
      grant_type: 'refresh_token',
    },
    headers: {
      Authorization: 'Basic ' + new Buffer(client_id + ':' + client_Secret).toString('base64'),
    },
    json: true,
  };
  request.post(authOptions, (error, response, body) => {
    console.log(body);
    if (body.refresh_token != undefined) {
      constant_refresh_token[0] = body.refresh_token;
    }
    constant_access_token[0] = body.access_token;
  });
}

setInterval(refresh_access_spotify_constant, 360000);

refresh_access_spotify_constant();

app.get('/api/myprofile/following/:userName', (req, res) => {
  userName = req.params['userName'];
  retrieveAllTokens(client).then(tokens => 
    {
      user_tokens = tokens.find(user => user['username'] == userName)

      var authOptions = {
        url: 'https://api.spotify.com/v1/me/following?type=artist',
        headers: { Authorization: 'Bearer ' + user_tokens['access_token'] },
      };
      request.get(authOptions, (error, response, body) => {
        if (error) {
          console.log(error);
        } else {
          res.send(JSON.stringify(body));
        }
      });
    });
});

app.get('/api/myprofile/:userName', (req, res) => {
  userName = req.params['userName'];
  retrieveAllTokens(client).then(tokens => 
    {
      user_tokens = tokens.find(user => user['username'] == userName)
      var authOptions = {
        url: 'https://api.spotify.com/v1/me/',
        headers: { Authorization: 'Bearer ' + user_tokens['access_token'] },
      };
    
      request.get(authOptions, (error, response, body) => {
        if (error) {
          console.log(error);
        } else {
          res.send(JSON.stringify(response.body));
        }
      });
    
    });
});

app.get('/api/profile/:profileId/:userName', (req, res) => {
  let userName = req.params['userName'];
  let profileId = req.params['profileId'];

  retrieveAllTokens(client).then(tokens => {
    user_tokens = tokens.find(user => user['username'] == userName)
    var authOptions = {
      url: 'https://api.spotify.com/v1/users/' + profileId,
      headers: { Authorization: 'Bearer ' + user_tokens['access_token'] },
    };
    request.get(authOptions, (error, response, body) => {
      if (error) {
        console.log(error);
      } else {
        res.send(JSON.stringify(response.body));
      }
    });
  });
});

app.get('/api/profile/:profileId/playlists/:userName', (req, res) => {
  let profileId = req.params['profileId'];
  let userName = req.params['userName'];

  retrieveAllTokens(client).then(tokens => {
    user_tokens = tokens.find(user => user['username'] == userName)
    var authOptions = {
      url: 'https://api.spotify.com/v1/users/' + profileId + '/playlists',
      headers: { Authorization: 'Bearer ' + user_tokens['access_token'] },
    };
    request.get(authOptions, (error, response, body) => {
      if (error) {
        console.log(error);
      } else {
        res.json({
          results: response.body,
        });
      }
    });
  })
});

app.get('/api/playlist/:playlistId/details', (req, res) => {
  let playlistId = req.params['playlistId'];
  refresh_access_spotify_constant()
  var authOptions = {
    url: 'https://api.spotify.com/v1/playlists/' + playlistId,
    headers: { Authorization: 'Bearer ' + constant_access_token[0] },
  };
  request.get(authOptions, (error, response, body) => {
    if (error) {
      console.log(error);
    } else {
      res.send(JSON.stringify(response.body));
    }
  });
});

app.get('/api/playlists/:query', (req, res) => {
  let query = req.params['query'];
  query.replace(' ', '%20');
  refresh_access_spotify_constant(constant_refresh_token[0]);

  var authOptions = {
    url: 'https://api.spotify.com/v1/search?q=' + query + '&type=playlist',
    headers: { Authorization: 'Bearer ' + constant_access_token[0] },
  };
  request.get(authOptions, (error, response, body) => {
    if (error) {
      console.log(error);
    } else {
      res.json({
        results: response.body,
      });
    }
  });
});

app.get('/trackinformation', (req, res) => {
  //need to fix this
  //change app.get to app.post
  try {
    //12VpffJDy2d2F64t0rTrbh
    //track_id = req.body.id
    track_id = '12VpffJDy2d2F64t0rTrbh';
    access_token = client_access_token[0];
    var authOptions = {
      url: 'https://api.spotify.com/v1/tracks/' + track_id,
      headers: { Authorization: 'Bearer ' + access_token },
    };
    request.get(authOptions, (error, response, body) => {
      general_track_info = body;
      var authOptions2 = {
        url: 'https://api.spotify.com/v1/audio-features/' + track_id,
        headers: { Authorization: 'Bearer ' + access_token },
      };
      request.get(authOptions2, (error, response, body) => {
        specific_track_info = body;
        res.json({
          general_track_info,
          specific_track_info,
        });
        //                var authOptions3 = {
        //                    url: 'https://api.spotify.com/v1/audio-analysis/' + track_id,
        //                    headers: {'Authorization': 'Bearer ' + access_token}
        //                }
        //                request.get(authOptions3, (error, response, body) => {
        //                    console.log(body);
        //                    track_analysis = body;
        //                    res.json({
        //                        general_track_info,
        //                        specific_track_info,
        //                        track_analysis
        //                    })
        //                })
      });
    });
  } catch (e) {}
});

app.get('/user_profile/:username', (req, res) => {
  userName = req.params['username'];
  retrieveAllTokens(client).then(tokens => {
    user_Tokens = tokens.find((user) => user['username'] == userName);
    try {
      var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
          refresh_token: user_Tokens['refresh_token'],
          grant_type: 'refresh_token',
        },
        headers: {
          Authorization: 'Basic ' + new Buffer(client_id + ':' + client_Secret).toString('base64'),
        },
        json: true,
      };
      console.log("im before router")
      request.post(authOptions, (error, response, body) => {
        console.log("IM IN HERE");
        if(error) {
          console.log(error);
        }
        else {
          access_token = body.access_token;
          var authOptions = {
            method: 'GET',
            url: 'https://api.spotify.com/v1/me',
            headers: {
              Authorization: 'Bearer ' + access_token,
            },
          };
          request.get(authOptions, (error, response, body) => {
            general_user_info = body;
            console.log(body);
            var authOptions2 = {
              url: 'https://api.spotify.com/v1/me/top/tracks',
              headers: { Authorization: 'Bearer ' + access_token },
            };
            request.get(authOptions2, (error, response, body) => {
              top_tracks = body;
              var authOptions3 = {
                url: 'https://api.spotify.com/v1/me/top/artists',
                headers: { Authorization: 'Bearer ' + access_token },
              };
              request.get(authOptions3, (error, response, body) => {
                top_artists = body;
                console.log(top_tracks);
                console.log(top_artists);
                res.json({
                  general_user_info,
                  top_tracks,
                  top_artists,
                });
              });
            });
          });
        }  
      });
    } catch (e) {
      console.log('there was an error retrieving user profile information');
      console.log(e);
    }
  })
});

/* GET home page. */
app.get('/', function (req, res) {
  res.json({ title: 'Express' });
});



app.listen(8080);

module.exports = app;
