"use strict";
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// apps/watch/src/outside/repo/action/entry.ts
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");

// packages/core/src/repoWatch/index.ts
var repoWatch_exports = {};
__export(repoWatch_exports, {
  NAME_MAX: () => NAME_MAX,
  NPM_SEEN_MAX: () => NPM_SEEN_MAX,
  OSV_BATCH_MAX: () => OSV_BATCH_MAX,
  OSV_ECOSYSTEM: () => OSV_ECOSYSTEM,
  OSV_ENTRIES_MAX: () => OSV_ENTRIES_MAX,
  OSV_RECORDS_PER_ENTRY_MAX: () => OSV_RECORDS_PER_ENTRY_MAX,
  OSV_SEEN_MAX: () => OSV_SEEN_MAX,
  RELEASES_PAGE_MAX: () => RELEASES_PAGE_MAX,
  RELEASES_SEEN_MAX: () => RELEASES_SEEN_MAX,
  VERSION_MAX: () => VERSION_MAX,
  YOUNG_LIMIT_MS: () => YOUNG_LIMIT_MS,
  addedEntries: () => addedEntries,
  dependencyAge: () => dependencyAge,
  isLockEntry: () => isLockEntry,
  maintainerChange: () => maintainerChange,
  maintainerNames: () => maintainerNames,
  nextNpm: () => nextNpm,
  nextReleases: () => nextReleases,
  npmLock: () => npmLock_exports,
  osvBatches: () => osvBatches,
  osvFindings: () => osvFindings,
  osvRead: () => osvRead,
  pnpmLock: () => pnpmLock_exports,
  publishedAt: () => publishedAt,
  yarnLock: () => yarnLock_exports
});

