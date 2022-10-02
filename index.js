

const getJson = (src, timeout = 5000) => {
    return new Promise((resolve, reject) => {
        const x = setTimeout(() => {
            reject('timeout!!!')
        }, timeout);
        var requestOptions = {
            method: 'GET',
            redirect: 'follow'
        };
        fetch(src, requestOptions)
            .then(response => response.text())
            .then(result => {
                clearTimeout(x)
                resolve(JSON.parse(result));
            })
            .catch(error => reject(error));

    })
}
const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}
const showInfo = (text) => {
    let infoEl = document.querySelector('#infoEl');
    if (!infoEl) {
        const body = document.body;
        infoEl = document.createElement("div");
        infoEl.id = 'infoEl'
        infoEl.style = "position: fixed;left: 0;top: 0;width: 100vw;height: 100vh;background-color: #121212e0;display: flex;justify-content: center;align-items: center;z-index: 10;color: white;font-size: 30px;"
        body.appendChild(infoEl);
    }
    infoEl.innerText = text;

}
const removeInfo = () => {
    let infoEl = document.querySelector('#infoEl');
    if (infoEl) infoEl.remove();
}

class YoutubeInstances {
    videoIds = [];
    serverArray = [];
    constructor(serverArray = []) {
        this.serverArray = serverArray;
    }
    static getServer() {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('get server');
                let apiServerArray = await getJson("https://api.invidious.io/instances.json?pretty=1")
                apiServerArray = apiServerArray.filter((item) => (
                    item[1]['cors']
                    && item[1]['cors']
                    && item[1]['type'] === 'https'
                    && (item[1]['monitor'] && item[1]['monitor']['statusClass'] === 'success')
                )).map((item) => item[1]['uri']);
                resolve(apiServerArray)
            } catch (error) {
                reject(error)
            }
        })



    }
    getRandItemFromArray(array) {
        var rand = Math.random() * array.length | 0;
        var rValue = array[rand];
        return rValue;
    }

    getYoutubeId(query) {
        return new Promise(async (resolve, reject) => {
            try {
                const apiUrl = `${this.getRandItemFromArray(this.serverArray)}/api/v1/search/?q=${encodeURI(query)}&page=1&date=none&type=music&duration=none&sort=relevance`
                const searchedArray = await getJson(apiUrl)
                if (searchedArray && searchedArray.length > 0 && searchedArray[0].videoId) {
                    const _id = searchedArray[0].videoId;
                    // if (this.videoIds.indexOf(_id) == -1) {
                    //     this.videoIds.push(_id)
                    // }
                    // console.log('getYoutubeId', _id);
                    resolve(_id)
                }
            } catch (error) {
                reject(error)
            }

        })


    }

    tryGetYoutubeId(query, times = 10) {
        return new Promise(async (resolve, reject) => {
            for (let index = 0; index < times; index++) {
                this.getYoutubeId(query).then((_id) => {
                    resolve(_id);
                }).catch((error) => {
                    // console.log('tryGetU2', error);
                })
                await delay(500);
            }
            reject('')
        })


    }
    uniPushId(id) {
        if (this.videoIds.indexOf(id) == -1) {
            this.videoIds.push(id)
        }
    }
    getU2PlaylistUrl() {
        return `https://www.youtube.com/watch_videos?video_ids=${this.videoIds.toString()}`
    }


    allWithProgress(requests, callback) {
        let index = 0;
        requests.forEach(item => {
            item.then(() => {
                index++;
                const progress = index * 100 / requests.length;
                callback(progress);
            })
        });
        return Promise.allSettled(requests);
    }



    getSongFromInstances = (songNames) => {
        return new Promise(async (resolve, reject) => {
            this.allWithProgress(songNames.map((o) => (this.tryGetYoutubeId(o))), (progress) => {
                showInfo('轉換進度：' + progress + '%');
            }).then((ids) => {
                ids.forEach(element => {
                    if (element.status === 'fulfilled') {
                        this.uniPushId(element.value)
                    }
                })
                const target = this.getU2PlaylistUrl();
                resolve(target)
            })
            // Promise.allSettled(songNames.map((o) => (this.tryGetYoutubeId(o)))).then((ids) => {
            //     // console.log("🚀 ~ file: index.js ~ line 136 ~ Promise.allSettled ~ ids", ids)
            //     ids.forEach(element => {
            //         if (element.status === 'fulfilled') {
            //             this.uniPushId(element.value)
            //         }
            //     })
            //     const target = this.getU2PlaylistUrl();
            //     // console.log("🚀 ~ file: index.js ~ line 138 ~ getSpotify ~ target", target)
            //     resolve(target)
            // })
        })

    }



}
class Spotify {
    static songNameArray = [];
    static getSongs = async () => {
        return new Promise(async (resolve, reject) => {
            let counter = 0;
            if (document.querySelector('div[data-testid="tracklist-row"] div>div>button')) {
                const nameEls = [...document.querySelectorAll('div[data-testid="tracklist-row"] div>div>button')]
                for (let index = 0; index < nameEls.length; index++) {
                    const item = nameEls[index];
                    let name = item.getAttribute('aria-label');
                    if (name.indexOf('播放') > -1) {
                        name = name.replace('播放 ', '').replace(' 的 ', ' ');

                        if (this.songNameArray.indexOf(name) == -1) {
                            this.songNameArray.push(name);
                            counter += 1;
                        }
                        item.scrollIntoView();
                        await delay(10);

                    }
                }
            } else if (document.querySelector('div[type=track]')) {
                const nameEls = [...document.querySelectorAll('div[type=track]')]
                for (let index = 0; index < nameEls.length; index++) {
                    const item = nameEls[index];
                    let name = item.innerText;
                    if (name.indexOf('\n') > -1) {
                        name = name.replace('\n', ' ');

                        if (this.songNameArray.indexOf(name) == -1) {
                            this.songNameArray.push(name);
                            counter += 1;
                        }
                        item.scrollIntoView();
                        await delay(10);

                    }
                }
            }

            resolve(counter)
        })
    }
}
class Kkbox {
    static songNameArray = [];
    static getSongs = () => {
        return new Promise(async (resolve, reject) => {
            let counter = 0;
            const nameEls = [...document.querySelectorAll('a .layer1 span.charts-list-desc')]
            for (let index = 0; index < nameEls.length; index++) {
                const item = nameEls[index];
                let name = item.innerText;
                if (name.indexOf('\n') > -1) {
                    name = name.replace('\n', ' ');

                    if (this.songNameArray.indexOf(name) == -1) {
                        this.songNameArray.push(name);
                        counter += 1;
                    }
                    item.scrollIntoView();
                    await delay(10);

                }
            }

            resolve(counter)


        })

    }
}





const requestServerCall = (url) => {
    return new Promise((resolve, reject) => {
        const body = document.body;
        var element = document.createElement("img");
        element.src = url;
        element.onload = resolve;
        element.onerror = resolve;
        body.appendChild(element);
        body.removeChild(element)
    })

}


(async () => {
    let streamingMediaClass = null;
    if (window.location.href.indexOf('https://open.spotify.com/playlist/') > -1) {
        streamingMediaClass = Spotify
    } else if (window.location.href.indexOf('https://kma.kkbox.com/charts') > -1) {
        streamingMediaClass = Kkbox
    }
    while (await streamingMediaClass.getSongs() != 0 && streamingMediaClass.songNameArray.length < 50) {
        console.log(streamingMediaClass.songNameArray.length);
    };
    const songNames = streamingMediaClass.songNameArray.splice(0, 70);
    showInfo('準備轉換...');
    const serverArray = await YoutubeInstances.getServer();
    const u2Ins = new YoutubeInstances(serverArray);
    const target = await u2Ins.getSongFromInstances(songNames)
    await requestServerCall(target)
    await delay(500);
    removeInfo();
    window.location.href = target;
    await delay(1000);
    window.open(target)
})()
