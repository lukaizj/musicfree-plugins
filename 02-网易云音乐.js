"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const axios = require("axios");
const qs = require("qs");

const PAGE_SIZE = 20;

// Kuwo fallback for grey/VIP tracks
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
    const album = item.album || item.al || {};
    const artists = item.artists || item.ar || [];
    const artwork = album.picUrl || (album.picId ? `https://p1.music.126.net/${album.picId}/${album.picId}.jpg` : (artists[0]?.img1v1Url || undefined));
    return {
        id: item.id,
        title: item.name || "",
        artist: artists.map(a => a.name).join(", "),
        album: album.name || "",
        artwork: artwork,
        duration: Math.round((item.duration || 0) / 1000),
        qualities: {
            low: { size: item.l?.size },
            standard: { size: item.m?.size },
            high: { size: item.h?.size },
            super: { size: item.sq?.size }
        }
    };
}

function formatAlbumItem(item) {
    const artist = item.artist || (item.artists && item.artists[0]) || {};
    return {
        id: item.id,
        title: item.name || "",
        artist: artist.name || "",
        artwork: item.picUrl || undefined,
        date: item.publishTime ? new Date(item.publishTime).toLocaleDateString() : "",
        description: item.description || ""
    };
}

function formatArtistItem(item) {
    return {
        id: item.id,
        name: item.name || "",
        avatar: item.picUrl || item.img1v1Url || undefined,
        worksNum: item.musicSize || 0
    };
}

async function search(query, page, type) {
    let nType = 1;
    if (type === "album") nType = 10;
    else if (type === "artist") nType = 100;
    else if (type !== "music") return { isEnd: true, data: [] };

    try {
        const url = "https://music.163.com/api/search/get/web";
        const postData = qs.stringify({
            s: query,
            type: nType,
            offset: ((page || 1) - 1) * PAGE_SIZE,
            limit: PAGE_SIZE,
            total: true
        });
        const res = await axios.post(url, postData, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                Referer: "https://music.163.com",
                Cookie: "os=pc;",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            timeout: 6000
        });
        const result = res.data?.result || {};
        if (type === "music") {
            const songs = result.songs || [];
            const count = result.songCount || songs.length;
            return {
                isEnd: (page * PAGE_SIZE) >= count,
                data: songs.map(formatMusicItem)
            };
        } else if (type === "album") {
            const albums = result.albums || [];
            const count = result.albumCount || albums.length;
            return {
                isEnd: (page * PAGE_SIZE) >= count,
                data: albums.map(formatAlbumItem)
            };
        } else if (type === "artist") {
            const artists = result.artists || [];
            const count = result.artistCount || artists.length;
            return {
                isEnd: (page * PAGE_SIZE) >= count,
                data: artists.map(formatArtistItem)
            };
        }
    } catch (err) {
        return { isEnd: true, data: [] };
    }
    return { isEnd: true, data: [] };
}

async function getMediaSource(musicItem, quality) {
    // 1. Try oiapi
    try {
        const oiUrl = `http://oiapi.net/API/Music_163?id=${musicItem.id}`;
        const res = await axios.get(oiUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
            timeout: 4500
        });
        const url = res.data?.data?.[0]?.url;
        if (url && url.startsWith("http")) {
            return { url };
        }
    } catch (e) {}

    // 2. Try official outer url (free songs)
    try {
        const outerUrl = `https://music.163.com/song/media/outer/url?id=${musicItem.id}.mp3`;
        const testRes = await axios.head(outerUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
            maxRedirects: 3,
            timeout: 3000
        });
        if (testRes.status === 200) {
            return { url: outerUrl };
        }
    } catch (e) {}

    // 3. Fallback to Kuwo
    const fallbackUrl = await kuwoFallback(musicItem.title, musicItem.artist);
    if (fallbackUrl) {
        return { url: fallbackUrl };
    }

    return null;
}

async function getLyric(musicItem) {
    try {
        const url = `https://music.163.com/api/song/lyric?id=${musicItem.id}&lv=1&tv=1`;
        const res = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                Referer: "https://music.163.com"
            },
            timeout: 4000
        });
        return {
            rawLrc: res.data?.lrc?.lyric || "",
            translation: res.data?.tlyric?.lyric || ""
        };
    } catch (e) {
        return { rawLrc: "" };
    }
}

// 排行榜列表
async function getTopLists() {
    try {
        const res = await axios.get("https://music.163.com/api/toplist", {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        const list = res.data?.list || [];
        const official = list.slice(0, 4).map(item => ({
            id: item.id,
            title: item.name,
            description: item.description,
            coverImg: item.coverImgUrl,
            period: item.updateFrequency
        }));
        const others = list.slice(4).map(item => ({
            id: item.id,
            title: item.name,
            description: item.description,
            coverImg: item.coverImgUrl,
            period: item.updateFrequency
        }));
        const result = [];
        if (official.length) result.push({ title: "官方榜", data: official });
        if (others.length) result.push({ title: "特色榜单", data: others });
        return result;
    } catch (e) {
        return [];
    }
}

// 排行榜详情
async function getTopListDetail(topListItem) {
    try {
        const res = await axios.get(`https://music.163.com/api/playlist/detail?id=${topListItem.id}`, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        const tracks = res.data?.result?.tracks || [];
        return {
            ...topListItem,
            musicList: tracks.map(formatMusicItem)
        };
    } catch (e) {
        return { ...topListItem, musicList: [] };
    }
}

// 热门歌单标签分类
async function getRecommendSheetTags() {
    try {
        const res = await axios.get("https://music.163.com/api/playlist/catalogue", {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        const categories = res.data?.categories || {};
        const sub = res.data?.sub || [];
        const groups = {};
        for (const [key, name] of Object.entries(categories)) {
            groups[key] = { title: name, data: [] };
        }
        for (const item of sub) {
            if (groups[item.category]) {
                groups[item.category].data.push({
                    id: item.name,
                    title: item.name
                });
            }
        }
        return {
            pinned: [
                { id: "全部", title: "全部" },
                { id: "华语", title: "华语" },
                { id: "流行", title: "流行" },
                { id: "摇滚", title: "摇滚" },
                { id: "民谣", title: "民谣" }
            ],
            data: Object.values(groups)
        };
    } catch (e) {
        return { pinned: [{ id: "全部", title: "全部" }], data: [] };
    }
}

// 按标签获取热门歌单
async function getRecommendSheetsByTag(tag, page = 1) {
    try {
        const pageSize = 20;
        const cat = tag?.id || "全部";
        const offset = (page - 1) * pageSize;
        const res = await axios.get(`https://music.163.com/api/playlist/list?cat=${encodeURIComponent(cat)}&order=hot&offset=${offset}&limit=${pageSize}`, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        const playlists = res.data?.playlists || [];
        return {
            isEnd: (res.data?.total || 0) <= page * pageSize,
            data: playlists.map(item => ({
                id: item.id,
                title: item.name,
                artwork: item.coverImgUrl,
                playCount: item.playCount,
                artist: item.creator?.nickname
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
        const res = await axios.get(`https://music.163.com/api/playlist/detail?id=${id}`, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        const tracks = res.data?.result?.tracks || [];
        return tracks.map(formatMusicItem);
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
    platform: "网易云音乐",
    version: "1.1.0",
    primaryKey: ["id"],
    cacheControl: "no-cache",
    hints: {
        importMusicSheet: [
            "网易云音乐APP：歌单-分享-复制链接，直接粘贴即可"
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

