function route(handle,pathname,response,data){
  console.log("routing a request for "+pathname);
  if(typeof handle[pathname]==='function'){
    handle[pathname](response,data);}
   else{
     console.log("No request handler found for"+ pathname);
     response.writeHead(404,{"Content-Type":"text/plain"});
     response.end( "404 Not Found");}
}
     
exports.route =route;

