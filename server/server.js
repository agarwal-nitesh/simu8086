var http=require('http');
var url=require('url');

function start(route,handle){
  function onRequest(request,response){
    var data="";
    var pathname=url.parse(request.url).pathname; 
    console.log("Request for "+pathname+" recieved.");
    request.on("data",function(datachunk){
      data+=datachunk;
      console.log("Recieved Post data chunk");});

    request.on("end",function(){
      route(handle,pathname,response,data);
      }); 
    }
  http.createServer(onRequest).listen(8000);
  console.log("Server has Started");
  }
    
exports.start =start;

