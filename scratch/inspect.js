const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const zipPath = "c:/Users/artax/Documents/Entreprises/Croney Technology Group/Dev.Croney-Tech/Portfolio/OpenSource/instashift/insta-zip/instagram-matthias.cgr-2026-06-01-NOKBqbhm.zip";

function getWeekNumber(d) {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
}

function getPeriodInfo(timestamp, period) {
  const date = new Date(timestamp * 1000);
  let key;
  let label;

  switch (period) {
    case "day": {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      key = `${yyyy}-${mm}-${dd}`;
      label = `${dd}/${mm}/${String(yyyy).slice(-2)}`;
      break;
    }
    case "week": {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      const yyyy = d.getFullYear();
      const w = getWeekNumber(d);
      key = `${yyyy}-W${String(w).padStart(2, "0")}`;
      label = `S${w} ${yyyy}`;
      break;
    }
    case "month": {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      key = `${yyyy}-${mm}`;
      const months = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
      label = `${months[date.getMonth()]} ${String(yyyy).slice(-2)}`;
      break;
    }
    case "year": {
      const yyyy = date.getFullYear();
      key = `${yyyy}`;
      label = `${yyyy}`;
      break;
    }
  }
  return { key, label, date };
}

function getChronologicalData(followers, following, period) {
  const followersCountMap = new Map();
  const followingCountMap = new Map();

  followers.forEach((user) => {
    const { key, label, date } = getPeriodInfo(user.timestamp, period);
    const existing = followersCountMap.get(key) || { label, count: 0, date };
    existing.count++;
    followersCountMap.set(key, existing);
  });

  following.forEach((user) => {
    const { key, label, date } = getPeriodInfo(user.timestamp, period);
    const existing = followingCountMap.get(key) || { label, count: 0, date };
    existing.count++;
    followingCountMap.set(key, existing);
  });

  const allKeys = new Set([
    ...followersCountMap.keys(),
    ...followingCountMap.keys(),
  ]);

  const points = Array.from(allKeys).map((key) => {
    const fInfo = followersCountMap.get(key);
    const figInfo = followingCountMap.get(key);
    const label = fInfo?.label || figInfo?.label || "";
    const date = fInfo?.date || figInfo?.date || new Date();
    return {
      key,
      label,
      date,
      followers: fInfo?.count || 0,
      following: figInfo?.count || 0,
    };
  });

  points.sort((a, b) => a.key.localeCompare(b.key));
  return points;
}

// Search function recursive
function parseUsers(parsedJson) {
  let users = [];
  function searchForUsers(obj) {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      for (const item of obj) {
        searchForUsers(item);
      }
      return;
    }
    if (Array.isArray(obj.string_list_data) && obj.string_list_data.length > 0) {
      const data = obj.string_list_data[0];
      const username = data.value || obj.title;
      if (username) {
        users.push({
          username,
          timestamp: data.timestamp
        });
      }
      return;
    }
    for (const key in obj) {
      searchForUsers(obj[key]);
    }
  }
  searchForUsers(parsedJson);
  return users;
}

async function main() {
  const data = fs.readFileSync(zipPath);
  const zip = await JSZip.loadAsync(data);
  const files = Object.keys(zip.files);
  
  const followersFile = files.find(f => f.endsWith('followers_1.json'));
  const followingFile = files.find(f => f.endsWith('following.json'));
  
  const followersContent = await zip.files[followersFile].async('text');
  const followingContent = await zip.files[followingFile].async('text');
  
  const followers = parseUsers(JSON.parse(followersContent));
  const following = parseUsers(JSON.parse(followingContent));
  
  console.log("Followers count:", followers.length);
  console.log("Following count:", following.length);
  
  for (const period of ["day", "week", "month", "year"]) {
    console.log(`\n--- Chronological data for [${period}] ---`);
    const points = getChronologicalData(followers, following, period);
    console.log("Total points generated:", points.length);
    console.log("Last 5 points:", points.slice(-5));
  }
}

main().catch(err => console.error(err));
