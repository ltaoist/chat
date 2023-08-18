var chat = {
    mainfold: { name: "系统" }
};

var WORDLIST = [];

var SLIST = [];

var mem = {};

function interp(s){
    s = s.replace(/{\s*([^}]+)\s*}/g, function(match, p){
        return chat.mainfold[p.trim()];
    });
    return s;
}

function a1_send(content){
    content = content.replace(/\[hide\].*\[\/hide\]/g, '').trim()
                .replace(/\[\[/, '<span class="hint">')
                .replace(/\]\]/, '</span>')
                .replace(/\n+/g, '<br><br>');
    var html = '<img src="' + chat.mainfold.a1Avatar + '"><div class="name">' + chat.mainfold.name + '</div><div class="word">' + content + '</div>';
    var dom = document.createElement('div');
    dom.className = "a1";
    dom.innerHTML = html;
    document.querySelector(".stream .container").append(dom);
    document.querySelector(".stream .container").scrollTo(0, 999999999999)
}

function a2_send(content){
    content = content.replace(/</g, '&lt;').replace(/>/g, '&gt').replace(/\n/g, '<br>');
    var html = '<img src="' + chat.mainfold.a2Avatar + '"><div class="word">' + content + '</div>';
    var dom = document.createElement('div');
    dom.className = "a2";
    dom.innerHTML = html;
    document.querySelector(".stream .container").append(dom);
    document.querySelector(".stream .container").scrollTo(0, 999999999999)
}

function auto_reply(s){
    if(mem[s]){
        a1_send("你怎么问了又问。");
        return;
    }
    mem[s] = 1;
    for(var i=0; i<WORDLIST.length; ++i){
        if(WORDLIST[i].indexOf(s)>=0){
            mem[i] = 1;
            a1_send(WORDLIST[i]);
            return;
        }
    }
    a1_send("啊哦，你说的我也不理解~ 可能是知识库还没有呢~");
}

function init_slist(){
    var slist_dom = document.querySelector('.slist');
    var s = SLIST;
    for(var i=0; i<s.length; ++i){
        var dom = document.createElement('span');
        dom.innerText = s[i].trim();
        slist_dom.appendChild(dom);
    }
}

function load(url, callback){
    var xhr = new XMLHttpRequest()
    xhr.open('GET', url, true);
    //xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8')
    xhr.onreadystatechange = function() {
        var data = xhr.responseText;
        callback(data, xhr, xhr.status);
    };
    xhr.send();
};

function parseArgs(){
    var xs = location.search.slice(1).split('&&');
    for(var i=0; i<xs.length; ++i){
        var p = xs[i].indexOf('=');
        if(p >= 0){
            var k = xs[i].slice(0, p);
            var v = xs[i].slice(p+1);
            if(k == 'base'){
                return v;
            }
        }
    }
}

function MainInit(){
    console.log('MainInit');
    var base = parseArgs();
    load(base, function(data, xhr, status){
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            try{
                var mainfold = JSON.parse(data);
                chat.mainfold = mainfold;
            } catch(e){
                console.error('MainInit ERROR');
                InitError();
                return;
            }
            MainInit2(mainfold, base);
        } else if(xhr.readyState === XMLHttpRequest.DONE && xhr.status == 404){
            console.error('MainInit 404');
            InitError();
        }
    });
}

function MainInit2(mainfold, base){
    console.log('MainInit2');
    var sabl = base.replace('.json', '.sabl');
    load(sabl, function(data, xhr, status){
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            try{
                data = createWordlist(mainfold, '\n'+data+'\n');
            } catch(e){
                console.error(e);
                InitError();
                return;
            }
            MainInit3(mainfold, base, data);
        } else if(xhr.readyState === XMLHttpRequest.DONE && xhr.status == 404){
            console.error('MainInit2 404');
            InitError();
        }
    });
};

function MainInit3(mainfold, base, wordlist){
    console.log('MainInit3');
    var sabl = base.replace('.json', '.sabh');
    load(sabl, function(data, xhr, status){
        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            try{
                data = createHintlist(data);
            } catch (e){
                console.error(e);
                InitError();
                return;
            }
            MainInit4(mainfold, base, wordlist, data);
        } else if(xhr.readyState === XMLHttpRequest.DONE && xhr.status == 404){
            console.error('MainInit3 404');
            InitError();
        }
    });
};

function createWordlist(mainfold, data){
    var buffer = [];
    var i = 0;
    while(1){
        var p1 = data.indexOf('\n{\n', i);
        if(p1 < 0){
            break;
        }
        var p2 = data.indexOf('\n}\n', p1);
        if(p2 < 0){
            break;
        }
        buffer.push(data.slice(p1+2, p2).trim());
        i = p2+1;
    }
    return buffer;
};

function createHintlist(data){
    var buffer = data.replace(/\n/g, ' ').split(' ');
    var xbuffer = []
    for(var i=0; i<buffer.length; ++i){
        var p = buffer[i].trim();
        if(p.length){
            xbuffer.push(p);
        }
    }
    return xbuffer;
};

function MainInit4(mainfold, base, wordlist, slist){
    console.log('MainInit4');
    WORDLIST = wordlist;
    SLIST = slist;
    document.title = "和" + mainfold.name + "聊天吧~";
    a1_send(interp(mainfold.hello));
    init_slist();
    document.querySelector('.slist').addEventListener('click', function(e){
        var content = e.target.innerText;
        if(e.target.tagName == 'SPAN'){
            a2_send(content);
            auto_reply(content);
        }
    });
    document.querySelector('.stream').addEventListener('click', function(e){
        if((e.target.tagName == 'SPAN')&&(e.target.className == 'hint')){
            var content = e.target.innerText;
            a2_send(content);
            auto_reply(content);
        }
    });
};

function InitError(){
    a1_send("啊哦~出错了~");
};

function send(){
    var content = document.getElementById('word').value;
    if(content.length == 0){
        return;
    }
    document.getElementById('word').value = '';
    a2_send(content);
    auto_reply(content);
}

MainInit();

