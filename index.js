var express = require('express');
var app = express();

app.all('*', function(req, res, next) {
       res.header("Access-Control-Allow-Origin", "*");
       res.header("Access-Control-Allow-Headers", "X-Requested-With");
       res.header('Access-Control-Allow-Headers', 'Content-Type');
       next();
});
app.use(express.static(__dirname + '/client'));


var port = process.env.PORT || 8000;

app.listen(port, function(){
  console.log('Server started');
  console.log('Listening on port ', port)
});
