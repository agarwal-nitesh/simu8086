var server=require("./server");
var router=require("./router");
var requesthandler=require("./requesthandler");

var handle={};
handle["/"]=requesthandler.start;
handle["/see"]=requesthandler.see;
handle["/style.css"]=requesthandler.stylie;
handle["/script.js"]=requesthandler.jscript;
handle["/funson600.json"]=requesthandler.jsons;

server.start(router.route,handle);