// packages/core/src/repoWatch/published.ts
var NPM_SEEN_MAX = 1e4;
var RELEASES_PAGE_MAX = 100;
var RELEASES_SEEN_MAX = 1e3;
var hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
function isPlainObject(v) {
  if (typeof v !== "object" || v === null || Array.isArray(v)) {
    return false;
  }
  const proto = Object.getPrototypeOf(v);
  return proto === null || proto === Object.prototype;
}
var TIME_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,9})?(Z|[+-][0-9]{2}:[0-9]{2})$/;
function isTime(s) {
  return typeof s === "string" && TIME_RE.test(s);
}
var SEMVER_RE = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-((?:0|[1-9][0-9]*|[0-9a-zA-Z-]*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9][0-9]*|[0-9a-zA-Z-]*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
function isVersion(s) {
  return typeof s === "string" && s.length >= 1 && s.length <= 256 && SEMVER_RE.test(s);
}
var CONTROL_RE = /[\x00-\x1F\x7F]/;
function hasControlChar(s) {
  return CONTROL_RE.test(s);
}
function nextNpm(previous, doc) {
  try {
    if (!isPlainObject(doc)) {
      return null;
    }
    if (!hasOwn(doc, "versions") || !isPlainObject(doc.versions)) {
      return null;
    }
    const docVersions = doc.versions;
    const versionKeys = Object.keys(docVersions);
    if (versionKeys.length > NPM_SEEN_MAX) {
      return null;
    }
    for (let i = 0; i < versionKeys.length; i++) {
      const vk = versionKeys[i];
      if (!isVersion(vk)) {
        return null;
      }
      if (!hasOwn(docVersions, vk) || !isPlainObject(docVersions[vk])) {
        return null;
      }
    }
    let distTagsObj = null;
    if (hasOwn(doc, "dist-tags")) {
      if (!isPlainObject(doc["dist-tags"])) {
        return null;
      }
      distTagsObj = doc["dist-tags"];
    }
    let timeObj = null;
    if (hasOwn(doc, "time")) {
      if (!isPlainObject(doc.time)) {
        return null;
      }
      timeObj = doc.time;
    }
    const sortedDocVersions = versionKeys.slice().sort();
    if (previous === null) {
      return {
        seen: { versions: Object.freeze(sortedDocVersions) },
        published: Object.freeze([])
      };
    }
    if (!isPlainObject(previous) || !hasOwn(previous, "versions")) {
      return null;
    }
    if (!Array.isArray(previous.versions)) {
      return null;
    }
    if (previous.versions.length > NPM_SEEN_MAX) {
      return null;
    }
    for (let i = 0; i < previous.versions.length; i++) {
      const pv = previous.versions[i];
      if (!isVersion(pv)) {
        return null;
      }
      if (i > 0 && !(previous.versions[i - 1] < pv)) {
        return null;
      }
    }
    const prevSet = new Set(previous.versions);
    const unionSet = new Set(previous.versions);
    const newVersions = [];
    for (let i = 0; i < sortedDocVersions.length; i++) {
      const v = sortedDocVersions[i];
      unionSet.add(v);
      if (!prevSet.has(v)) {
        newVersions.push(v);
      }
    }
    if (unionSet.size > NPM_SEEN_MAX) {
      return null;
    }
    const nextSeenVersions = Array.from(unionSet).sort();
    const published = [];
    for (let i = 0; i < newVersions.length; i++) {
      const v = newVersions[i];
      const matchingTags = [];
      if (distTagsObj !== null) {
        const dtKeys = Object.keys(distTagsObj);
        for (let j = 0; j < dtKeys.length; j++) {
          const tk = dtKeys[j];
          if (hasOwn(distTagsObj, tk) && distTagsObj[tk] === v) {
            matchingTags.push(tk);
          }
        }
      }
      matchingTags.sort();
      const verObj = docVersions[v];
      let publisher = null;
      if (hasOwn(verObj, "_npmUser") && isPlainObject(verObj._npmUser)) {
        const npmUser = verObj._npmUser;
        if (hasOwn(npmUser, "name") && typeof npmUser.name === "string" && npmUser.name.length >= 1 && npmUser.name.length <= 214) {
          publisher = npmUser.name;
        }
      }
      let publishedAt2 = null;
      if (timeObj !== null && hasOwn(timeObj, v)) {
        const tVal = timeObj[v];
        if (isTime(tVal)) {
          publishedAt2 = tVal;
        }
      }
      published.push({
        version: v,
        tags: Object.freeze(matchingTags),
        publisher,
        publishedAt: publishedAt2
      });
    }
    return {
      seen: { versions: Object.freeze(nextSeenVersions) },
      published: Object.freeze(published)
    };
  } catch {
    return null;
  }
}
function nextReleases(previous, releases) {
  try {
    if (!Array.isArray(releases)) {
      return null;
    }
    if (releases.length > RELEASES_PAGE_MAX) {
      return null;
    }
    const seenIdsInPage = /* @__PURE__ */ new Set();
    const parsedReleases = [];
    for (let i = 0; i < releases.length; i++) {
      const item = releases[i];
      if (!isPlainObject(item)) {
        return null;
      }
      if (!hasOwn(item, "id")) {
        return null;
      }
      const rawId = item.id;
      if (typeof rawId !== "number" || !Number.isSafeInteger(rawId) || rawId <= 0) {
        return null;
      }
      if (seenIdsInPage.has(rawId)) {
        return null;
      }
      seenIdsInPage.add(rawId);
      if (!hasOwn(item, "tag_name")) {
        return null;
      }
      const rawTag = item.tag_name;
      if (typeof rawTag !== "string" || rawTag.length < 1 || rawTag.length > 255 || hasControlChar(rawTag)) {
        return null;
      }
      if (!hasOwn(item, "draft") || typeof item.draft !== "boolean") {
        return null;
      }
      if (!hasOwn(item, "prerelease") || typeof item.prerelease !== "boolean") {
        return null;
      }
      let nameVal = null;
      if (hasOwn(item, "name")) {
        const rawName = item.name;
        if (typeof rawName === "string" && rawName.length >= 1 && rawName.length <= 255 && !hasControlChar(rawName)) {
          nameVal = rawName;
        }
      }
      let publishedAtVal = null;
      if (hasOwn(item, "published_at")) {
        const rawPub = item.published_at;
        if (rawPub === null) {
          publishedAtVal = null;
        } else if (isTime(rawPub)) {
          publishedAtVal = rawPub;
        } else {
          return null;
        }
      }
      let authorVal = null;
      if (hasOwn(item, "author")) {
        const rawAuthor = item.author;
        if (rawAuthor === null) {
          authorVal = null;
        } else if (isPlainObject(rawAuthor) && hasOwn(rawAuthor, "login") && typeof rawAuthor.login === "string" && rawAuthor.login.length >= 1 && rawAuthor.login.length <= 39) {
          authorVal = rawAuthor.login;
        } else {
          return null;
        }
      }
      parsedReleases.push({
        id: rawId,
        tag: rawTag,
        name: nameVal,
        draft: item.draft,
        prerelease: item.prerelease,
        author: authorVal,
        publishedAt: publishedAtVal
      });
    }
    const nonDrafts = parsedReleases.filter((r) => !r.draft);
    if (previous === null) {
      const initialIds = nonDrafts.map((r) => r.id).sort((a, b) => a - b);
      const cappedInitialIds = initialIds.length > RELEASES_SEEN_MAX ? initialIds.slice(initialIds.length - RELEASES_SEEN_MAX) : initialIds;
      return {
        seen: { ids: Object.freeze(cappedInitialIds) },
        published: Object.freeze([])
      };
    }
    if (!isPlainObject(previous) || !hasOwn(previous, "ids") || !Array.isArray(previous.ids)) {
      return null;
    }
    if (previous.ids.length > RELEASES_SEEN_MAX) {
      return null;
    }
    for (let i = 0; i < previous.ids.length; i++) {
      const id = previous.ids[i];
      if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) {
        return null;
      }
      if (i > 0 && id <= previous.ids[i - 1]) {
        return null;
      }
    }
    const prevIdsSet = new Set(previous.ids);
    const smallestPrevId = previous.ids.length > 0 ? previous.ids[0] : 0;
    const isAtMax = previous.ids.length === RELEASES_SEEN_MAX;
    const published = [];
    for (let i = 0; i < nonDrafts.length; i++) {
      const rel = nonDrafts[i];
      if (!prevIdsSet.has(rel.id)) {
        if (!isAtMax || rel.id > smallestPrevId) {
          published.push({
            id: rel.id,
            tag: rel.tag,
            name: rel.name,
            prerelease: rel.prerelease,
            author: rel.author,
            publishedAt: rel.publishedAt
          });
        }
      }
    }
    published.sort((a, b) => a.id - b.id);
    const unionIdsSet = new Set(previous.ids);
    for (let i = 0; i < nonDrafts.length; i++) {
      unionIdsSet.add(nonDrafts[i].id);
    }
    const allUnionIds = Array.from(unionIdsSet).sort((a, b) => a - b);
    const cappedUnionIds = allUnionIds.length > RELEASES_SEEN_MAX ? allUnionIds.slice(allUnionIds.length - RELEASES_SEEN_MAX) : allUnionIds;
    return {
      seen: { ids: Object.freeze(cappedUnionIds) },
      published: Object.freeze(published)
    };
  } catch {
    return null;
  }
}

