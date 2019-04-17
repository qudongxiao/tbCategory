var http = require('http');
var https = require('https');
var path= require('path');
var fs = require('fs');
var url = require('url');

var server= http.createServer();

function getTbCid(goodsUrl ,callback){
	 var reader = /^https/.test(goodsUrl) ? https :http
	 reader.get(goodsUrl, function(res) {
			var data = "";
			res.on('data', function (chunk) {
				data += chunk;
			});
			res.on("end", function() {
				callback(data);
			});
	  })
	  .on("error", function(e) {
			callback(null);
	  });
}

function getTbCat(cid,res){
	var jsonData= JSON.parse(fs.readFileSync(path.join(__dirname, 'db/db.json')));
	for(let i=0;i<jsonData.length;i++){
		if(jsonData[i].id === cid) {
			 console.log("找到对应类目")
			 res.writeHead(200, {'Content-Type': 'application/json'});
			 res.end( JSON.stringify({ret:true, msg:"ok",data: jsonData[i].path }) )
			 return false;
		}
	}
	 res.writeHead(200, {'Content-Type': 'application/json'});
	 res.end( JSON.stringify({ret:false, msg:"Failed to get the category",data:[] }) )
}

server.on("request", function(req,res){
		var pathname = url.parse(req.url).pathname
		if (pathname === '/api/catgory' && req.method === 'POST'){
			var body="";
			req.on("data",function(chunk){
				body+= chunk
			});

			req.on("end",function(){
				body = JSON.parse(body);
				if( body.goodsUrl ){
					console.log("call:"+body.goodsUrl)
					getTbCid(body.goodsUrl,function(resp){
						if(!resp){
							 console.log("目标链接无响应")
							 res.writeHead(200, {'Content-Type': 'application/json'});
							 res.end(JSON.stringify({ret:false, msg:'The target url cannot be resolved',data:[]}));
						}else{
							console.log("目标链接响应")
							let cid= -1;
							resp= resp.replace(/\s/g,"")
							resp= resp.replace(/<\/?.+?>/g,"")
							cid=  resp.match(/\,cid:\'(\d+)\'/)
							if(cid){
								console.log("找到cid:"+cid[1])
								getTbCat(Number( cid[1] ),res)
							}else{
								console.log("未找到cid")
								res.writeHead(200, {'Content-Type': 'application/json'});
								res.end(JSON.stringify({ret:false, msg:'Cid was not found',data:[]}));
							}
						}
					})
				}
			})
		}else{
			if(/^\/static\/js/.test( pathname )){
				fs.readFile(path.join(__dirname,pathname),function(err,data){
					if (!err) {  
						res.writeHead(200, {"Content-Type": "application/x-javascript"});
						res.end(data);
					}
				})
			}

			if(/^\/static\/css/.test( pathname )){
				fs.readFile(path.join(__dirname,pathname),function(err,data){
					if (!err) {  
						res.writeHead(200, {"Content-Type": "text/css"});
						res.end(data);
					}
				})
			}

			if(/^\/index/.test( pathname )){
				fs.readFile(path.join(__dirname, "client.html"), function(err,data){
					if (!err) {
						res.writeHead(200,{'Content-Type':'text/html;charset=utf8'})
						res.end(data);
					}
				})
			}
		}
})

server.listen(8080, function(){
	console.log('The server is running at 8080');
});

