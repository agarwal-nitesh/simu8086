var fs=require('fs');
var body=fs.readFileSync('../client/8086.html');

function start(response,postdata){
  console.log("Request Handler start was called");
    response.writeHead(200,{"Content-Type":"text/html"});
    response.write(body);
    response.end();
}

function see(response,postdata){
  console.log("Request Handler see was called");
  response.writeHead(200,{"Content-Type":"text/plain"});
  response.write(postdata);
  response.end();
}


function stylie(res){
  
  console.log("Request Handler stylie was called");
  fs.readFile('../client/static/css/style.css',function(err,data){
    res.writeHead(200,{"Content-Type":"text/css"});
    res.write(data);
    res.end();
  });
}

function jscript(res){
  console.log("Request Handler jscript was called");
  fs.readFile('../client/static/js/script.js',function(err,data){
    res.writeHead(200,{"Content-Type":"application/ecmascript"});
    res.write(data);
    res.end();
  });
}

function jsons(res){
  console.log("Requst Handler jsons was called");
  fs.readFile('../client/static/js/kodek.json',function(err,data){
   res.writeHead(200,{"Content-Type":"application/json"});
   res.write(data);
   res.end();
  });
}
exports.start=start;
exports.see=see;
exports.jscript=jscript;
exports.stylie=stylie;
exports.jsons=jsons;