// packages/core/src/repoWatch/depChanges.ts
var YOUNG_LIMIT_MS = 48 * 60 * 60 * 1e3;
var NAME_MAX = 214;
var VERSION_MAX = 256;
var HAS_OWN = Object.prototype.hasOwnProperty;
var NAME_RE = /^(?:@[A-Za-z0-9~-][A-Za-z0-9._~-]*\/)?[A-Za-z0-9~-][A-Za-z0-9._~-]*$/;
var VERSION_RE = /^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
var ISO_TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
function hasOwn2(obj, key) {
  return HAS_OWN.call(obj, key);
}
function isPlainObject2(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
function isValidName(value) {
  return typeof value === "string" && value.length >= 1 && value.length <= NAME_MAX && NAME_RE.test(value);
}
function isValidVersion(value) {
  return typeof value === "string" && value.length >= 1 && value.length <= VERSION_MAX && VERSION_RE.test(value);
}
function isLockEntry(value) {
  try {
    if (!isPlainObject2(value)) {
      return false;
    }
    if (!hasOwn2(value, "name") || !hasOwn2(value, "version")) {
      return false;
    }
    return isValidName(value["name"]) && isValidVersion(value["version"]);
  } catch {
    return false;
  }
}
function readLockArray(list) {
  if (!Array.isArray(list)) {
    return null;
  }
  const out = [];
  for (let i = 0; i < list.length; i += 1) {
    if (!hasOwn2(list, String(i))) {
      return null;
    }
    const item = list[i];
    if (!isLockEntry(item)) {
      return null;
    }
    const rec = item;
    out.push({
      name: rec["name"],
      version: rec["version"]
    });
  }
  return out;
}
function addedEntries(before, after) {
  try {
    const afterList = readLockArray(after);
    if (afterList === null) {
      return null;
    }
    if (before === null) {
      return [];
    }
    const beforeList = readLockArray(before);
    if (beforeList === null) {
      return null;
    }
    const prevByName = /* @__PURE__ */ new Map();
    for (let i = 0; i < beforeList.length; i += 1) {
      const entry = beforeList[i];
      let versions = prevByName.get(entry.name);
      if (versions === void 0) {
        versions = [entry.version];
        prevByName.set(entry.name, versions);
      } else if (!versions.includes(entry.version)) {
        versions.push(entry.version);
      }
    }
    const seenAdded = /* @__PURE__ */ new Set();
    const result = [];
    for (let i = 0; i < afterList.length; i += 1) {
      const entry = afterList[i];
      const prev = prevByName.get(entry.name) ?? [];
      if (prev.includes(entry.version)) {
        continue;
      }
      const key = `${entry.name}@${entry.version}`;
      if (seenAdded.has(key)) {
        continue;
      }
      seenAdded.add(key);
      result.push({
        name: entry.name,
        version: entry.version,
        previous: [...prev]
      });
    }
    return result;
  } catch {
    return null;
  }
}
function publishedAt(doc, version) {
  try {
    if (!isPlainObject2(doc) || !isValidVersion(version)) {
      return null;
    }
    if (!hasOwn2(doc, "time")) {
      return null;
    }
    const timeObj = doc["time"];
    if (!isPlainObject2(timeObj) || !hasOwn2(timeObj, version)) {
      return null;
    }
    const raw = timeObj[version];
    if (typeof raw !== "string" || !ISO_TIME_RE.test(raw)) {
      return null;
    }
    const ms = Date.parse(raw);
    if (!Number.isFinite(ms)) {
      return null;
    }
    const isoPrefix = new Date(ms).toISOString().slice(0, 19);
    if (isoPrefix !== raw.slice(0, 19)) {
      return null;
    }
    return ms;
  } catch {
    return null;
  }
}
function dependencyAge(doc, version, readAtMs) {
  try {
    if (typeof readAtMs !== "number" || !Number.isSafeInteger(readAtMs) || readAtMs < 0) {
      return { kind: "UNKNOWN" };
    }
    const pubMs = publishedAt(doc, version);
    if (pubMs === null) {
      return { kind: "UNKNOWN" };
    }
    const ageMs = readAtMs - pubMs;
    if (ageMs < YOUNG_LIMIT_MS) {
      return { kind: "YOUNG", ageMs };
    }
    return { kind: "OLD", ageMs };
  } catch {
    return { kind: "UNKNOWN" };
  }
}
function maintainerNames(doc, version) {
  try {
    if (!isPlainObject2(doc) || !isValidVersion(version)) {
      return null;
    }
    if (!hasOwn2(doc, "versions")) {
      return null;
    }
    const versionsObj = doc["versions"];
    if (!isPlainObject2(versionsObj) || !hasOwn2(versionsObj, version)) {
      return null;
    }
    const verObj = versionsObj[version];
    if (!isPlainObject2(verObj) || !hasOwn2(verObj, "maintainers")) {
      return null;
    }
    const maint = verObj["maintainers"];
    if (!Array.isArray(maint)) {
      return null;
    }
    const names = /* @__PURE__ */ new Set();
    for (let i = 0; i < maint.length; i += 1) {
      if (!hasOwn2(maint, String(i))) {
        return null;
      }
      const item = maint[i];
      if (!isPlainObject2(item) || !hasOwn2(item, "name")) {
        return null;
      }
      const name = item["name"];
      if (typeof name !== "string" || name.length === 0) {
        return null;
      }
      names.add(name);
    }
    return Array.from(names).sort();
  } catch {
    return null;
  }
}
function maintainerChange(doc, oldVersion, newVersion) {
  try {
    const oldNames = maintainerNames(doc, oldVersion);
    const newNames = maintainerNames(doc, newVersion);
    if (oldNames === null || newNames === null) {
      return { kind: "UNKNOWN" };
    }
    const oldSet = new Set(oldNames);
    const newSet = new Set(newNames);
    const added = newNames.filter((n) => !oldSet.has(n));
    const removed = oldNames.filter((n) => !newSet.has(n));
    if (added.length === 0 && removed.length === 0) {
      return { kind: "SAME" };
    }
    return { kind: "CHANGED", added, removed };
  } catch {
    return { kind: "UNKNOWN" };
  }
}

// packages/core/src/repoWatch/osvCheck.ts
var OSV_ECOSYSTEM = "npm";
var OSV_BATCH_MAX = 1e3;
var OSV_ENTRIES_MAX = 2e4;
var OSV_SEEN_MAX = 2e4;
var OSV_RECORDS_PER_ENTRY_MAX = 1e3;
var PACKAGE_NAME_PATTERN = /^(@[A-Za-z0-9~-][A-Za-z0-9._~-]*\/)?[A-Za-z0-9~-][A-Za-z0-9._~-]*$/;
var SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
var RECORD_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
var PAGE_TOKEN_PATTERN = /^[!-~]{1,4096}$/;
function isPlainRecord(val) {
  if (val === null || typeof val !== "object" || Array.isArray(val)) {
    return false;
  }
  return true;
}
function isValidKey(key) {
  if (typeof key !== "string") {
    return false;
  }
  const lastAt = key.lastIndexOf("@");
  if (lastAt <= 0) {
    return false;
  }
  const name = key.slice(0, lastAt);
  if (name.length < 1 || name.length > 214 || !PACKAGE_NAME_PATTERN.test(name)) {
    return false;
  }
  const spaceIdx = key.indexOf(" ", lastAt);
  if (spaceIdx <= lastAt + 1) {
    return false;
  }
  const version = key.slice(lastAt + 1, spaceIdx);
  if (version.length < 1 || version.length > 256 || !SEMVER_PATTERN.test(version)) {
    return false;
  }
  const record = key.slice(spaceIdx + 1);
  if (record.length < 1 || record.length > 128 || !RECORD_ID_PATTERN.test(record)) {
    return false;
  }
  return true;
}
function osvBatches(entries) {
  try {
    if (!Array.isArray(entries)) {
      return null;
    }
    if (entries.length > OSV_ENTRIES_MAX) {
      return null;
    }
    let skipped = 0;
    const validMap = /* @__PURE__ */ new Map();
    for (let i = 0; i < entries.length; i++) {
      const item = entries[i];
      if (!isPlainRecord(item)) {
        return null;
      }
      if (!Object.prototype.hasOwnProperty.call(item, "name") || !Object.prototype.hasOwnProperty.call(item, "version")) {
        return null;
      }
      const name = item.name;
      const version = item.version;
      if (typeof name !== "string" || typeof version !== "string") {
        return null;
      }
      if (name.length < 1 || name.length > 214 || !PACKAGE_NAME_PATTERN.test(name)) {
        return null;
      }
      if (version.length < 1 || version.length > 256 || !SEMVER_PATTERN.test(version)) {
        skipped++;
        continue;
      }
      const key = name + "@" + version;
      if (!validMap.has(key)) {
        validMap.set(key, { name, version });
      }
    }
    const uniqueEntries = Array.from(validMap.values());
    uniqueEntries.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      if (a.version < b.version) return -1;
      if (a.version > b.version) return 1;
      return 0;
    });
    const batches = [];
    for (let i = 0; i < uniqueEntries.length; i += OSV_BATCH_MAX) {
      const slice = uniqueEntries.slice(i, i + OSV_BATCH_MAX);
      const queries = [];
      for (let j = 0; j < slice.length; j++) {
        queries.push({
          package: { name: slice[j].name, ecosystem: OSV_ECOSYSTEM },
          version: slice[j].version
        });
      }
      batches.push({ queries });
    }
    return { batches, skipped };
  } catch {
    return null;
  }
}
function osvRead(batch, answer) {
  try {
    if (!isPlainRecord(batch) || !Array.isArray(batch.queries)) {
      return null;
    }
    const queries = batch.queries;
    if (queries.length < 1 || queries.length > OSV_BATCH_MAX) {
      return null;
    }
    for (let i = 0; i < queries.length; i++) {
      const q = queries[i];
      if (!isPlainRecord(q)) return null;
      if (!isPlainRecord(q.package)) return null;
      const pkgName = q.package.name;
      const pkgEco = q.package.ecosystem;
      if (typeof pkgName !== "string" || pkgName.length < 1 || pkgName.length > 214 || !PACKAGE_NAME_PATTERN.test(pkgName)) {
        return null;
      }
      if (pkgEco !== OSV_ECOSYSTEM) {
        return null;
      }
      if (typeof q.version !== "string" || q.version.length < 1 || q.version.length > 256 || !SEMVER_PATTERN.test(q.version)) {
        return null;
      }
      if (Object.prototype.hasOwnProperty.call(q, "page_token")) {
        const pt = q.page_token;
        if (typeof pt !== "string" || pt.length < 1 || pt.length > 4096 || !PAGE_TOKEN_PATTERN.test(pt)) {
          return null;
        }
      }
    }
    if (!isPlainRecord(answer) || !Array.isArray(answer.results)) {
      return null;
    }
    const answerResults = answer.results;
    if (answerResults.length !== queries.length) {
      return null;
    }
    const nextQueries = [];
    const entryResults = [];
    for (let i = 0; i < answerResults.length; i++) {
      const res = answerResults[i];
      if (!isPlainRecord(res)) return null;
      let records = [];
      if (Object.prototype.hasOwnProperty.call(res, "vulns")) {
        const vulns = res.vulns;
        if (!Array.isArray(vulns) || vulns.length > OSV_RECORDS_PER_ENTRY_MAX) {
          return null;
        }
        const recordSet = /* @__PURE__ */ new Set();
        for (let j = 0; j < vulns.length; j++) {
          const v = vulns[j];
          if (!isPlainRecord(v)) return null;
          if (!Object.prototype.hasOwnProperty.call(v, "id")) return null;
          const id = v.id;
          if (typeof id !== "string" || id.length < 1 || id.length > 128 || !RECORD_ID_PATTERN.test(id)) {
            return null;
          }
          recordSet.add(id);
        }
        records = Array.from(recordSet).sort();
      }
      if (Object.prototype.hasOwnProperty.call(res, "next_page_token")) {
        const npt = res.next_page_token;
        if (typeof npt !== "string" || npt.length < 1 || npt.length > 4096 || !PAGE_TOKEN_PATTERN.test(npt)) {
          return null;
        }
        const q2 = queries[i];
        nextQueries.push({
          package: { name: q2.package.name, ecosystem: OSV_ECOSYSTEM },
          version: q2.version,
          page_token: npt
        });
      }
      const q = queries[i];
      entryResults.push({
        name: q.package.name,
        version: q.version,
        records
      });
    }
    const nextPage = nextQueries.length > 0 ? { queries: nextQueries } : null;
    return {
      results: entryResults,
      nextPage
    };
  } catch {
    return null;
  }
}
function osvFindings(previous, results) {
  try {
    if (previous !== null) {
      if (!isPlainRecord(previous)) return null;
      if (!Object.prototype.hasOwnProperty.call(previous, "keys")) return null;
      if (!Array.isArray(previous.keys)) return null;
      if (previous.keys.length > OSV_SEEN_MAX) return null;
      for (let i = 0; i < previous.keys.length; i++) {
        const k = previous.keys[i];
        if (!isValidKey(k)) return null;
        if (i > 0 && previous.keys[i - 1] >= k) return null;
      }
    }
    if (!Array.isArray(results)) return null;
    for (let i = 0; i < results.length; i++) {
      const item = results[i];
      if (!isPlainRecord(item)) return null;
      if (!Object.prototype.hasOwnProperty.call(item, "name") || !Object.prototype.hasOwnProperty.call(item, "version") || !Object.prototype.hasOwnProperty.call(item, "records")) {
        return null;
      }
      const name = item.name;
      const version = item.version;
      const records = item.records;
      if (typeof name !== "string" || name.length < 1 || name.length > 214 || !PACKAGE_NAME_PATTERN.test(name)) {
        return null;
      }
      if (typeof version !== "string" || version.length < 1 || version.length > 256 || !SEMVER_PATTERN.test(version)) {
        return null;
      }
      if (!Array.isArray(records)) return null;
      if (records.length > OSV_RECORDS_PER_ENTRY_MAX) return null;
      for (let j = 0; j < records.length; j++) {
        const rec = records[j];
        if (typeof rec !== "string" || rec.length < 1 || rec.length > 128 || !RECORD_ID_PATTERN.test(rec)) {
          return null;
        }
      }
    }
    const seenSet = /* @__PURE__ */ new Set();
    if (previous !== null) {
      for (let i = 0; i < previous.keys.length; i++) {
        seenSet.add(previous.keys[i]);
      }
    }
    const maliciousFindingsMap = /* @__PURE__ */ new Map();
    const advisoryFindingsMap = /* @__PURE__ */ new Map();
    const otherMap = /* @__PURE__ */ new Map();
    for (let i = 0; i < results.length; i++) {
      const item = results[i];
      for (let j = 0; j < item.records.length; j++) {
        const record = item.records[j];
        const key = item.name + "@" + item.version + " " + record;
        if (record.startsWith("MAL-")) {
          if (!seenSet.has(key)) {
            if (!maliciousFindingsMap.has(key)) {
              maliciousFindingsMap.set(key, {
                name: item.name,
                version: item.version,
                record,
                level: "MALICIOUS"
              });
            }
          }
          seenSet.add(key);
        } else if (record.startsWith("GHSA-")) {
          if (!seenSet.has(key)) {
            if (!advisoryFindingsMap.has(key)) {
              advisoryFindingsMap.set(key, {
                name: item.name,
                version: item.version,
                record,
                level: "ADVISORY"
              });
            }
          }
          seenSet.add(key);
        } else {
          if (!otherMap.has(key)) {
            otherMap.set(key, {
              name: item.name,
              version: item.version,
              record
            });
          }
        }
      }
    }
    if (seenSet.size > OSV_SEEN_MAX) {
      return null;
    }
    const sortedMaliciousKeys = Array.from(maliciousFindingsMap.keys()).sort();
    const sortedAdvisoryKeys = Array.from(advisoryFindingsMap.keys()).sort();
    const findings = [];
    for (let i = 0; i < sortedMaliciousKeys.length; i++) {
      findings.push(maliciousFindingsMap.get(sortedMaliciousKeys[i]));
    }
    for (let i = 0; i < sortedAdvisoryKeys.length; i++) {
      findings.push(advisoryFindingsMap.get(sortedAdvisoryKeys[i]));
    }
    const sortedOtherKeys = Array.from(otherMap.keys()).sort();
    const other = [];
    for (let i = 0; i < sortedOtherKeys.length; i++) {
      other.push(otherMap.get(sortedOtherKeys[i]));
    }
    const seenKeys = Array.from(seenSet).sort();
    const seen = { keys: seenKeys };
    return { seen, findings, other };
  } catch {
    return null;
  }
}

