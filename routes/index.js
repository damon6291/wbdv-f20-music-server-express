var express = require('express');
var request = require('request');
var router = express.Router();
var body_parser = require('body-parser');
var cors = require('cors');

var app = express();

app.use(cors());
app.use(body_parser.json());

client_id = '64a311df55f24059a326323c754eedfd';
client_Secret = '71ed2c4226d746488ca2afd497128671';
client_auth_code = [];
client_access_token = [];
client_refresh_token = [];
constant_access_token =
  'BQCSTtFbENz0sLDQW2VJbtns02QPLIcnnG-perIleJGSa_r8M5AXOrS0O7PewyyG3K-Ad46RIpnvLCkJf_shsT89baXzqZK5BDnk0D-8pFf50M8YTXAtjH8-KzQCHaGiFDKtTS7f33nDuoxqR7-oQ5_CqeVRlcMycbrvyixXo67X0Nj9iwNxo_WXB7S2TmSnMJwHy_bc-PTiUQ7-sGBzmIGYo-oXE5JL7HTLU4HLj30cKcxLjNn_-6uk9jYVdfoSHUezOmAjGmIHozRFkjZGzSDd';
constant_refresh_token =
  'AQCKvYSAjSY4q9_86018kjOuzA46cy2i8_Tz6WAO-V72pXtxr2RJcupWNxPUodU8k-QifMC6LzxOdG_hMEAwj9FrGSLCvSeWY3MqyNt7vfT4RpwJV51yo7ZCX_3J_CRLsW4';

app.get('/spotifyLogin', (req, res) => {
  url = 'https://accounts.spotify.com/authorize';
  redirect_url = 'http://localhost:8080/post_authentication';
  scope =
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
      redirect_url +
      '&scope=' +
      scope
  );
});

app.get('/post_authentication', (req, res) => {
  try {
    code = req.query.code;
    console.log(code);
    client_auth_code = [];
    client_auth_code.push(code);

    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: 'http://localhost:8080/post_authentication',
        grant_type: 'authorization_code',
      },
      headers: {
        Authorization: 'Basic ' + new Buffer(client_id + ':' + client_Secret).toString('base64'),
      },
      json: true,
    };

    request.post(authOptions, (error, response, body) => {
      console.log(body);
      client_access_token = [];
      client_refresh_token = [];
      client_access_token.push(body.access_token);
      client_refresh_token.push(body.refresh_token);
      res.json({
        body,
      });
    });
  } catch (e) {
    console.log('there has been an error with authentication');
    console.log(e);
  }
});

app.post('/getPlayListInformation', (req,res) => {
    try {
        playlistId = req.body.playlistId
        if (client_access_token.size > 0) {
            console.log(client_access_token[0]);
            access_token = client_access_token[0];
            var authOptions = {
                url: 'https://api.spotify.com/v1/playlists/' + playlistId,
                headers: { Authorization: 'Bearer ' + access_token },
            };
            request.get(authOptions, (error, response, body) => {
                console.log(response.body);
                res.json({
                    results: response.body,
                });
            });
         } else {
            console.log(constant_access_token);
            access_token = constant_access_token;
            console.log(access_token);
            var authOptions = {
                url: 'https://api.spotify.com/v1/playlists/' + playlistId,
                headers: { Authorization: 'Bearer ' + access_token },
            };
            request.get(authOptions, (error, response, body) => {
                console.log(response.body);
                res.json({
                    results: response.body,
                });
            });
        }
    }
    catch(e) {
        console.log("There was an error getting PlaylistInformation: " + e);
    }
})

app.post('/searchForPlaylists', (req, res) => {
  try {
    searchParams = req.body.searchParams;
    searchParams.replace(' ', '%20');
    console.log('Client access token');
    if (client_access_token.size > 0) {
      console.log(client_access_token[0]);
      access_token = client_access_token[0];
      var authOptions = {
        url: 'https://api.spotify.com/v1/search?q=' + searchParams + '&type=playlist',
        headers: { Authorization: 'Bearer ' + access_token },
      };
      request.get(authOptions, (error, response, body) => {
        console.log(response.body);
        res.json({
          results: response.body,
        });
      });
    } else {
      console.log(constant_access_token);
      access_token = constant_access_token;
      console.log(access_token);
      var authOptions = {
        url: 'https://api.spotify.com/v1/search?q=' + searchParams + '&type=playlist',
        headers: { Authorization: 'Bearer ' + access_token },
      };
      request.get(authOptions, (error, response, body) => {
        console.log(response.body);
        res.json({
          results: response.body,
        });
      });
    }
  } catch (e) {
    console.log('there is an error searching');
    console.log(e);
  }
});

function refresh_access_spotify() {
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      refresh_token: constant_refresh_token,
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
