"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const axios = require("axios");

const PAGE_SIZE = 20;

// Kuwo fallback for tracks if CDN proxy fails
async function kuwoFallback(title, artist) {
    try {
        const query = `${title || ""} ${artist || ""}`.trim();
        const searchUrl = `http://search.kuwo.cn/r.s?rformat=json&encoding=utf8&ft=music&rn=8&pn=0&all=${encodeURIComponent(query)}&itemset=web_2013&client=kt&pcjson=1`;
        const res = await axios.get(searchUrl, {
            headers: { "User-Agent": "okhttp/4.10.0" },
            timeout: 4000
        });
        const abslist = res.data?.abslist || [];
        for (const item of abslist) {
            const rawRid = item.MUSICRID || "";
            const rid = rawRid.split("_")[1]?.split("&")[0] || rawRid.split("_")[0];
            if (!rid) continue;
            const mobiUrl = `http://nmobi.kuwo.cn/mobi.s?f=web&user=0&type=convert_url_with_sign&rid=${rid}&br=128kmp3`;
            const mobiRes = await axios.get(mobiUrl, {
                headers: { "User-Agent": "okhttp/4.10.0" },
                timeout: 4000
            });
            const pUrl = mobiRes.data?.data?.url;
            if (pUrl && pUrl.startsWith("http")) {
                return pUrl;
            }
        }
    } catch (e) {}
    return null;
}

function formatMusicItem(item) {
    const songmid = item.songmid || item.mid || item.id;
    const albummid = item.albummid || item.album?.mid;
    return {
        id: songmid,
        songmid: songmid,
        title: item.songname || item.title || "",
        artist: Array.isArray(item.singer) ? item.singer.map(s => s.name).join(", ") : (item.artist || ""),
        album: item.albumname || item.album?.title || item.album?.name || "",
        artwork: albummid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${albummid}.jpg` : undefined,
        duration: item.interval || item.duration || 0,
        qualities: {
            low: { size: item.size128 },
            standard: { size: item.size320 },
            high: { size: item.sizeflac },
            super: { size: item.sizeflac }
        }
    };
}

function formatAlbumItem(item) {
    return {
        id: item.albumMID || item.albumID,
        title: item.albumName || "",
        artist: item.singerName || "",
        artwork: item.albumPic || (item.albumMID ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${item.albumMID}.jpg` : undefined),
        date: item.publicTime || "",
        description: item.desc || ""
    };
}

function formatArtistItem(item) {
    return {
        id: item.singerMID || item.singerID,
        name: item.singerName || "",
        avatar: item.singerPic || (item.singerMID ? `https://y.gtimg.cn/music/photo_new/T001R150x150M000${item.singerMID}.jpg` : undefined),
        worksNum: item.songNum || 0
    };
}

async function searchBase(query, page, typeCode) {
    try {
        const url = `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?p=${page || 1}&n=${PAGE_SIZE}&w=${encodeURIComponent(query)}&format=json&t=${typeCode}`;
        const res = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                Referer: "https://y.qq.com"
            },
            timeout: 6000
        });
        return res.data?.data || {};
    } catch (e) {
        return {};
    }
}

async function search(query, page, type) {
    if (type === "music") {
        const data = await searchBase(query, page, 0);
        const songData = data.song || {};
        const list = songData.list || [];
        const total = songData.totalnum || list.length;
        return {
            isEnd: (page * PAGE_SIZE) >= total,
            data: list.map(formatMusicItem)
        };
    } else if (type === "album") {
        const data = await searchBase(query, page, 8);
        const albumData = data.album || {};
        const list = albumData.list || [];
        const total = albumData.totalnum || list.length;
        return {
            isEnd: (page * PAGE_SIZE) >= total,
            data: list.map(formatAlbumItem)
        };
    } else if (type === "artist") {
        const data = await searchBase(query, page, 9);
        const singerData = data.singer || {};
        const list = singerData.list || [];
        const total = singerData.totalnum || list.length;
        return {
            isEnd: (page * PAGE_SIZE) >= total,
            data: list.map(formatArtistItem)
        };
    }
    return { isEnd: true, data: [] };
}

async function getMediaSource(musicItem, quality) {
    const songmid = musicItem.songmid || musicItem.id;
    // 1. Try high-speed official CDN proxy (xunhuisi)
    try {
        const apiUrl = `https://api.xunhuisi.store/API/QQMusic/Song.php?mid=${songmid}`;
        const res = await axios.get(apiUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
            timeout: 4500
        });
        if (res.data && res.data.code === 200 && res.data.music_url) {
            return {
                url: res.data.music_url,
                headers: {
                    Referer: "https://y.qq.com/",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            };
        }
    } catch (e) {}

    // 2. Kuwo fallback
    const fallbackUrl = await kuwoFallback(musicItem.title, musicItem.artist);
    if (fallbackUrl) {
        return { url: fallbackUrl };
    }

    return null;
}

async function getLyric(musicItem) {
    const songmid = musicItem.songmid || musicItem.id;
    try {
        const url = `https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=${songmid}&format=json&nobase64=1`;
        const res = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                Referer: "https://y.qq.com"
            },
            timeout: 4000
        });
        return {
            rawLrc: res.data?.lyric || "",
            translation: res.data?.trans || ""
        };
    } catch (e) {
        return { rawLrc: "" };
    }
}