// packages/core/src/repoWatch/npmLock.ts
var npmLock_exports = {};
__export(npmLock_exports, {
  LOCK_ENTRIES_MAX: () => LOCK_ENTRIES_MAX,
  LOCK_TEXT_MAX: () => LOCK_TEXT_MAX,
  readNpmLock: () => readNpmLock
});
var LOCK_TEXT_MAX = 3e7;
var LOCK_ENTRIES_MAX = 5e4;
var NAME_PATTERN = /^(?:@[A-Za-z0-9~-][A-Za-z0-9._~-]*\/)?[A-Za-z0-9~-][A-Za-z0-9._~-]*$/;
var VERSION_PATTERN = /^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
function isPlainObject3(v) {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}
function hasOwn3(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
function isRegistryTarball(url) {
  if (!url.startsWith("https:") || !url.slice(6).startsWith("//")) return false;
  if (!url.includes("/-/")) return false;
  const hashIdx = url.indexOf("#");
  const base = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
  return base.endsWith(".tgz");
}
function readNpmLock(text) {
  try {
    if (typeof text !== "string") return null;
    if (text.length < 1 || text.length > LOCK_TEXT_MAX) return null;
    let s = text;
    if (s.startsWith("\uFEFF")) {
      s = s.slice(1);
    }
    if (/[\r](?!\n)/.test(s)) return null;
    s = s.replace(/\r\n/g, "\n");
    const parsed = JSON.parse(s);
    if (!isPlainObject3(parsed)) return null;
    if (!hasOwn3(parsed, "lockfileVersion") || typeof parsed.lockfileVersion !== "number") return null;
    if (parsed.lockfileVersion !== 2 && parsed.lockfileVersion !== 3) return null;
    if (!hasOwn3(parsed, "packages") || !isPlainObject3(parsed.packages)) return null;
    const pkgs = parsed.packages;
    const kept = [];
    for (const key of Object.keys(pkgs)) {
      if (!hasOwn3(pkgs, key)) continue;
      if (key === "") continue;
      if (!key.startsWith("node_modules/")) continue;
      const lastSlash = key.lastIndexOf("node_modules/");
      const pathPkg = key.slice(lastSlash + 13);
      const val = pkgs[key];
      if (!isPlainObject3(val)) return null;
      if (hasOwn3(val, "link")) {
        if (typeof val.link !== "boolean") return null;
        if (val.link === true) continue;
      }
      if (hasOwn3(val, "resolved")) {
        if (typeof val.resolved !== "string") return null;
        if (!isRegistryTarball(val.resolved)) continue;
      }
      let entryName;
      if (hasOwn3(val, "name")) {
        if (typeof val.name !== "string" || val.name.length < 1 || val.name.length > 214 || !NAME_PATTERN.test(val.name)) {
          return null;
        }
        entryName = val.name;
      } else {
        if (typeof pathPkg !== "string" || pathPkg.length < 1 || pathPkg.length > 214 || !NAME_PATTERN.test(pathPkg)) {
          return null;
        }
        entryName = pathPkg;
      }
      if (!hasOwn3(val, "version") || typeof val.version !== "string" || val.version.length < 1 || val.version.length > 256 || !VERSION_PATTERN.test(val.version)) {
        return null;
      }
      const entryVersion = val.version;
      kept.push({ name: entryName, version: entryVersion });
    }
    const seen = /* @__PURE__ */ new Set();
    const unique = [];
    for (const entry of kept) {
      const sig = entry.name + "\0" + entry.version;
      if (!seen.has(sig)) {
        seen.add(sig);
        unique.push({ name: entry.name, version: entry.version });
      }
    }
    if (unique.length > LOCK_ENTRIES_MAX) return null;
    unique.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      if (a.version < b.version) return -1;
      if (a.version > b.version) return 1;
      return 0;
    });
    return unique;
  } catch {
    return null;
  }
}

