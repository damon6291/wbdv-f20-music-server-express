var express = require('express');
var request = require('request');
var router = express.Router();
var body_parser = require('body-parser');
var cors = require('cors');

var app = express();

app.use(cors());
app.use(body_parser.json());

//For test server
// var serverUrl = 'http://localhost:8080/';
// var clientUrl = 'http://localhost:3000/';

//For deployment
var serverUrl = 'https://wbdv-f20-music-server-spotify.herokuapp.com/';
var clientUrl = 'https://wbdv-f20-music.herokuapp.com/';

var client_id = '64a311df55f24059a326323c754eedfd';
var client_Secret = '71ed2c4226d746488ca2afd497128671';
var redirect_uri = serverUrl + 'post_authentication';
var client_auth_code = [];
var client_access_token = [];
var client_refresh_token = [];
var constant_access_token =
  'BQCSTtFbENz0sLDQW2VJbtns02QPLIcnnG-perIleJGSa_r8M5AXOrS0O7PewyyG3K-Ad46RIpnvLCkJf_shsT89baXzqZK5BDnk0D-8pFf50M8YTXAtjH8-KzQCHaGiFDKtTS7f33nDuoxqR7-oQ5_CqeVRlcMycbrvyixXo67X0Nj9iwNxo_WXB7S2TmSnMJwHy_bc-PTiUQ7-sGBzmIGYo-oXE5JL7HTLU4HLj30cKcxLjNn_-6uk9jYVdfoSHUezOmAjGmIHozRFkjZGzSDd';
var constant_refresh_token =
  'AQCKvYSAjSY4q9_86018kjOuzA46cy2i8_Tz6WAO-V72pXtxr2RJcupWNxPUodU8k-QifMC6LzxOdG_hMEAwj9FrGSLCvSeWY3MqyNt7vfT4RpwJV51yo7ZCX_3J_CRLsW4';
var access_token = constant_access_token;

app.get('/api/spotifylogin', (req, res) => {
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
      encodeURIComponent(redirect_uri) +
      '&scope=' +
      scope +
      '&show_dialog=true'
  );
});

app.get('/post_authentication', (req, res) => {
  code = req.query.code;
  console.log(code);
  client_auth_code = [];
  client_auth_code.push(code);

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
      client_access_token = [];
      client_refresh_token = [];
      client_access_token.push(body.access_token);
      client_refresh_token.push(body.refresh_token);
      access_token =
        client_access_token.length > 0 ? client_access_token[0] : constant_access_token;
      console.log('access token is ');
      console.log(access_token);
      res.redirect(clientUrl + 'Home');
    }
  });
});

function refresh_access_spotify() {
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      refresh_token:
        client_refresh_token.length > 0 ? client_refresh_token[0] : constant_refresh_token,
      grant_type: 'refresh_token',
    },
    headers: {
      Authorization: 'Basic ' + new Buffer(client_id + ':' + client_Secret).toString('base64'),
    },
    json: true,
  };

  request.post(authOptions, (error, response, body) => {
    console.log(body);
    client_access_token = [body.access_token];
    if (body.refresh_token != undefined) {
      client_refresh_token = [body.refresh_token];
      constant_refresh_token = body.refresh_token;
    }
    constant_access_token = body.access_token;
  });
}

setInterval(refresh_access_spotify, 3600);

app.get('/api/myprofile/following', (req, res) => {
  var authOptions = {
    url: 'https://api.spotify.com/v1/me/following?type=artist',
    headers: { Authorization: 'Bearer ' + access_token },
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

app.get('/api/myprofile', (req, res) => {
  var authOptions = {
    url: 'https://api.spotify.com/v1/me/',
    headers: { Authorization: 'Bearer ' + access_token },
  };
  console.log('myprofile access token');
  console.log(access_token);
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

app.get('/api/profile/:profileId', (req, res) => {
  let profileId = req.params['profileId'];
  // access_token = client_access_token.size > 0 ? client_access_token[0] : constant_access_token;
  var authOptions = {
    url: 'https://api.spotify.com/v1/users/' + profileId,
    headers: { Authorization: 'Bearer ' + access_token },
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

app.get('/api/profile/:profileId/playlists', (req, res) => {
  let profileId = req.params['profileId'];
  //  access_token = client_access_token.size > 0 ? client_access_token[0] : constant_access_token;
  var authOptions = {
    url: 'https://api.spotify.com/v1/users/' + profileId + '/playlists',
    headers: { Authorization: 'Bearer ' + access_token },
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

app.get('/api/playlist/:playlistId/details', (req, res) => {
  let playlistId = req.params['playlistId'];
  //  access_token = client_access_token.size > 0 ? client_access_token[0] : constant_access_token;
  var authOptions = {
    url: 'https://api.spotify.com/v1/playlists/' + playlistId,
    headers: { Authorization: 'Bearer ' + access_token },
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

app.get('/api/playlists/:query', (req, res) => {
  let query = req.params['query'];
  query.replace(' ', '%20');
  //  access_token = client_access_token.size > 0 ? client_access_token[0] : constant_access_token;
  var authOptions = {
    url: 'https://api.spotify.com/v1/search?q=' + query + '&type=playlist',
    headers: { Authorization: 'Bearer ' + access_token },
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

app.get('/user_profile', (req, res) => {
  try {
    access_token = client_access_token[0];
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
      console.log(body);
      res.json({
        body,
      });
    });
  } catch (e) {
    console.log('there was an error retrieving user profile information');
    console.log(e);
  }
});

app.get('user_top_tracks', (req, res) => {
  access_token = client_access_token[0];
});

app.get('');

/* GET home page. */
app.get('/', function (req, res) {
  res.json({ title: 'Express' });
});

app.listen(8080);

module.exports = app;