// 排行榜列表
async function getTopLists() {
    try {
        const res = await axios.get("https://u.y.qq.com/cgi-bin/musicu.fcg?data=%7B%22comm%22%3A%7B%22cv%22%3A4747474%2C%22ct%22%3A24%7D%2C%22toplist%22%3A%7B%22module%22%3A%22musicToplist.ToplistInfoServer%22%2C%22method%22%3A%22GetAll%22%2C%22param%22%3A%7B%7D%7D%7D", {
            headers: { Referer: "https://y.qq.com" }
        });
        const groups = res.data?.toplist?.data?.group || [];
        const result = [];
        const defaultNames = ["官方榜", "地区榜", "特色榜", "全球榜"];
        for (let i = 0; i < groups.length; i++) {
            const g = groups[i];
            const title = g.group_name || defaultNames[i] || "排行榜";
            const data = (g.toplist || []).map(item => ({
                id: item.topId,
                title: item.title,
                description: item.intro,
                coverImg: item.frontPicUrl || item.headPicUrl,
                period: item.period
            }));
            if (data.length) {
                result.push({ title, data });
            }
        }
        return result;
    } catch (e) {
        return [];
    }
}

// 排行榜详情歌曲
async function getTopListDetail(topListItem) {
    try {
        const res = await axios.get(`https://u.y.qq.com/cgi-bin/musicu.fcg?g_tk=5381&data=%7B%22detail%22%3A%7B%22module%22%3A%22musicToplist.ToplistInfoServer%22%2C%22method%22%3A%22GetDetail%22%2C%22param%22%3A%7B%22topId%22%3A${topListItem.id}%2C%22offset%22%3A0%2C%22num%22%3A100%2C%22period%22%3A%22${topListItem.period || ""}%22%7D%7D%2C%22comm%22%3A%7B%22ct%22%3A24%2C%22cv%22%3A0%7D%7D`, {
            headers: { Referer: "https://y.qq.com" }
        });
        const songInfoList = res.data?.detail?.data?.songInfoList || [];
        return {
            ...topListItem,
            musicList: songInfoList.map(item => ({
                id: item.mid || item.id,
                songmid: item.mid,
                title: item.title || item.name,
                artist: (item.singer || []).map(s => s.name).join(", "),
                album: item.album?.title || item.album?.name || "",
                artwork: item.album?.mid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${item.album.mid}.jpg` : undefined,
                duration: item.interval || 0
            }))
        };
    } catch (e) {
        return { ...topListItem, musicList: [] };
    }
}

// 热门歌单标签分类
async function getRecommendSheetTags() {
    try {
        const res = (await axios.get("https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_tag_conf.fcg?format=json&inCharset=utf8&outCharset=utf-8", {
            headers: { Referer: "https://y.qq.com/" }
        })).data.data.categories;
        const data = res.slice(1).map((_) => ({
            title: _.categoryGroupName,
            data: _.items.map((tag) => ({
                id: String(tag.categoryId),
                title: tag.categoryName,
            })),
        }));
        return {
            pinned: [
                { id: "10000000", title: "全部" },
                { id: "3317", title: "官方歌单" },
                { id: "71", title: "流行" }
            ],
            data
        };
    } catch (e) {
        return { pinned: [{ id: "10000000", title: "全部" }], data: [] };
    }
}

// 按标签获取热门歌单
async function getRecommendSheetsByTag(tag, page = 1) {
    try {
        const pageSize = 20;
        const categoryId = tag?.id || "10000000";
        const sin = (page - 1) * pageSize;
        const ein = page * pageSize - 1;
        const res = (await axios.get("https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_by_tag.fcg", {
            headers: { Referer: "https://y.qq.com/" },
            params: {
                inCharset: "utf8",
                outCharset: "utf-8",
                sortId: 5,
                categoryId: categoryId,
                sin: sin,
                ein: ein,
                format: "json"
            }
        })).data;
        const list = res?.data?.list || [];
        return {
            isEnd: (res?.data?.sum || 0) <= page * pageSize,
            data: list.map(item => ({
                id: String(item.dissid),
                title: item.dissname,
                artwork: item.imgurl,
                playCount: item.listennum,
                artist: item.creator?.name
            }))
        };
    } catch (e) {
        return { isEnd: true, data: [] };
    }
}

// 歌单详情解析
async function importMusicSheet(urlLike) {
    let id;
    if (typeof urlLike === "string" || typeof urlLike === "number") {
        const str = String(urlLike);
        id = (str.match(/id=([0-9]+)/) || [])[1] || (str.match(/playlist\/([0-9]+)/) || [])[1] || (str.match(/^(\d+)$/) || [])[1];
    } else if (urlLike?.id) {
        id = urlLike.id;
    }
    if (!id) return [];
    try {
        const res = await axios.get(`https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg?type=1&json=1&utf8=1&onlysong=0&disstid=${id}&format=json`, {
            headers: { Referer: "https://y.qq.com/" }
        });
        const songlist = res.data?.cdlist?.[0]?.songlist || [];
        return songlist.map(formatMusicItem);
    } catch (e) {
        return [];
    }
}

async function getMusicSheetInfo(sheet, page = 1) {
    const list = await importMusicSheet(sheet.id || sheet);
    return {
        isEnd: true,
        musicList: list
    };
}

module.exports = {
    platform: "QQ音乐",
    version: "1.1.0",
    primaryKey: ["id", "songmid"],
    cacheControl: "no-cache",
    hints: {
        importMusicSheet: [
            "QQ音乐APP：自建歌单-分享-分享到微信好友/QQ好友；然后点开并复制链接，直接粘贴即可"
        ]
    },
    supportedSearchType: ["music", "album", "artist"],
    search,
    getMediaSource,
    getLyric,
    getTopLists,
    getTopListDetail,
    getRecommendSheetTags,
    getRecommendSheetsByTag,
    importMusicSheet,
    getMusicSheetInfo
};