// packages/core/src/repoWatch/pnpmLock.ts
var pnpmLock_exports = {};
__export(pnpmLock_exports, {
  LOCK_ENTRIES_MAX: () => LOCK_ENTRIES_MAX2,
  LOCK_TEXT_MAX: () => LOCK_TEXT_MAX2,
  readPnpmLock: () => readPnpmLock
});
var LOCK_TEXT_MAX2 = 3e7;
var LOCK_ENTRIES_MAX2 = 5e4;
var NAME_PATTERN2 = /^(?:@[A-Za-z0-9~-][A-Za-z0-9._~-]*\/)?[A-Za-z0-9~-][A-Za-z0-9._~-]*$/;
var VERSION_PATTERN2 = /^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
function isValidName2(s) {
  return s.length >= 1 && s.length <= 214 && NAME_PATTERN2.test(s);
}
function isValidVersion2(s) {
  return s.length >= 1 && s.length <= 256 && VERSION_PATTERN2.test(s);
}
function readPnpmLock(text) {
  try {
    if (typeof text !== "string") return null;
    if (text.length < 1 || text.length > LOCK_TEXT_MAX2) return null;
    let s = text;
    if (s.startsWith("\uFEFF")) {
      s = s.slice(1);
    }
    if (/[\r](?!\n)/.test(s)) return null;
    s = s.replace(/\r\n/g, "\n");
    const lines = s.split("\n");
    let versionStr = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === "" || line.startsWith("#")) continue;
      if (line === "lockfileVersion: '6.0'" || line === 'lockfileVersion: "6.0"') {
        versionStr = "6.0";
      } else if (line === "lockfileVersion: '9.0'" || line === 'lockfileVersion: "9.0"') {
        versionStr = "9.0";
      } else {
        return null;
      }
      break;
    }
    if (versionStr === null) return null;
    let packagesSeen = 0;
    let inPackages = false;
    const packagesLines = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === "packages: {}") {
        packagesSeen++;
        continue;
      }
      if (line === "packages:") {
        packagesSeen++;
        inPackages = true;
        continue;
      }
      if (inPackages) {
        if (line !== "" && !line.startsWith(" ") && !line.startsWith("	")) {
          inPackages = false;
          continue;
        }
        packagesLines.push(line);
      }
    }
    if (packagesSeen > 1) return null;
    if (packagesSeen === 0) return [];
    const kept = [];
    for (let i = 0; i < packagesLines.length; i++) {
      const line = packagesLines[i];
      if (line === "") continue;
      if (line.startsWith("	")) return null;
      let spaces = 0;
      while (spaces < line.length && line[spaces] === " ") {
        spaces++;
      }
      if (spaces === 1 || spaces === 3) return null;
      if (spaces >= 4) {
        continue;
      }
      if (spaces !== 2) {
        return null;
      }
      const rest = line.slice(2);
      if (rest.startsWith("	")) return null;
      const colonMatch = rest.match(/:(?: |$)/);
      if (!colonMatch || colonMatch.index === void 0) return null;
      let key = rest.slice(0, colonMatch.index);
      if (key.startsWith("'") && key.endsWith("'") && key.length >= 2 || key.startsWith('"') && key.endsWith('"') && key.length >= 2) {
        key = key.slice(1, -1);
      }
      if (versionStr === "6.0") {
        if (!key.startsWith("/")) return null;
        key = key.slice(1);
      } else {
        if (key.startsWith("/")) return null;
      }
      const parenIdx = key.indexOf("(");
      if (parenIdx !== -1) {
        key = key.slice(0, parenIdx);
      }
      const atIdx = key.indexOf("@", 1);
      if (atIdx === -1) return null;
      const name = key.slice(0, atIdx);
      const spec = key.slice(atIdx + 1);
      if (isValidVersion2(spec)) {
        if (!isValidName2(name)) return null;
        kept.push({ name, version: spec });
      }
    }
    const seen = /* @__PURE__ */ new Set();
    const unique = [];
    for (const entry of kept) {
      const sig = entry.name + "\0" + entry.version;
      if (!seen.has(sig)) {
        seen.add(sig);
        unique.push({ name: entry.name, version: entry.version });
      }
    }
    if (unique.length > LOCK_ENTRIES_MAX2) return null;
    unique.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      if (a.version < b.version) return -1;
      if (a.version > b.version) return 1;
      return 0;
    });
    return unique;
  } catch {
    return null;
  }
}

