const getJson=(e,t=5e3)=>new Promise((r,a)=>{var n;let s=setTimeout(()=>{a("timeout!!!")},t);fetch(e,{method:"GET",redirect:"follow"}).then(e=>e.text()).then(e=>{clearTimeout(s),r(JSON.parse(e))}).catch(e=>a(e))}),delay=e=>new Promise(t=>setTimeout(t,e)),showInfo=e=>{let t=document.querySelector("#infoEl");if(!t){let r=document.body;(t=document.createElement("div")).id="infoEl",t.style="position: fixed;left: 0;top: 0;width: 100vw;height: 100vh;background-color: #121212e0;display: flex;justify-content: center;align-items: center;z-index: 10;color: white;font-size: 30px;",r.appendChild(t)}t.innerText=e},removeInfo=()=>{let e=document.querySelector("#infoEl");e&&e.remove()};class YoutubeInstances{videoIds=[];serverArray=[];constructor(e=[]){this.serverArray=e}static getServer(){return new Promise(async(e,t)=>{try{console.log("get server");let r=await getJson("https://api.invidious.io/instances.json?pretty=1");r=r.filter(e=>e[1].cors&&e[1].cors&&"https"===e[1].type&&e[1].monitor&&"success"===e[1].monitor.statusClass).map(e=>e[1].uri),e(r)}catch(a){t(a)}})}getRandItemFromArray(e){return e[Math.random()*e.length|0]}getYoutubeId(e){return new Promise(async(t,r)=>{try{let a=`${this.getRandItemFromArray(this.serverArray)}/api/v1/search/?q=${encodeURI(e+" official")}&page=1&date=none&type=music&duration=none&sort=relevance`,n=await getJson(a);if(n&&n.length>0&&n[0].videoId){let s=n[0].videoId;t(s)}}catch(o){r(o)}})}tryGetYoutubeId(e,t=10){return new Promise(async(r,a)=>{for(let n=0;n<t;n++)this.getYoutubeId(e).then(e=>{r(e)}).catch(e=>{}),await delay(500);a("")})}uniPushId(e){-1==this.videoIds.indexOf(e)&&this.videoIds.push(e)}getU2PlaylistUrl(){return`https://www.youtube.com/watch_videos?video_ids=${this.videoIds.toString()}`}allWithProgress(e,t){let r=0;return e.forEach(a=>{a.then(()=>{r++;let a=100*r/e.length;t(a)})}),Promise.allSettled(e)}getSongFromInstances=e=>new Promise(async(t,r)=>{this.allWithProgress(e.map(e=>this.tryGetYoutubeId(e)),e=>{showInfo("轉換進度："+e+"%")}).then(e=>{e.forEach(e=>{"fulfilled"===e.status&&this.uniPushId(e.value)});let r=this.getU2PlaylistUrl();t(r)})})}class Spotify{static songNameArray=[];static getSongs=async()=>new Promise(async(e,t)=>{let r=0;if(document.querySelector('div[data-testid="tracklist-row"] div>div>button')){let a=[...document.querySelectorAll('div[data-testid="tracklist-row"] div>div>button')];for(let n=0;n<a.length;n++){let s=a[n],o=s.getAttribute("aria-label");o.indexOf("播放")>-1&&(o=o.replace("播放 ","").replace(" 的 "," "),-1==this.songNameArray.indexOf(o)&&(this.songNameArray.push(o),r+=1),s.scrollIntoView(),await delay(10))}}else if(document.querySelector("div[type=track]")){let i=[...document.querySelectorAll("div[type=track]")];for(let l=0;l<i.length;l++){let c=i[l],d=c.innerText;d.indexOf("\n")>-1&&(d=d.replace("\n"," "),-1==this.songNameArray.indexOf(d)&&(this.songNameArray.push(d),r+=1),c.scrollIntoView(),await delay(10))}}e(r)})}class Kkbox{static songNameArray=[];static getSongs=()=>new Promise(async(e,t)=>{let r=0,a=[...document.querySelectorAll("a .layer1 span.charts-list-desc")];for(let n=0;n<a.length;n++){let s=a[n],o=s.innerText;o.indexOf("\n")>-1&&(o=o.replace("\n"," "),-1==this.songNameArray.indexOf(o)&&(this.songNameArray.push(o),r+=1),s.scrollIntoView(),await delay(10))}e(r)})}const requestServerCall=e=>new Promise((t,r)=>{let a=document.body;var n=document.createElement("img");n.src=e,n.onload=t,n.onerror=t,a.appendChild(n),a.removeChild(n)});(async()=>{let e=null;for(window.location.href.indexOf("https://open.spotify.com/playlist/")>-1?e=Spotify:window.location.href.indexOf("https://kma.kkbox.com/charts")>-1&&(e=Kkbox);await e.getSongs()!=0&&e.songNameArray.length<50;)console.log(e.songNameArray.length);let t=e.songNameArray.splice(0,70);showInfo("準備轉換...");let r=await YoutubeInstances.getServer(),a=new YoutubeInstances(r),n=await a.getSongFromInstances(t);await requestServerCall(n),await delay(500),removeInfo(),window.location.href=n,await delay(1e3),window.open(n)})();