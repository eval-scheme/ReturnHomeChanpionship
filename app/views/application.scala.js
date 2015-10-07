@(implicit request: RequestHeader)

function Logger(lv){
    this.showLevel = lv;
}
Logger.prototype.logging = function(mes){
    console.log(mes);
};
Logger.prototype.log = function (str, level){
    level = level || 0;
    if(level >= this.showLevel){
        var lvMes = "";
        switch (level){
        case 0:
            lvMes = "[Develop] -- ";
            break;
        case 1:
            lvMes = "[Notice] -- ";
            break;
        case 2:
            lvMes = "[Warning] -- ";
            break;
        case 3:
            lvMes = "[Error] -- ";
            break;
        case 4:
            lvMes = "[Fatal] -- ";
            break;
        default:
            lvMes = "[LogError] -- ";
        }
        this.logging(lvMes+str);
    }
};
var logger = new Logger(0);

function Application(tgtID, wsURL){
    var self = this;
    this.opp = "";
    this.wave = 0;
    this.myMap = [];
    this.doMap = [];
    this.waveDone = false; // needed?
    this.editDone = false;
    this.getDone = false;
    this.canvas = document.getElementByID(tgtID || "target");
    if(typeof(this.canvas.getContext) == "undefined"){
        logger.log("[Canvas] -- Cannot get Context.", 4);
    }
    this.ctx = this.canvas.getContext('2d');
    logger.log("[Application] -- It's canvas id: "+ (tgtID||"target"), 1);
    this.ws = {
        socket: undefined,
        init: function (){
            var url = wsURL || "@routes.Application.gameWS().WebSocketURL()";
            this.socket = new WebSocket(url);
            this.socket.onopen = function (){
                logger.log("[WebSocket] -- Open new connection with url: "+url, 1);
                this.send("Ready",null);
            };
            this.socket.onmessage = function (ev){
                var obj = JSON.parse(ev.data);
                logger("[WebSocket] -- Get a message. message: "+obj.toString, 0);
                switch (obj.type){
                case "MineMap":
                    self.canvas.setDoMap(obj.data.map);
                    break;
                case "Restart":
                    self.canvas.waiting();
                    break;
                case "Ready":
                    self.opp = obj.data.opp;
                    self.room = obj.data.rid;
                    self.game();
                    break;
                case "Result":
                    break;
                case "FinalResult":
                    break;
                default:
                    logger.log("[WebSocket] -- undefined type. type: "+obj.type, 3);
                }
            };
        },
        idGen: (function (){var id=-1; return function(){id+=2; return id;};})(),
        send: function (tp, data){
            var obj = {id: this.idGen(),type: tp,data: data};
            var json = JSON.stringify(obj);
            this.socket.send(json);
            logger.log("[WebSocket] -- Send a message. message: "+json, 0);
        }
    };
}

// Canvasへの描画等々もこっちの関数群で行う。
// Canvasを持つことはこのアプリケーションの標準で、
// 出力先のIDのみ変更可なわけだからこっちの関数でやってもいいはず。

// 背景の描画
Application.prototype.drawBack = function (){
    this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#efef06'; // Background color
    this.ctx.fillRect(0,0,this.canvas.width, this.canvas.height);
};
Application.prototype.edit = function (){
    this.wave++;
    this.myMap = [];
    this.drawBack();
    this.drawMap();
    var remain;
    remain = this.wave;
    var ctx = this.ctx;
    var drawRemain = function (){
        ctx.font = 'bold 20px serif';
        ctx.lineWidth = 2;
        ctx.fillStyle = '#000';
        ctx.fillText('あと '+remain+'個', 400, 20);
    };
    drawRemain();
};
Application.prototype.do = function (){
};
Application.prototype.game = function (){
    if(typeof(this.pre) != "undefined"){this.pre();}
    this.edit();
};
Application.prototype.reset = function (){
    this.waveDone = false;
    this.editDone = false;
    this.getDone = false;
    this.myMap = [];
    this.doMap = [];
    this.opp = "";
    this.room = "";
    logger.log("[Application] -- Reset game.", 2);
    this.ws.send("Restart", null);
    this.waiting();
};
Application.prototype.waiting = function (){
    this.canvas.waiting();
    logger.log("[Application] -- Waiting for Ready message from server", 1);
};
Application.prototype.setDoMap = function (map){
    this.doMap = map;
    if(this.editDone == true){
        this.do();
    }else{
        this.getDone = true;
    }
    logger.log("[Application] -- Set enemy map.");
};