// packages/core/src/repoWatch/yarnLock.ts
var yarnLock_exports = {};
__export(yarnLock_exports, {
  LOCK_ENTRIES_MAX: () => LOCK_ENTRIES_MAX3,
  LOCK_TEXT_MAX: () => LOCK_TEXT_MAX3,
  readYarnLock: () => readYarnLock
});
var LOCK_TEXT_MAX3 = 3e7;
var LOCK_ENTRIES_MAX3 = 5e4;
var NAME_PATTERN3 = /^(?:@[A-Za-z0-9~-][A-Za-z0-9._~-]*\/)?[A-Za-z0-9~-][A-Za-z0-9._~-]*$/;
var VERSION_PATTERN3 = /^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
function isValidName3(s) {
  return s.length >= 1 && s.length <= 214 && NAME_PATTERN3.test(s);
}
function isValidVersion3(s) {
  return s.length >= 1 && s.length <= 256 && VERSION_PATTERN3.test(s);
}
function isRegistryTarball2(url) {
  if (!url.startsWith("https:") || !url.slice(6).startsWith("//")) return false;
  if (!url.includes("/-/")) return false;
  const hashIdx = url.indexOf("#");
  const base = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
  return base.endsWith(".tgz");
}
function parseYarn1(lines) {
  const kept = [];
  let currentName = null;
  let currentVersion = null;
  let currentResolved = null;
  let versionCount = 0;
  function flushBlock() {
    if (currentName === null) return true;
    if (versionCount !== 1 || currentVersion === null) return false;
    if (currentResolved !== null && !isRegistryTarball2(currentResolved)) {
      return true;
    }
    if (!isValidName3(currentName) || !isValidVersion3(currentVersion)) {
      return false;
    }
    kept.push({ name: currentName, version: currentVersion });
    return true;
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === "" || line.startsWith("#")) continue;
    if (line.startsWith(" ") || line.startsWith("	")) {
      if (!line.startsWith("  ")) return null;
      if (currentName === null) return null;
      if (line.startsWith('  version "') && line.endsWith('"') && line.length >= 12) {
        versionCount++;
        currentVersion = line.slice(11, -1);
      } else if (line.startsWith('  resolved "') && line.endsWith('"') && line.length >= 13) {
        currentResolved = line.slice(12, -1);
      }
    } else {
      if (!line.endsWith(":")) return null;
      if (!flushBlock()) return null;
      currentVersion = null;
      currentResolved = null;
      versionCount = 0;
      const header = line.slice(0, -1);
      const rawSpecs = header.split(", ");
      let blockName = null;
      for (const rawSpec of rawSpecs) {
        let spec;
        if (rawSpec.startsWith('"')) {
          if (!rawSpec.endsWith('"') || rawSpec.length < 2) return null;
          spec = rawSpec.slice(1, -1);
        } else {
          if (rawSpec.endsWith('"')) return null;
          spec = rawSpec;
        }
        const atIdx = spec.indexOf("@", 1);
        if (atIdx === -1) return null;
        let sName = spec.slice(0, atIdx);
        const range = spec.slice(atIdx + 1);
        if (range.startsWith("npm:")) {
          const target = range.slice(4);
          const targetAt = target.indexOf("@", 1);
          if (targetAt === -1) return null;
          sName = target.slice(0, targetAt);
        }
        if (blockName === null) {
          blockName = sName;
        } else if (blockName !== sName) {
          return null;
        }
      }
      currentName = blockName;
    }
  }
  if (!flushBlock()) return null;
  return kept;
}
function parseYarn2(lines) {
  const kept = [];
  let isMetadata = false;
  let inBlock = false;
  let resolutionCount = 0;
  let currentResolution = null;
  function flushBlock() {
    if (!inBlock || isMetadata) return true;
    if (resolutionCount !== 1 || currentResolution === null) return false;
    const atIdx = currentResolution.indexOf("@", 1);
    if (atIdx !== -1) {
      const name = currentResolution.slice(0, atIdx);
      const rest = currentResolution.slice(atIdx + 1);
      if (rest.startsWith("npm:")) {
        const ver = rest.slice(4);
        if (!isValidName3(name) || !isValidVersion3(ver)) {
          return false;
        }
        kept.push({ name, version: ver });
      }
    }
    return true;
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === "" || line.startsWith("#")) continue;
    if (line.startsWith(" ") || line.startsWith("	")) {
      if (!inBlock) return null;
      if (isMetadata) continue;
      if (line.startsWith("  resolution: ")) {
        resolutionCount++;
        let val = line.slice(14).trim();
        if (val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
          val = val.slice(1, -1);
        }
        currentResolution = val;
      }
    } else {
      if (!line.endsWith(":")) return null;
      if (!flushBlock()) return null;
      inBlock = true;
      resolutionCount = 0;
      currentResolution = null;
      if (line === "__metadata:") {
        isMetadata = true;
      } else {
        isMetadata = false;
      }
    }
  }
  if (!flushBlock()) return null;
  return kept;
}
function readYarnLock(text) {
  try {
    if (typeof text !== "string") return null;
    if (text.length < 1 || text.length > LOCK_TEXT_MAX3) return null;
    let s = text;
    if (s.startsWith("\uFEFF")) {
      s = s.slice(1);
    }
    if (/[\r](?!\n)/.test(s)) return null;
    s = s.replace(/\r\n/g, "\n");
    const lines = s.split("\n");
    let isYarn2 = false;
    let isYarn1 = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === "__metadata:") {
        isYarn2 = true;
        break;
      }
    }
    if (!isYarn2) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i] === "# yarn lockfile v1") {
          isYarn1 = true;
          break;
        }
      }
    }
    if (!isYarn2 && !isYarn1) return null;
    const kept = isYarn2 ? parseYarn2(lines) : parseYarn1(lines);
    if (kept === null) return null;
    const seen = /* @__PURE__ */ new Set();
    const unique = [];
    for (const entry of kept) {
      const sig = entry.name + "\0" + entry.version;
      if (!seen.has(sig)) {
        seen.add(sig);
        unique.push({ name: entry.name, version: entry.version });
      }
    }
    if (unique.length > LOCK_ENTRIES_MAX3) return null;
    unique.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      if (a.version < b.version) return -1;
      if (a.version > b.version) return 1;
      return 0;
    });
    return unique;
  } catch {
    return null;
  }
}

// apps/watch/src/outside/npmOsv.ts
var DAY_MS = 24 * 60 * 60 * 1e3;

// apps/watch/src/outside/published.ts
var DAY_MS2 = 24 * 60 * 60 * 1e3;

// apps/watch/src/outside/repo/lockfiles.ts
var DEFAULT_LOCKFILE_PATHS = [
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock"
];
function parseLockfile(path, content) {
  const lower = path.toLowerCase();
  if (lower.endsWith("package-lock.json") || lower.endsWith(".json")) {
    return repoWatch_exports.npmLock.readNpmLock(content);
  }
  if (lower.endsWith("pnpm-lock.yaml") || lower.endsWith(".yaml") || lower.endsWith(".yml")) {
    return repoWatch_exports.pnpmLock.readPnpmLock(content);
  }
  if (lower.endsWith("yarn.lock") || lower.endsWith(".lock")) {
    return repoWatch_exports.yarnLock.readYarnLock(content);
  }
  const npm = repoWatch_exports.npmLock.readNpmLock(content);
  if (npm !== null) return npm;
  const pnpm = repoWatch_exports.pnpmLock.readPnpmLock(content);
  if (pnpm !== null) return pnpm;
  return repoWatch_exports.yarnLock.readYarnLock(content);
}

// apps/watch/src/outside/repo/action/collect.ts
var REPO_LIST_VERSION = 1;
var ACTION_LOCKFILES_MAX = 20;
var ACTION_PACKAGES_MAX = 5e4;
function lockfilePathsOf(input) {
  const named = (input ?? "").split(/[\s,]+/).filter((s) => s !== "");
  const paths = named.length > 0 ? named : [...DEFAULT_LOCKFILE_PATHS];
  const names = DEFAULT_LOCKFILE_PATHS;
  for (const p of paths) {
    const parts = p.split("/");
    if (p.length > 200 || p.startsWith("/") || p.includes("\\") || parts.some((part) => part === "" || part === "." || part === "..")) return null;
    if (!names.includes(parts[parts.length - 1])) return null;
  }
  return [...new Set(paths)];
}
function collectRepoList(repo, commit, paths, read) {
  if (paths.length > ACTION_LOCKFILES_MAX) return { ok: false, problem: "too_many_lockfiles" };
  const lockfiles = [];
  const missing = [];
  let total = 0;
  for (const path of paths) {
    const text = read(path);
    if (text === null) {
      missing.push(path);
      continue;
    }
    const entries = parseLockfile(path, text);
    if (entries === null) return { ok: false, problem: "unreadable", path };
    const kept = /* @__PURE__ */ new Map();
    for (const e of entries) kept.set(`${e.name}@${e.version}`, { name: e.name, version: e.version });
    total += kept.size;
    if (total > ACTION_PACKAGES_MAX) return { ok: false, problem: "too_many_packages" };
    lockfiles.push({ path, packages: [...kept.values()] });
  }
  if (lockfiles.length === 0) return { ok: false, problem: "no_lockfile" };
  return { ok: true, body: { version: REPO_LIST_VERSION, repo, commit, lockfiles }, packages: total, missing };
}

// apps/watch/src/outside/repo/action/main.ts
var ACTION_LINES = {
  "RA-01": "Sent {packages} packages from {files} lockfiles at commit {commit}.",
  "RA-02": "Not on the default branch, so nothing was sent. Only the default branch is watched.",
  "RA-03": "No lockfile found. Looked for: {paths}.",
  "RA-04": "Could not read {path} as a lockfile, so nothing was sent.",
  "RA-05": "The inputs key and site are both required, and site must be an https address.",
  "RA-06": "The lockfiles input must name package-lock.json, pnpm-lock.yaml or yarn.lock files inside the repository.",
  "RA-07": "Too many lockfiles or packages to send (at most 20 files and 50,000 packages).",
  "RA-08": "The site refused the list ({status} {code}). Check that the key is a live repository key and that this repository is listed on your Account page.",
  "RA-09": "Could not reach the site, so nothing was sent. The next run will try again.",
  "RA-10": "Not found, so not sent: {paths}."
};
var fill = (line, slots) => line.replace(/\{([a-z]+)\}/g, (m, k) => k in slots ? String(slots[k]) : m);
function siteOriginOf(input) {
  if (!input) return null;
  try {
    const u = new URL(input.trim());
    if (u.protocol !== "https:" || u.username !== "" || u.password !== "" || u.search !== "" || u.hash !== "") return null;
    if (u.pathname !== "/" && u.pathname !== "") return null;
    return u.origin;
  } catch {
    return null;
  }
}
function onDefaultBranch(env, readFile2) {
  if (env.GITHUB_EVENT_NAME === "schedule") return true;
  if (env.GITHUB_REF_TYPE !== void 0 && env.GITHUB_REF_TYPE !== "branch") return false;
  const eventPath2 = env.GITHUB_EVENT_PATH;
  let defaultBranch;
  if (eventPath2) {
    try {
      defaultBranch = JSON.parse(readFile2(eventPath2) ?? "null")?.repository?.default_branch;
    } catch {
      defaultBranch = void 0;
    }
  }
  return typeof defaultBranch !== "string" || defaultBranch === env.GITHUB_REF_NAME;
}
async function runAction(env, deps) {
  const key = (env.INPUT_KEY ?? "").trim();
  const origin = siteOriginOf(env.INPUT_SITE);
  const repo = env.GITHUB_REPOSITORY ?? "";
  const commit = env.GITHUB_SHA ?? "";
  if (key === "" || origin === null) {
    deps.log(ACTION_LINES["RA-05"]);
    return 1;
  }
  if (!onDefaultBranch(env, deps.readFile)) {
    deps.log(ACTION_LINES["RA-02"]);
    return 0;
  }
  const paths = lockfilePathsOf(env.INPUT_LOCKFILES);
  if (paths === null) {
    deps.log(ACTION_LINES["RA-06"]);
    return 1;
  }
  const got = collectRepoList(repo, commit, paths, deps.readFile);
  if (!got.ok) {
    if (got.problem === "no_lockfile") deps.log(fill(ACTION_LINES["RA-03"], { paths: paths.join(", ") }));
    else if (got.problem === "unreadable") deps.log(fill(ACTION_LINES["RA-04"], { path: got.path ?? "" }));
    else deps.log(ACTION_LINES["RA-07"]);
    return 1;
  }
  const body = JSON.stringify(got.body);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt > 0) await deps.sleep(5e3);
    let res;
    try {
      res = await deps.fetch(`${origin}/api/billing/outside/repo-list`, {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json", accept: "application/json" },
        body
      });
    } catch {
      continue;
    }
    if (res.status === 200) {
      if (got.missing.length > 0) deps.log(fill(ACTION_LINES["RA-10"], { paths: got.missing.join(", ") }));
      deps.log(fill(ACTION_LINES["RA-01"], { packages: got.packages, files: got.body.lockfiles.length, commit: commit.slice(0, 7) }));
      return 0;
    }
    if (res.status === 429 || res.status >= 500) continue;
    let code = "";
    try {
      const answer = await res.json();
      code = typeof answer?.error === "string" ? answer.error.replace(/[^a-z_]/g, "").slice(0, 40) : "";
    } catch {
      code = "";
    }
    deps.log(fill(ACTION_LINES["RA-08"], { status: res.status, code }));
    return 1;
  }
  deps.log(ACTION_LINES["RA-09"]);
  return 1;
}

// apps/watch/src/outside/repo/action/entry.ts
var workspace = process.env.GITHUB_WORKSPACE ?? process.cwd();
var eventPath = process.env.GITHUB_EVENT_PATH;
function readFile(path) {
  try {
    return (0, import_node_fs.readFileSync)(path === eventPath ? path : (0, import_node_path.join)(workspace, path), "utf8");
  } catch {
    return null;
  }
}
void runAction(process.env, {
  readFile,
  fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(3e4) }),
  log: (line) => console.log(line),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms))
}).then(
  (code) => {
    process.exitCode = code;
  },
  () => {
    process.exitCode = 1;
  }
);
