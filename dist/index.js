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
  OSV_PYPI: () => OSV_PYPI,
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
var OSV_PYPI = "PyPI";
var OSV_BATCH_MAX = 1e3;
var OSV_ENTRIES_MAX = 2e4;
var OSV_SEEN_MAX = 2e4;
var OSV_RECORDS_PER_ENTRY_MAX = 1e3;
var PACKAGE_NAME_PATTERN = /^(@[A-Za-z0-9~-][A-Za-z0-9._~-]*\/)?[A-Za-z0-9~-][A-Za-z0-9._~-]*$/;
var SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
var PYPI_VERSION_PATTERN = /^(?:[0-9]+!)?(?:0|[1-9][0-9]*)(?:\.(?:0|[1-9][0-9]*))*(?:[._-]?[A-Za-z]+[._-]?[0-9]*)*(?:\+[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*)?$/;
var PYPI_VERSION_MAX = 64;
function versionOk(version, ecosystem) {
  if (ecosystem === OSV_PYPI) return version.length >= 1 && version.length <= PYPI_VERSION_MAX && PYPI_VERSION_PATTERN.test(version);
  return version.length >= 1 && version.length <= 256 && SEMVER_PATTERN.test(version);
}
function anyVersionOk(version) {
  return versionOk(version, OSV_ECOSYSTEM) || versionOk(version, OSV_PYPI);
}
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
  if (!anyVersionOk(version)) {
    return false;
  }
  const record = key.slice(spaceIdx + 1);
  if (record.length < 1 || record.length > 128 || !RECORD_ID_PATTERN.test(record)) {
    return false;
  }
  return true;
}
function osvBatches(entries, ecosystem = OSV_ECOSYSTEM) {
  try {
    if (ecosystem !== OSV_ECOSYSTEM && ecosystem !== OSV_PYPI) {
      return null;
    }
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
      if (!versionOk(version, ecosystem)) {
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
          package: { name: slice[j].name, ecosystem },
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
    let ecosystem = null;
    for (let i = 0; i < queries.length; i++) {
      const q = queries[i];
      if (!isPlainRecord(q)) return null;
      if (!isPlainRecord(q.package)) return null;
      const pkgName = q.package.name;
      const pkgEco = q.package.ecosystem;
      if (typeof pkgName !== "string" || pkgName.length < 1 || pkgName.length > 214 || !PACKAGE_NAME_PATTERN.test(pkgName)) {
        return null;
      }
      if (pkgEco !== OSV_ECOSYSTEM && pkgEco !== OSV_PYPI) {
        return null;
      }
      if (ecosystem === null) {
        ecosystem = pkgEco;
      } else if (pkgEco !== ecosystem) {
        return null;
      }
      if (typeof q.version !== "string" || !versionOk(q.version, ecosystem)) {
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
          package: { name: q2.package.name, ecosystem: q2.package.ecosystem },
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
      if (typeof version !== "string" || !anyVersionOk(version)) {
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

// packages/core/src/supplyChain/index.ts
var supplyChain_exports = {};
__export(supplyChain_exports, {
  CALL_HOME_HOSTS: () => CALL_HOME_HOSTS,
  DEPS_DEV_BATCH_MAX: () => DEPS_DEV_BATCH_MAX,
  DEPS_DEV_BATCH_PATH: () => DEPS_DEV_BATCH_PATH,
  DEPS_DEV_HOST: () => DEPS_DEV_HOST,
  DEPS_DEV_YOUNG_MS: () => DEPS_DEV_YOUNG_MS,
  DIRECT_DEPS_MAX: () => DIRECT_DEPS_MAX,
  DOCKER_HUB_REGISTRY: () => DOCKER_HUB_REGISTRY,
  FIRST_PARTY_OWNERS: () => FIRST_PARTY_OWNERS,
  FULL_SHA: () => FULL_SHA,
  IMAGE_FILE_MAX_BYTES: () => IMAGE_FILE_MAX_BYTES,
  KNOWN_BAD_IMAGES: () => KNOWN_BAD_IMAGES,
  KNOWN_COMPROMISED_ACTIONS: () => KNOWN_COMPROMISED_ACTIONS,
  MCP_MAX_BYTES: () => MCP_MAX_BYTES,
  MCP_MAX_SERVERS: () => MCP_MAX_SERVERS,
  OSV_ACTIONS_ECOSYSTEM: () => OSV_ACTIONS_ECOSYSTEM,
  PROJECT_ADVISORIES_MAX: () => PROJECT_ADVISORIES_MAX,
  PROJECT_ADVISORY_PACKAGES_MAX: () => PROJECT_ADVISORY_PACKAGES_MAX,
  STARTUP_FILE_PATHS: () => STARTUP_FILE_PATHS,
  STARTUP_HOOKS_DIR: () => STARTUP_HOOKS_DIR,
  STARTUP_HOOKS_MAX: () => STARTUP_HOOKS_MAX,
  STARTUP_MAX_BYTES: () => STARTUP_MAX_BYTES,
  STARTUP_MAX_COMMANDS: () => STARTUP_MAX_COMMANDS,
  STARTUP_TRACKED_RE: () => STARTUP_TRACKED_RE,
  WORKFLOW_MAX_BYTES: () => WORKFLOW_MAX_BYTES,
  WORKSPACE_PATTERNS_MAX: () => WORKSPACE_PATTERNS_MAX,
  actionRefAffected: () => actionRefAffected,
  depsDevBatchBody: () => depsDevBatchBody,
  depsDevVersionUrl: () => depsDevVersionUrl,
  directDependencyNames: () => directDependencyNames,
  dockerHubTagPath: () => dockerHubTagPath,
  downloadsAndRuns: () => downloadsAndRuns,
  findKnownBadImage: () => findKnownBadImage,
  holdsVariable: () => holdsVariable,
  imageFileSource: () => imageFileSource,
  imageLabel: () => imageLabel,
  inVulnerableRange: () => inVulnerableRange,
  isReleaseTag: () => isReleaseTag,
  isYoung: () => isYoung,
  knownBadDigest: () => knownBadDigest,
  listedDirs: () => listedDirs,
  lockfileDir: () => lockfileDir,
  manifestVersion: () => manifestVersion,
  matchProjectAdvisories: () => matchProjectAdvisories,
  npmRepoOfDoc: () => npmRepoOfDoc,
  osvActionPackageQueries: () => osvActionPackageQueries,
  osvActionQueries: () => osvActionQueries,
  parseImageRef: () => parseImageRef,
  pnpmWorkspacePatterns: () => pnpmWorkspacePatterns,
  readActionRef: () => readActionRef,
  readDepsDevBatch: () => readDepsDevBatch,
  readDepsDevVersion: () => readDepsDevVersion,
  readDockerHubTag: () => readDockerHubTag,
  readImages: () => readImages,
  readMcpConfig: () => readMcpConfig,
  readOsvActionAnswer: () => readOsvActionAnswer,
  readOsvPackageAnswer: () => readOsvPackageAnswer,
  readProjectAdvisories: () => readProjectAdvisories,
  readStartupFile: () => readStartupFile,
  readWorkflow: () => readWorkflow,
  readWorkflowPosture: () => readWorkflowPosture,
  runnerPackage: () => runnerPackage,
  secretTriggers: () => secretTriggers,
  shortDigest: () => shortDigest,
  splitNpmSpec: () => splitNpmSpec,
  splitPySpec: () => splitPySpec,
  startupToolOf: () => startupToolOf,
  stripJsonc: () => stripJsonc,
  workspacePatterns: () => workspacePatterns
});

// packages/core/src/supplyChain/workflows.ts
var FIRST_PARTY_OWNERS = ["actions", "github"];
var FULL_SHA = /^[0-9a-f]{40}$/;
var WORKFLOW_MAX_BYTES = 512 * 1024;
var OSV_ACTIONS_ECOSYSTEM = "GitHub Actions";
var KNOWN_COMPROMISED_ACTIONS = [
  { action: "tj-actions/changed-files", advisory: "CVE-2025-30066", what: "its tags were moved to code that printed the workflow's secrets into the build log (March 2025)." },
  { action: "reviewdog/action-setup", advisory: "CVE-2025-30154", what: "its v1 tag was moved to code that printed the workflow's secrets into the build log (March 2025)." }
];
var USES_LINE = /^\s*(?:-\s+)?uses\s*:\s*(.+?)\s*$/;
var OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
var REPO = /^[A-Za-z0-9._-]{1,100}$/;
var HEAD_REF = /github\.event\.pull_request\.head\.(?:sha|ref)|github\.head_ref|github\.event\.workflow_run\.head_(?:sha|branch)|refs\/pull\/[^\s'"]*\/(?:head|merge)/;
function stripComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === "#" && (i === 0 || /\s/.test(line[i - 1]))) {
      return line.slice(0, i);
    }
  }
  return line;
}
function unquote(v) {
  const t = v.trim();
  if (t.length >= 2 && (t[0] === '"' || t[0] === "'") && t[t.length - 1] === t[0]) return t.slice(1, -1).trim();
  return t;
}
function readActionRef(value, line = 0) {
  const uses = unquote(value);
  if (uses === "" || uses.startsWith("./") || uses.startsWith("../") || uses.startsWith("docker://")) return null;
  const at = uses.indexOf("@");
  const target = at === -1 ? uses : uses.slice(0, at);
  const ref = at === -1 ? "" : uses.slice(at + 1);
  const parts = target.split("/");
  if (parts.length < 2) return null;
  const owner = parts[0];
  const repo = parts[1];
  if (!OWNER.test(owner) || !REPO.test(repo) || repo === "." || repo === "..") return null;
  const firstParty = FIRST_PARTY_OWNERS.includes(owner.toLowerCase());
  return { line, uses, owner, repo, action: `${owner}/${repo}`.toLowerCase(), ref, pinned: FULL_SHA.test(ref), firstParty };
}
function secretTriggers(text) {
  const out = [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  let inJobs = false;
  for (const raw of lines) {
    const line = stripComment(raw);
    if (/^jobs\s*:/.test(line)) inJobs = true;
    if (inJobs) continue;
    for (const t of ["pull_request_target", "workflow_run"]) {
      if (new RegExp(`(^|[\\s\\[,'"])${t}(?=$|[\\s\\],:'"])`).test(line) && !out.includes(t)) out.push(t);
    }
  }
  return out;
}
function readWorkflow(text, compromised = KNOWN_COMPROMISED_ACTIONS) {
  if (typeof text !== "string" || text.length > WORKFLOW_MAX_BYTES) return null;
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  if (!lines.some((l) => /^jobs\s*:/.test(stripComment(l)))) return null;
  const uses = [];
  const findings = [];
  const triggers = secretTriggers(text);
  let headRefFound = false;
  lines.forEach((raw, i) => {
    const line = stripComment(raw);
    const m = USES_LINE.exec(line);
    if (m) {
      const use = readActionRef(m[1], i + 1);
      if (use) {
        uses.push(use);
        const bad = compromised.find((c) => c.action === use.action);
        if (bad && !use.pinned) {
          findings.push({ kind: "KNOWN_COMPROMISED_ACTION", line: use.line, subject: use.action, detail: use.ref, advisory: bad.advisory });
        } else if (!use.pinned && !use.firstParty) {
          findings.push({ kind: "UNPINNED_ACTION", line: use.line, subject: use.action, detail: use.ref });
        }
      }
    }
    if (triggers.length > 0 && !headRefFound) {
      const r = /^\s*(?:-\s+)?ref\s*:\s*(.+?)\s*$/.exec(line);
      if (r && HEAD_REF.test(r[1])) {
        headRefFound = true;
        findings.push({ kind: "PRT_CHECKOUT_HEAD", line: i + 1, subject: triggers[0], detail: unquote(r[1]) });
      }
    }
  });
  return { uses, findings };
}
var CALL_HOME_HOSTS = ["webhook.site", "oast.fun", "oast.live", "oast.me", "oast.pro", "oast.site"];
var STORED_KEY_NAMES = {
  "aws-access-key-id": "aws",
  "aws-secret-access-key": "aws",
  aws_access_key_id: "aws",
  aws_secret_access_key: "aws",
  creds: "azure",
  azure_client_secret: "azure",
  azure_credentials: "azure",
  credentials_json: "google",
  service_account_key: "google",
  google_credentials: "google"
};
var KEY_VALUE_LINE = /^\s*(?:-\s+)?([A-Za-z_][A-Za-z0-9_-]{0,63})\s*:\s*(.+?)\s*$/;
var FROM_SECRETS = /\bsecrets\s*\.\s*[A-Za-z_]/;
function hostPattern(host) {
  const h = host.replace(/[.]/g, "\\.");
  return new RegExp(`(?<![a-z0-9-])${h}(?![a-z0-9-]|\\.[a-z0-9])`);
}
var CALL_HOME_PATTERNS = CALL_HOME_HOSTS.map((host) => ({ host, re: hostPattern(host) }));
function readWorkflowPosture(text) {
  if (typeof text !== "string" || text.length > WORKFLOW_MAX_BYTES) return null;
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  if (!lines.some((l) => /^jobs\s*:/.test(stripComment(l)))) return null;
  const findings = [];
  const hostsSeen = /* @__PURE__ */ new Set();
  const cloudsSeen = /* @__PURE__ */ new Set();
  lines.forEach((raw, i) => {
    const line = stripComment(raw);
    const lower = line.toLowerCase();
    for (const { host, re } of CALL_HOME_PATTERNS) {
      if (hostsSeen.has(host) || !re.test(lower)) continue;
      hostsSeen.add(host);
      findings.push({ kind: "CALL_HOME_HOST", line: i + 1, subject: host, detail: "" });
    }
    const kv = KEY_VALUE_LINE.exec(line);
    if (kv) {
      const name = kv[1];
      const cloud = Object.prototype.hasOwnProperty.call(STORED_KEY_NAMES, name.toLowerCase()) ? STORED_KEY_NAMES[name.toLowerCase()] : null;
      if (cloud !== null && !cloudsSeen.has(cloud) && FROM_SECRETS.test(kv[2])) {
        cloudsSeen.add(cloud);
        findings.push({ kind: "STORED_CLOUD_KEY", line: i + 1, subject: cloud, detail: name });
      }
    }
  });
  return findings;
}
function osvActionQueries(uses, max = 200) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const u of uses) {
    if (u.pinned || u.firstParty || u.ref === "" || !/^v?\d+(?:\.\d+){0,2}$/.test(u.ref)) continue;
    for (const version of [u.ref, u.ref.replace(/^v/, "")]) {
      const k = `${u.action}@${version}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ package: { name: u.action, ecosystem: OSV_ACTIONS_ECOSYSTEM }, version });
      if (out.length >= max) return out;
    }
  }
  return out;
}
function osvActionPackageQueries(uses, max = 100) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const u of uses) {
    if (u.pinned || u.firstParty || !/^v?\d+(?:\.\d+){0,2}$/.test(u.ref) || seen.has(u.action)) continue;
    seen.add(u.action);
    out.push({ package: { name: u.action, ecosystem: OSV_ACTIONS_ECOSYSTEM } });
    if (out.length >= max) break;
  }
  return out;
}
function readOsvPackageAnswer(body, queries) {
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.results)) return null;
  const results = parsed.results;
  if (results.length !== queries.length) return null;
  return results.map((r, i) => {
    const vulns = r && typeof r === "object" ? r.vulns : void 0;
    const records = (Array.isArray(vulns) ? vulns : []).map((v) => v && typeof v === "object" ? v.id : void 0).filter((id) => typeof id === "string" && /^[A-Za-z0-9._:-]{1,128}$/.test(id));
    return { action: queries[i].package.name, records: [...new Set(records)] };
  });
}
function tagNumbers(v) {
  const m = /^v?(\d+(?:\.\d+){0,2})$/.exec(v.trim());
  return m ? m[1].split(".").map(Number) : null;
}
function compareTags(a, b) {
  for (let i = 0; i < 3; i += 1) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}
function actionRefAffected(record, action, ref) {
  const at = tagNumbers(ref);
  if (!at || !record || typeof record !== "object") return false;
  const rec = record;
  if (typeof rec.withdrawn === "string" && rec.withdrawn !== "") return false;
  for (const a of Array.isArray(rec.affected) ? rec.affected : []) {
    const pkg = a && typeof a === "object" ? a.package : void 0;
    if (pkg?.ecosystem !== OSV_ACTIONS_ECOSYSTEM || String(pkg?.name ?? "").toLowerCase() !== action.toLowerCase()) continue;
    const versions = a.versions;
    for (const v of Array.isArray(versions) ? versions : []) {
      const n = typeof v === "string" ? tagNumbers(v) : null;
      if (n && compareTags(n, at) === 0) return true;
    }
    const ranges = a.ranges;
    for (const r of Array.isArray(ranges) ? ranges : []) {
      const type = r && typeof r === "object" ? r.type : void 0;
      if (type !== "ECOSYSTEM" && type !== "SEMVER") continue;
      let inside = false;
      for (const e of Array.isArray(r.events) ? r.events : []) {
        if (!e || typeof e !== "object") continue;
        const ev = e;
        if (typeof ev.introduced === "string") {
          const n = ev.introduced === "0" ? [0] : tagNumbers(ev.introduced);
          if (n && compareTags(at, n) >= 0) inside = true;
        } else if (typeof ev.fixed === "string") {
          const n = tagNumbers(ev.fixed);
          if (n && inside && compareTags(at, n) < 0) return true;
          if (n && compareTags(at, n) >= 0) inside = false;
        } else if (typeof ev.last_affected === "string") {
          const n = tagNumbers(ev.last_affected);
          if (n && inside && compareTags(at, n) <= 0) return true;
          if (n && compareTags(at, n) > 0) inside = false;
        }
      }
      if (inside) return true;
    }
  }
  return false;
}
function readOsvActionAnswer(body, queries) {
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.results)) return null;
  const results = parsed.results;
  if (results.length !== queries.length) return null;
  const out = [];
  results.forEach((r, i) => {
    const vulns = r && typeof r === "object" ? r.vulns : void 0;
    if (!Array.isArray(vulns)) return;
    const records = vulns.map((v) => v && typeof v === "object" ? v.id : void 0).filter((id) => typeof id === "string" && /^[A-Za-z0-9._:-]{1,128}$/.test(id));
    if (records.length > 0) out.push({ action: queries[i].package.name, version: queries[i].version, records });
  });
  return out;
}

// packages/core/src/supplyChain/mcpConfig.ts
var MCP_MAX_BYTES = 256 * 1024;
var MCP_MAX_SERVERS = 200;
var NPM_RUNNERS = /* @__PURE__ */ new Set(["npx", "bunx"]);
var NPM_NAME = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;
var PY_NAME = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/;
var SECRET_NAME = /(key|token|secret|passw(or)?d|private|credential|mnemonic|seed|auth)/i;
var SECRET_SHAPES = [
  /^sk-[A-Za-z0-9_-]{16,}$/,
  /^gh[pousr]_[A-Za-z0-9]{20,}$/,
  /^github_pat_[A-Za-z0-9_]{20,}$/,
  /^xox[abprs]-[A-Za-z0-9-]{10,}$/,
  /^AKIA[0-9A-Z]{16}$/,
  /^(0x)?[0-9a-fA-F]{64}$/
];
var LOCAL_HOSTS = /* @__PURE__ */ new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
function isPlaceholder(v) {
  const t = v.trim();
  return t === "" || /^\$\{[^}]*\}$/.test(t) || /^\$[A-Z_][A-Z0-9_]*$/.test(t) || /^<[^>]*>$/.test(t) || /^(your|my|xxx|changeme|replace)/i.test(t) || /^[x*.]+$/i.test(t);
}
function looksSecret(name, value) {
  if (isPlaceholder(value)) return false;
  if (SECRET_SHAPES.some((r) => r.test(value.trim()))) return true;
  return SECRET_NAME.test(name) && value.trim().length >= 12 && !/\s/.test(value.trim());
}
function splitNpmSpec(spec) {
  const at = spec.lastIndexOf("@");
  const name = at > 0 ? spec.slice(0, at) : spec;
  const version = at > 0 ? spec.slice(at + 1) : null;
  if (!NPM_NAME.test(name.toLowerCase()) || name.length > 214) return null;
  return { name: name.toLowerCase(), version: version === "" ? null : version };
}
function splitPySpec(spec) {
  const m = /^([A-Za-z0-9][A-Za-z0-9._-]*)(?:\[[^\]]*\])?(?:==([A-Za-z0-9.!+_-]+))?$/.exec(spec);
  if (!m || !PY_NAME.test(m[1])) return null;
  return { name: m[1].toLowerCase().replace(/[-_.]+/g, "-"), version: m[2] ?? null };
}
function runnerPackage(command, args) {
  const cmd = (command.split(/[\\/]/).pop() ?? "").toLowerCase().replace(/\.(cmd|exe)$/, "");
  let rest = [...args];
  let ecosystem = null;
  if (NPM_RUNNERS.has(cmd)) ecosystem = "npm";
  else if ((cmd === "pnpm" || cmd === "yarn") && rest[0] === "dlx") {
    ecosystem = "npm";
    rest = rest.slice(1);
  } else if (cmd === "uvx") ecosystem = "PyPI";
  else if (cmd === "pipx" && rest[0] === "run") {
    ecosystem = "PyPI";
    rest = rest.slice(1);
  }
  if (!ecosystem) return null;
  for (let i = 0; i < rest.length - 1; i++) {
    if (rest[i] === "--from" || rest[i] === "--package" || rest[i] === "-p" || rest[i] === "--spec") {
      const s2 = ecosystem === "npm" ? splitNpmSpec(rest[i + 1]) : splitPySpec(rest[i + 1]);
      return s2 ? { ecosystem, ...s2 } : null;
    }
  }
  const first = rest.find((a) => !a.startsWith("-"));
  if (!first) return null;
  const s = ecosystem === "npm" ? splitNpmSpec(first) : splitPySpec(first);
  return s ? { ecosystem, ...s } : null;
}
function strings(v) {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
}
function hostOf(url) {
  try {
    const u = new URL(url);
    return { protocol: u.protocol, host: u.hostname.toLowerCase() };
  } catch {
    return null;
  }
}
function readMcpConfig(text) {
  if (typeof text !== "string" || text.length > MCP_MAX_BYTES) return null;
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const root = parsed;
  const table = root.mcpServers ?? root.servers;
  if (!table || typeof table !== "object" || Array.isArray(table)) return null;
  const findings = [];
  const packages = [];
  const entries = Object.entries(table).slice(0, MCP_MAX_SERVERS);
  for (const [rawName, cfg] of entries) {
    const server = rawName.slice(0, 100);
    if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) continue;
    const c = cfg;
    const command = typeof c.command === "string" ? c.command : "";
    const args = strings(c.args);
    const url = typeof c.url === "string" ? c.url : typeof c.serverUrl === "string" ? c.serverUrl : "";
    if (command) {
      const pkg = runnerPackage(command, args);
      if (pkg) {
        packages.push({ server, ...pkg });
        if (pkg.version === null || pkg.version === "latest") findings.push({ kind: "MCP_UNPINNED_PACKAGE", server, subject: pkg.name });
      }
      const shell = (command.split(/[\\/]/).pop() ?? "").toLowerCase().replace(/\.exe$/, "");
      const joined = args.join(" ");
      if (["sh", "bash", "zsh", "powershell", "pwsh", "cmd"].includes(shell) && /\b(curl|wget|iwr|invoke-webrequest|irm|invoke-restmethod)\b/i.test(joined) && /(\|\s*(sh|bash|iex|invoke-expression)\b|\biex\b)/i.test(joined)) {
        findings.push({ kind: "MCP_SHELL_DOWNLOAD", server, subject: shell });
      }
    }
    if (url) {
      const h = hostOf(url);
      if (h) {
        if (h.protocol === "http:" && !LOCAL_HOSTS.has(h.host)) findings.push({ kind: "MCP_PLAIN_HTTP", server, subject: h.host });
        if (!LOCAL_HOSTS.has(h.host)) findings.push({ kind: "MCP_REMOTE_SERVER", server, subject: h.host });
      }
    }
    for (const field of ["env", "headers"]) {
      const obj = c[field];
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) continue;
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === "string" && looksSecret(k, v.replace(/^Bearer\s+/i, ""))) findings.push({ kind: "MCP_INLINE_SECRET", server, subject: `${field}.${k}`.slice(0, 120) });
      }
    }
    args.forEach((a, i) => {
      if (SECRET_SHAPES.some((r) => r.test(a.trim()))) findings.push({ kind: "MCP_INLINE_SECRET", server, subject: `args[${i}]` });
    });
  }
  return { servers: entries.length, findings, packages };
}

// packages/core/src/supplyChain/depsDev.ts
var DEPS_DEV_HOST = "api.deps.dev";
var DEPS_DEV_BATCH_PATH = "/v3alpha/versionbatch";
var DEPS_DEV_BATCH_MAX = 1e3;
var DEPS_DEV_YOUNG_MS = 48 * 60 * 60 * 1e3;
function depsDevVersionUrl(host, key) {
  return ["https", "://"].join("") + `${host}/v3/systems/${key.system.toLowerCase()}/packages/${encodeURIComponent(key.name)}/versions/${encodeURIComponent(key.version)}`;
}
function depsDevBatchBody(keys) {
  const seen = /* @__PURE__ */ new Set();
  const requests = [];
  for (const k of keys) {
    const id = `${k.system}|${k.name}|${k.version}`;
    if (seen.has(id)) continue;
    seen.add(id);
    requests.push({ versionKey: { system: k.system, name: k.name, version: k.version } });
    if (requests.length >= DEPS_DEV_BATCH_MAX) break;
  }
  return { requests };
}
function isObj(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function readVersionObject(v, fallback) {
  if (!isObj(v)) return null;
  const vk = isObj(v.versionKey) ? v.versionKey : null;
  const key = vk && typeof vk.name === "string" && typeof vk.version === "string" && typeof vk.system === "string" ? { system: vk.system.toUpperCase(), name: vk.name, version: vk.version } : fallback ?? null;
  if (!key) return null;
  const publishedAt2 = typeof v.publishedAt === "string" && !Number.isNaN(Date.parse(v.publishedAt)) ? v.publishedAt : null;
  const advisories = Array.isArray(v.advisoryKeys) ? v.advisoryKeys.map((a) => isObj(a) && typeof a.id === "string" ? a.id : null).filter((x) => x !== null && /^[A-Za-z0-9._:-]{1,128}$/.test(x)) : [];
  return { key, publishedAt: publishedAt2, advisories, deprecated: v.isDeprecated === true };
}
function readDepsDevVersion(body) {
  try {
    return readVersionObject(JSON.parse(body));
  } catch {
    return null;
  }
}
function readDepsDevBatch(body) {
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }
  if (!isObj(parsed) || !Array.isArray(parsed.responses)) return null;
  const out = [];
  for (const r of parsed.responses) {
    if (!isObj(r)) continue;
    const req = isObj(r.request) && isObj(r.request.versionKey) ? r.request.versionKey : null;
    const fallback = req && typeof req.name === "string" && typeof req.version === "string" && typeof req.system === "string" ? { system: req.system.toUpperCase(), name: req.name, version: req.version } : void 0;
    const v = readVersionObject(r.version, fallback);
    if (v) out.push(v);
  }
  return out;
}
function isYoung(publishedAt2, nowMs, limitMs = DEPS_DEV_YOUNG_MS) {
  if (!publishedAt2) return false;
  const t = Date.parse(publishedAt2);
  if (Number.isNaN(t) || t > nowMs) return false;
  return nowMs - t < limitMs;
}

// packages/core/src/supplyChain/images.ts
var IMAGE_FILE_MAX_BYTES = 512 * 1024;
var DOCKER_HUB_REGISTRY = "docker.io";
var DIGEST = /^sha256:[0-9a-f]{64}$/;
var COMPONENT = /^[a-z0-9]+(?:(?:[._]|__|-+)[a-z0-9]+)*$/;
var TAG = /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$/;
var HUB_ALIASES = /* @__PURE__ */ new Set(["docker.io", "index.docker.io", "registry-1.docker.io", "registry.hub.docker.com"]);
function imageFileSource(path) {
  if (typeof path !== "string" || path === "") return null;
  const parts = path.split("/");
  const base = parts[parts.length - 1];
  if (/^\.github\/workflows\/[^/]+\.ya?ml$/i.test(path)) return "workflow";
  if (/^(?:docker-)?compose(?:\.[A-Za-z0-9_.-]+)?\.ya?ml$/i.test(base)) return "compose";
  if (/^(?:Dockerfile|Containerfile)(?:\.[A-Za-z0-9_.-]+)?$/.test(base) || /^[A-Za-z0-9_.-]+\.Dockerfile$/.test(base)) return "dockerfile";
  return null;
}
function stripComment2(line) {
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === "#" && (i === 0 || /\s/.test(line[i - 1]))) {
      return line.slice(0, i);
    }
  }
  return line;
}
function unquote2(v) {
  const t = v.trim();
  if (t.length >= 2 && (t[0] === '"' || t[0] === "'") && t[t.length - 1] === t[0]) return t.slice(1, -1).trim();
  return t;
}
function holdsVariable(v) {
  return v.includes("$");
}
function parseImageRef(value) {
  if (typeof value !== "string") return null;
  let raw = unquote2(value);
  if (raw.startsWith("docker://")) raw = raw.slice("docker://".length);
  if (raw === "" || raw.length > 512 || /\s/.test(raw) || holdsVariable(raw)) return null;
  let rest = raw;
  let digest = null;
  const at = rest.indexOf("@");
  if (at !== -1) {
    digest = rest.slice(at + 1);
    rest = rest.slice(0, at);
    if (!DIGEST.test(digest)) return null;
  }
  const slash = rest.lastIndexOf("/");
  const colon = rest.lastIndexOf(":");
  let tag = null;
  if (colon > slash) {
    tag = rest.slice(colon + 1);
    rest = rest.slice(0, colon);
    if (!TAG.test(tag)) return null;
  }
  const parts = rest.split("/");
  let registry = DOCKER_HUB_REGISTRY;
  if (parts.length > 1 && (parts[0].includes(".") || parts[0].includes(":") || parts[0] === "localhost")) {
    registry = parts.shift().toLowerCase();
    if (HUB_ALIASES.has(registry)) registry = DOCKER_HUB_REGISTRY;
  }
  if (parts.length === 0 || parts.some((p) => !COMPONENT.test(p))) return null;
  const dockerHub = registry === DOCKER_HUB_REGISTRY;
  if (dockerHub && parts.length === 1) parts.unshift("library");
  const repository = parts.join("/");
  const implicitTag = tag === null && digest === null;
  return {
    raw,
    registry,
    repository,
    tag: implicitTag ? "latest" : tag,
    implicitTag,
    digest,
    pinned: digest !== null,
    dockerHub,
    name: `${registry}/${repository}`
  };
}
function imageLabel(ref) {
  const repo = ref.registry === DOCKER_HUB_REGISTRY ? ref.repository.replace(/^library\//, "") : `${ref.registry}/${ref.repository}`;
  return `${repo}${ref.tag !== null ? `:${ref.tag}` : ""}${ref.digest !== null ? `@${ref.digest}` : ""}`;
}
function isReleaseTag(tag) {
  return typeof tag === "string" && /^v?\d+\.\d+\.\d+(?:[-+._][A-Za-z0-9._-]+)?$/.test(tag);
}
var KEY_LINE = /^(\s*)(-\s+)?([A-Za-z0-9_.-]+)\s*:(?:\s+(.*?))?\s*$/;
function readYamlImages(text, source) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const stack = [];
  const found = [];
  lines.forEach((rawLine, i) => {
    const line = stripComment2(rawLine);
    if (line.trim() === "") return;
    const m = KEY_LINE.exec(line);
    if (!m) return;
    const indent = m[1].length + (m[2] ? m[2].length : 0);
    const key = m[3];
    const value = (m[4] ?? "").trim();
    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) stack.pop();
    const under = (k) => stack.some((f) => f.key === k);
    if (source === "compose") {
      if (key === "image" && value !== "") found.push({ line: i + 1, value });
    } else if (key === "image" && value !== "" && (under("container") || under("services"))) {
      found.push({ line: i + 1, value });
    } else if (key === "container" && value !== "") {
      if (value.startsWith("{")) {
        const flow = /(?:^|[{,\s])image\s*:\s*([^,}]+)/.exec(value);
        if (flow) found.push({ line: i + 1, value: flow[1].trim() });
      } else if (!/^[|>&*!]/.test(value)) {
        found.push({ line: i + 1, value });
      }
    } else if (key === "uses" && unquote2(value).startsWith("docker://")) {
      found.push({ line: i + 1, value });
    }
    stack.push({ indent, key });
  });
  return { uses: found };
}
function readDockerfileImages(text) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const stages = /* @__PURE__ */ new Set();
  const found = [];
  lines.forEach((line, i) => {
    const m = /^\s*FROM\s+(.+?)\s*$/i.exec(line);
    if (!m) return;
    const tokens = m[1].split(/\s+/).filter((t) => !t.startsWith("--"));
    const image = tokens[0];
    if (!image) return;
    if (tokens.length >= 3 && tokens[1].toLowerCase() === "as") stages.add(tokens[2].toLowerCase());
    const lower = image.toLowerCase();
    if (lower === "scratch" || stages.has(lower)) return;
    found.push({ line: i + 1, value: image });
  });
  return { uses: found };
}
function readImages(path, text) {
  const source = imageFileSource(path);
  if (source === null || typeof text !== "string" || text.length > IMAGE_FILE_MAX_BYTES) return null;
  const found = source === "dockerfile" ? readDockerfileImages(text) : readYamlImages(text, source);
  const uses = [];
  const unread = [];
  for (const f of found.uses) {
    const v = unquote2(f.value);
    if (holdsVariable(v)) {
      unread.push({ line: f.line, raw: v.slice(0, 200) });
      continue;
    }
    const ref = parseImageRef(v);
    if (ref) uses.push({ ...ref, line: f.line, source });
    else unread.push({ line: f.line, raw: v.slice(0, 200) });
  }
  return { source, uses, unread };
}
function dockerHubTagPath(ref) {
  if (!ref.dockerHub || ref.tag === null) return null;
  const parts = ref.repository.split("/");
  if (parts.length !== 2) return null;
  return `/v2/namespaces/${encodeURIComponent(parts[0])}/repositories/${encodeURIComponent(parts[1])}/tags/${encodeURIComponent(ref.tag)}`;
}
function readDockerHubTag(body) {
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed;
  let digest = o.digest;
  if (typeof digest !== "string" && Array.isArray(o.images) && o.images.length === 1) {
    digest = o.images[0]?.digest;
  }
  if (typeof digest !== "string" || !DIGEST.test(digest)) return null;
  return { digest, pushedAt: typeof o.tag_last_pushed === "string" ? o.tag_last_pushed : null };
}
var KICS = "docker.io/checkmarx/kics";
var KICS_ADVISORY = "Docker and Checkmarx";
var KNOWN_BAD_IMAGES = [
  { name: KICS, tags: ["alpine", "v2.1.20", "v2.1.21"], hexA: "2588a44890263a8185bd5d9fadb6bc92", hexB: "20b60245dbcbc4da35e1b62a6f8c230d", advisory: KICS_ADVISORY, date: "2026-04-22" },
  { name: KICS, tags: ["alpine", "v2.1.20", "v2.1.21"], hexA: "d186161ae8e33cd7702dd2a6c0337deb", hexB: "14e2b178542d232129c0da64b1af06e4", advisory: KICS_ADVISORY, date: "2026-04-22" },
  { name: KICS, tags: ["alpine", "v2.1.20", "v2.1.21"], hexA: "415610a42c5b51347709e315f5efb6ff", hexB: "fa588b6ebc1b95b24abf28088347791b", advisory: KICS_ADVISORY, date: "2026-04-22" },
  { name: KICS, tags: ["debian", "v2.1.20-debian", "v2.1.21-debian"], hexA: "222e6bfed0f3bb1937bf5e719a234287", hexB: "1ccd683ff1c0cb967c8e31ea58beaf7b", advisory: KICS_ADVISORY, date: "2026-04-22" },
  { name: KICS, tags: ["debian", "v2.1.20-debian", "v2.1.21-debian"], hexA: "a6871deb0480e1205c1daff10cedf4e6", hexB: "0ad951605fd1a4efaca0a9c54d56d1cb", advisory: KICS_ADVISORY, date: "2026-04-22" },
  { name: KICS, tags: ["debian", "v2.1.20-debian", "v2.1.21-debian"], hexA: "ff7b0f114f87c67402dfc2459bb3d895", hexB: "4dd88e537b0e459482c04cffa26c1f07", advisory: KICS_ADVISORY, date: "2026-04-22" },
  { name: KICS, tags: ["latest"], hexA: "a0d9366f6f0166dcbf92fcdc98e1a03d", hexB: "2e6210e8d7e8573f74d50849130651a0", advisory: KICS_ADVISORY, date: "2026-04-22" },
  { name: KICS, tags: ["latest"], hexA: "26e8e9c5e53c972997a278ca6e12708b", hexB: "8788b70575ca013fd30bfda34ab5f48f", advisory: KICS_ADVISORY, date: "2026-04-22" },
  { name: KICS, tags: ["latest"], hexA: "7391b531a07fccbbeaf59a488e1376cf", hexB: "e5b27aef757430a36d6d3a087c610322", advisory: KICS_ADVISORY, date: "2026-04-22" }
];
function knownBadDigest(e) {
  return /^[0-9a-f]{32}$/.test(e.hexA) && /^[0-9a-f]{32}$/.test(e.hexB) ? `sha256:${e.hexA}${e.hexB}` : null;
}
function findKnownBadImage(name, digest, list = KNOWN_BAD_IMAGES) {
  if (digest === null) return null;
  return list.find((e) => e.name === name && knownBadDigest(e) === digest) ?? null;
}
function shortDigest(digest) {
  return digest.startsWith("sha256:") ? `sha256:${digest.slice(7, 19)}` : digest.slice(0, 19);
}

// packages/core/src/supplyChain/startupFiles.ts
var STARTUP_FILE_PATHS = [".claude/settings.json", ".claude/settings.local.json", ".cursor/hooks.json", ".vscode/tasks.json", ".continue/config.yaml"];
var STARTUP_HOOKS_DIR = ".claude/hooks";
var STARTUP_HOOKS_MAX = 10;
var STARTUP_MAX_BYTES = 256 * 1024;
var STARTUP_MAX_COMMANDS = 100;
var STARTUP_TRACKED_RE = /(^|\/)\.claude\/(settings(\.local)?\.json$|hooks\/)|(^|\/)\.cursor\/hooks\.json$|(^|\/)\.vscode\/tasks\.json$|(^|\/)\.continue\/config\.yaml$/;
var DOWNLOADER = /\b(curl|wget|iwr|invoke-webrequest|irm|invoke-restmethod)\b/i;
var RUNS_IT = /(\|\s*(sudo\s+)?(sh|bash|zsh|dash|python3?|node|perl|ruby|iex|invoke-expression)\b|\biex\b|\binvoke-expression\b|\b(sh|bash|zsh)\s+(-c\s+)?["']?\$\(\s*(curl|wget)\b|\beval\s+["']?\$\(\s*(curl|wget)\b|<\(\s*(curl|wget)\b)/i;
function downloadsAndRuns(command) {
  return DOWNLOADER.test(command) && RUNS_IT.test(command);
}
function startupToolOf(path) {
  if (path === ".claude/settings.json" || path === ".claude/settings.local.json" || path.startsWith(`${STARTUP_HOOKS_DIR}/`)) return "Claude Code";
  if (path === ".cursor/hooks.json") return "Cursor";
  if (path === ".vscode/tasks.json") return "VS Code";
  if (path === ".continue/config.yaml") return "Continue";
  return null;
}
function strings2(v) {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
}
function label(s) {
  return s.replace(/[^A-Za-z0-9 ._:#-]/g, "").slice(0, 80) || "unnamed";
}
function stripJsonc(text) {
  let out = "";
  let i = 0;
  let inString = false;
  while (i < text.length) {
    const c = text[i];
    if (inString) {
      out += c;
      if (c === "\\" && i + 1 < text.length) {
        out += text[i + 1];
        i += 2;
        continue;
      }
      if (c === '"') inString = false;
      i += 1;
      continue;
    }
    if (c === '"') {
      inString = true;
      out += c;
      i += 1;
    } else if (c === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i += 1;
    } else if (c === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      i = end < 0 ? text.length : end + 2;
    } else {
      out += c;
      i += 1;
    }
  }
  return out.replace(/,(\s*[}\]])/g, "$1");
}
function parseJson(text, comments) {
  try {
    const v = JSON.parse(comments ? stripJsonc(text) : text);
    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}
function hookCommands(hooks, nested) {
  const out = [];
  if (!hooks || typeof hooks !== "object" || Array.isArray(hooks)) return out;
  for (const [event, list] of Object.entries(hooks)) {
    if (!Array.isArray(list)) continue;
    list.forEach((entry, i) => {
      if (!entry || typeof entry !== "object") return;
      const e = entry;
      const inner = nested ? Array.isArray(e.hooks) ? e.hooks : [] : [e];
      inner.forEach((h, j) => {
        if (!h || typeof h !== "object") return;
        const cmd = h.command;
        if (typeof cmd === "string" && cmd.trim() !== "") out.push({ where: label(`hook ${event} #${i + 1}${nested ? `.${j + 1}` : ""}`), sig: cmd });
      });
    });
  }
  return out;
}
var CLAUDE_HELPERS = ["apiKeyHelper", "awsAuthRefresh", "awsCredentialExport", "otelHeadersHelper"];
function claudeSettings(root) {
  const out = hookCommands(root.hooks, true);
  for (const k of CLAUDE_HELPERS) if (typeof root[k] === "string" && root[k].trim() !== "") out.push({ where: k, sig: root[k] });
  const sl = root.statusLine;
  if (sl && typeof sl === "object" && typeof sl.command === "string") out.push({ where: "statusLine", sig: sl.command });
  return out;
}
function vscodeTasks(root) {
  const out = [];
  if (!Array.isArray(root.tasks)) return out;
  root.tasks.forEach((t, i) => {
    if (!t || typeof t !== "object") return;
    const task = t;
    const run = task.runOptions && typeof task.runOptions === "object" ? task.runOptions.runOn : void 0;
    if (run !== "folderOpen") return;
    const command = typeof task.command === "string" ? task.command : "";
    if (command.trim() === "") return;
    out.push({ where: label(`task #${i + 1} on folder open`), sig: [command, ...strings2(task.args)].join(" ") });
  });
  return out;
}
function continueConfig(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  const unquote3 = (s) => s.trim().replace(/^["']|["']$/g, "");
  for (let i = 0; i < lines.length; i += 1) {
    const m = /^\s*(?:-\s+)?command:\s*(.+?)\s*$/.exec(lines[i]);
    if (!m) continue;
    const parts = [unquote3(m[1])];
    for (let j = i + 1; j < lines.length && j <= i + 40; j += 1) {
      const line = lines[j];
      const inline = /^\s*args:\s*\[(.*)\]\s*$/.exec(line);
      if (inline) {
        parts.push(...inline[1].split(",").map(unquote3).filter((x) => x !== ""));
        break;
      }
      if (/^\s*args:\s*$/.test(line)) {
        for (let k = j + 1; k < lines.length && /^\s*-\s+/.test(lines[k]); k += 1) parts.push(unquote3(lines[k].replace(/^\s*-\s+/, "")));
        break;
      }
      if (/^\s*-\s+\w+:/.test(line) || /^\S/.test(line)) break;
    }
    out.push({ where: label(`command on line ${i + 1}`), sig: parts.join(" ") });
  }
  return out;
}
function hookScript(text) {
  if (text.includes("\0")) return [];
  return text.split(/\r?\n/).map((l, i) => ({ l: l.trim(), i })).filter(({ l }) => l !== "" && !l.startsWith("#") && !l.startsWith("//")).map(({ l, i }) => ({ where: `line ${i + 1}`, sig: l }));
}
function readStartupFile(path, text) {
  const tool = startupToolOf(path);
  if (!tool || text.length > STARTUP_MAX_BYTES) return null;
  let commands;
  if (path.startsWith(`${STARTUP_HOOKS_DIR}/`)) {
    commands = hookScript(text);
  } else if (path === ".continue/config.yaml") {
    commands = continueConfig(text);
  } else {
    const root = parseJson(text, path === ".vscode/tasks.json" || path.startsWith(".claude/"));
    if (!root) return null;
    commands = path === ".cursor/hooks.json" ? hookCommands(root.hooks, false) : path === ".vscode/tasks.json" ? vscodeTasks(root) : claudeSettings(root);
  }
  commands = commands.slice(0, STARTUP_MAX_COMMANDS);
  const findings = commands.filter((c) => downloadsAndRuns(c.sig)).map((c) => ({ kind: "STARTUP_SHELL_DOWNLOAD", where: c.where }));
  return { tool, commands, findings };
}

// packages/core/src/supplyChain/projectAdvisories.ts
var PROJECT_ADVISORIES_MAX = 100;
var PROJECT_ADVISORY_PACKAGES_MAX = 20;
var GHSA_RE = /^GHSA(-[23456789cfghjmpqrvwx]{4}){3}$/;
var NPM_NAME_RE = /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/;
var ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
var isRecord = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
function cleanPatched(v) {
  if (typeof v !== "string") return "";
  const t = v.replace(/[^0-9A-Za-z.,<>=| -]/g, "").replace(/\s+/g, " ").trim();
  return t.length > 80 ? `${t.slice(0, 77)}...` : t;
}
function severityOf(v) {
  return v === "critical" || v === "high" || v === "medium" || v === "low" ? v : "unknown";
}
function readProjectAdvisories(answer) {
  if (!Array.isArray(answer)) return null;
  const advisories = [];
  let skipped = 0;
  for (const a of answer) {
    if (advisories.length >= PROJECT_ADVISORIES_MAX) {
      skipped += 1;
      continue;
    }
    if (!isRecord(a) || typeof a.ghsa_id !== "string" || !GHSA_RE.test(a.ghsa_id) || typeof a.published_at !== "string" || !ISO_RE.test(a.published_at)) {
      skipped += 1;
      continue;
    }
    if (a.state !== void 0 && a.state !== "published") continue;
    const packages = [];
    for (const v of Array.isArray(a.vulnerabilities) ? a.vulnerabilities : []) {
      if (packages.length >= PROJECT_ADVISORY_PACKAGES_MAX) break;
      if (!isRecord(v) || !isRecord(v.package)) continue;
      const eco = v.package.ecosystem;
      const name = v.package.name;
      if (eco !== "npm" || typeof name !== "string" || name.length > 214 || !NPM_NAME_RE.test(name)) continue;
      if (typeof v.vulnerable_version_range !== "string" || v.vulnerable_version_range.length > 200) continue;
      packages.push({ name, range: v.vulnerable_version_range, patched: cleanPatched(v.patched_versions) });
    }
    if (packages.length === 0) continue;
    advisories.push({ id: a.ghsa_id, severity: severityOf(a.severity), publishedAt: a.published_at, packages });
  }
  return { advisories, skipped };
}
function releaseOf(v) {
  const m = /^v?(0|[1-9]\d{0,8})\.(0|[1-9]\d{0,8})\.(0|[1-9]\d{0,8})$/.exec(v.trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}
function cmp(a, b) {
  for (let i = 0; i < 3; i += 1) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  return 0;
}
function comparatorsOf(alternative) {
  const joined = alternative.replace(/(>=|<=|>|<|=)\s+/g, "$1");
  const parts = joined.split(/[,\s]+/).filter((p) => p.length > 0);
  if (parts.length === 0 || parts.length > 4) return null;
  const out = [];
  for (const p of parts) {
    const m = /^(>=|<=|>|<|=)?(.+)$/.exec(p);
    const v = m ? releaseOf(m[2]) : null;
    if (!m || !v) return null;
    out.push({ op: m[1] ?? "=", v });
  }
  return out;
}
function inVulnerableRange(version, range) {
  const v = releaseOf(version);
  if (!v) return null;
  const alternatives = range.split("||");
  if (alternatives.length > 4) return null;
  let judged = false;
  for (const alt of alternatives) {
    const comps = comparatorsOf(alt.trim());
    if (!comps) return null;
    judged = true;
    const hit = comps.every(({ op, v: w }) => {
      const c = cmp(v, w);
      return op === ">=" ? c >= 0 : op === ">" ? c > 0 : op === "<=" ? c <= 0 : op === "<" ? c < 0 : c === 0;
    });
    if (hit) return true;
  }
  return judged ? false : null;
}
function matchProjectAdvisories(advisories, entries) {
  const byName = /* @__PURE__ */ new Map();
  for (const e of entries) {
    const s = byName.get(e.name) ?? /* @__PURE__ */ new Set();
    s.add(e.version);
    byName.set(e.name, s);
  }
  const matches = [];
  const seen = /* @__PURE__ */ new Set();
  let notJudged = 0;
  for (const a of advisories) {
    for (const p of a.packages) {
      for (const version of byName.get(p.name) ?? []) {
        const hit = inVulnerableRange(version, p.range);
        if (hit === null) {
          notJudged += 1;
          continue;
        }
        if (!hit) continue;
        const seenKey = `${p.name}@${version} ${a.id}`;
        if (seen.has(seenKey)) continue;
        seen.add(seenKey);
        matches.push({ id: a.id, severity: a.severity, publishedAt: a.publishedAt, name: p.name, version, patched: p.patched, seenKey });
      }
    }
  }
  matches.sort((x, y) => x.id < y.id ? -1 : x.id > y.id ? 1 : x.name < y.name ? -1 : x.name > y.name ? 1 : x.version < y.version ? -1 : x.version > y.version ? 1 : 0);
  return { matches, notJudged };
}

// packages/core/src/supplyChain/directDeps.ts
var isRecord2 = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var NPM_NAME_RE2 = /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/;
var OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
var REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;
var GH_HOST = ["github", "com"].join(".");
var DIRECT_DEPS_MAX = 500;
function directDependencyNames(text) {
  let doc;
  try {
    doc = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord2(doc)) return null;
  const names = /* @__PURE__ */ new Set();
  for (const field of ["dependencies", "devDependencies", "optionalDependencies"]) {
    const block = doc[field];
    if (!isRecord2(block)) continue;
    for (const name of Object.keys(block)) {
      if (names.size >= DIRECT_DEPS_MAX) break;
      if (name.length <= 214 && NPM_NAME_RE2.test(name)) names.add(name);
    }
  }
  return [...names].sort();
}
var SEGMENT_RE = /^[A-Za-z0-9_@-][A-Za-z0-9._@-]{0,99}$/;
function safeDir(path) {
  const p = path.replace(/^\.\//, "").replace(/\/+$/, "");
  const parts = p.split("/");
  return parts.length >= 1 && parts.length <= 4 && parts.every((s) => SEGMENT_RE.test(s)) ? p : null;
}
var WORKSPACE_PATTERNS_MAX = 20;
function sortPatterns(raw) {
  const dirs = /* @__PURE__ */ new Set();
  const parents = /* @__PURE__ */ new Set();
  for (const r of raw.slice(0, WORKSPACE_PATTERNS_MAX)) {
    if (typeof r !== "string" || r.length > 200) continue;
    const s = r.trim();
    if (s.endsWith("/*")) {
      const d = safeDir(s.slice(0, -2));
      if (d !== null) parents.add(d);
    } else {
      const d = safeDir(s);
      if (d !== null) dirs.add(d);
    }
  }
  return { dirs: [...dirs].sort(), parents: [...parents].sort() };
}
function workspacePatterns(text) {
  let doc;
  try {
    doc = JSON.parse(text);
  } catch {
    return { dirs: [], parents: [] };
  }
  if (!isRecord2(doc)) return { dirs: [], parents: [] };
  const w = doc.workspaces;
  const list = Array.isArray(w) ? w : isRecord2(w) && Array.isArray(w.packages) ? w.packages : [];
  return sortPatterns(list);
}
function pnpmWorkspacePatterns(text) {
  const out = [];
  let inPackages = false;
  for (const line of text.slice(0, 2e4).split(/\r?\n/)) {
    if (/^\S/.test(line)) inPackages = /^packages\s*:\s*(#.*)?$/.test(line);
    else if (inPackages) {
      const m = /^\s+-\s+(?:'([^']*)'|"([^"]*)"|([^\s#]+))\s*(#.*)?$/.exec(line);
      if (m) out.push(m[1] ?? m[2] ?? m[3] ?? "");
    }
  }
  return sortPatterns(out);
}
function lockfileDir(path) {
  const i = path.lastIndexOf("/");
  return i < 0 ? "" : safeDir(path.slice(0, i));
}
function listedDirs(listing) {
  if (!Array.isArray(listing)) return [];
  const out = [];
  for (const e of listing) {
    if (isRecord2(e) && e.type === "dir" && typeof e.name === "string" && SEGMENT_RE.test(e.name)) out.push(e.name);
  }
  return out.sort();
}
function ownerRepo(owner, repo) {
  const r = repo.replace(/\.git$/, "");
  return OWNER_RE.test(owner) && REPO_RE.test(r) && r !== "." && r !== ".." ? `${owner}/${r}` : null;
}
function npmRepoOfDoc(doc) {
  if (!isRecord2(doc)) return null;
  const latest = latestVersionOf(doc);
  const versions = isRecord2(doc.versions) ? doc.versions : {};
  const fromLatest = latest !== null && isRecord2(versions[latest]) ? versions[latest].repository : void 0;
  const field = doc.repository ?? fromLatest;
  const raw = typeof field === "string" ? field : isRecord2(field) && typeof field.url === "string" ? field.url : null;
  if (raw === null || raw.length > 300) return null;
  const s = raw.trim();
  let m = /^github:([^/\s]+)\/([^/\s#]+)$/.exec(s) ?? /^([^/:@\s]+)\/([^/\s#]+)$/.exec(s);
  if (m) return ownerRepo(m[1], m[2]);
  const hostEsc = GH_HOST.replace(".", "\\.");
  m = new RegExp(`^(?:git\\+)?(?:https?|git|ssh)://(?:git@)?(?:www\\.)?${hostEsc}/([^/\\s]+)/([^/\\s#?]+)`).exec(s) ?? new RegExp(`^git@${hostEsc}:([^/\\s]+)/([^/\\s#?]+)$`).exec(s);
  return m ? ownerRepo(m[1], m[2]) : null;
}
function latestVersionOf(doc) {
  const tags = doc["dist-tags"];
  return isRecord2(tags) && typeof tags.latest === "string" && tags.latest.length <= 64 ? tags.latest : null;
}
var VERSION_RE2 = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.+-]*)?$/;
function manifestVersion(doc) {
  if (!isRecord2(doc) || typeof doc.version !== "string") return null;
  return doc.version.length <= 64 && VERSION_RE2.test(doc.version) ? doc.version : null;
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
var PYPI_LOCKS_ON = true;
var pypiLocksForTest;
function pypiLocksIsOn() {
  return pypiLocksForTest ?? PYPI_LOCKS_ON;
}
function isPythonLockPath(path) {
  const lower = path.toLowerCase();
  const base = lower.slice(lower.lastIndexOf("/") + 1);
  if (base === "poetry.lock" || base === "uv.lock") return true;
  if (!base.endsWith(".txt")) return false;
  return /^requirements[\w.-]*\.txt$/.test(base) || lower.includes("requirements/");
}
function pypiName(name) {
  return name.toLowerCase().replace(/[-_.]+/g, "-");
}
var PY_NAME2 = "[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?";
var PY_VERSION = "[A-Za-z0-9][A-Za-z0-9.!+_-]*";
var PINNED = new RegExp(`^(${PY_NAME2})\\s*(?:\\[[^\\]]*\\])?\\s*===?\\s*(${PY_VERSION})$`);
function readRequirements(content) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const joined = content.replace(/\r\n?/g, "\n").replace(/\\\n/g, " ");
  for (const raw of joined.split("\n")) {
    let line = raw.replace(/(^|\s)#.*$/, "").trim();
    if (line.length === 0 || line.startsWith("-")) continue;
    line = line.split(";")[0].replace(/\s--hash=\S+/g, "").trim();
    const m = PINNED.exec(line);
    if (!m) continue;
    const entry = { name: pypiName(m[1]), version: m[2] };
    const k = `${entry.name}@${entry.version}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(entry);
  }
  return out;
}
function readTomlPackages(content) {
  const text = content.replace(/\r\n?/g, "\n");
  const parts = text.split(/^\[\[package\]\][ \t]*$/m);
  if (parts.length < 2) return null;
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const part of parts.slice(1)) {
    const own = part.split(/^\[/m)[0];
    const name = /^name\s*=\s*"([^"\n]+)"\s*$/m.exec(own)?.[1];
    const version = /^version\s*=\s*"([^"\n]+)"\s*$/m.exec(own)?.[1];
    if (!name || !version || !new RegExp(`^${PY_NAME2}$`).test(name) || !new RegExp(`^${PY_VERSION}$`).test(version)) continue;
    const entry = { name: pypiName(name), version };
    const k = `${entry.name}@${entry.version}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(entry);
  }
  return out;
}
function parseLockfile(path, content) {
  const lower = path.toLowerCase();
  if (pypiLocksIsOn() && isPythonLockPath(path)) {
    return lower.endsWith(".txt") ? readRequirements(content) : readTomlPackages(content);
  }
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

// apps/watch/src/outside/repo/action/prCheck.ts
var PR_CHECK_ON = true;
var prCheckForTest;
function prCheckIsOn() {
  return prCheckForTest ?? PR_CHECK_ON;
}
var MCP_CONFIG_PATHS = [".cursor/mcp.json", ".vscode/mcp.json", ".mcp.json", "mcp.json", "claude_desktop_config.json"];
var PR_WORKFLOWS_MAX = 30;
var PR_ROOT_IMAGE_FILES_MAX = 10;
var PR_LINES = {
  "PRC-01": "Checked pull request #{pr} at {commit}: {packages} packages, {workflows} workflows, {images} images. Nothing urgent found.",
  "PRC-02": "Checked pull request #{pr} at {commit}: {urgent} urgent findings. Fix them before this pull request is merged.",
  "PRC-03": "{level}: {where}{what}",
  "PRC-04": "Not checked: {what}. This result does not cover it.",
  "PRC-05": "The site refused the check ({status} {code}). Check that the key is a live repository key and that this repository is listed on your Account page.",
  "PRC-06": "Could not reach the site, so this pull request was not checked. Run the job again.",
  "PRC-07": "Could not read {path}, so this pull request was not checked."
};
var PR_FINDING_TEXT = {
  compromised_action: "{subject} is an action whose tags were moved to malicious code ({detail}).",
  unsafe_trigger: "starts on {subject} and checks out {detail}, so anyone who opens a pull request can run code with this repository's secrets.",
  unpinned_action: "{subject}@{detail} is used by tag, not by commit.",
  unpinned_image: "the image {subject} is used by tag, not pinned to a digest.",
  bad_image: "the image {subject} is at a digest published as malicious ({detail}).",
  malicious_package: "{subject} is listed as malicious ({detail}).",
  advisory_package: "{subject} has a published advisory ({detail}).",
  young_package: "{subject} was published less than 48 hours ago ({detail}).",
  install_script: "{subject} is new in this pull request and runs an install script when it is installed.",
  mcp_inline_secret: "the AI tool server {detail} has a secret written into its config ({subject}).",
  mcp_shell_download: "the AI tool server {detail} downloads and runs a script ({subject}).",
  mcp_plain_http: "the AI tool server {detail} is reached over plain http ({subject}).",
  mcp_unpinned_package: "the AI tool server {detail} starts {subject} with no fixed version.",
  mcp_remote_server: "the AI tool server {detail} runs on another host ({subject})."
};
var NOT_CHECKED_TEXT = {
  advisories: "published advisories and malware",
  published: "how recently each package was published",
  installScripts: "install scripts of new packages (the site needs your default branch's list, sent by this Action on that branch)"
};
var fill = (line, slots) => line.replace(/\{([a-z]+)\}/g, (m, k) => k in slots ? String(slots[k]) : m);
function pullRequestOf(env, readFile2) {
  if (env.GITHUB_EVENT_NAME !== "pull_request" || !env.GITHUB_EVENT_PATH) return null;
  try {
    const ev = JSON.parse(readFile2(env.GITHUB_EVENT_PATH) ?? "null");
    const pr = ev?.pull_request?.number;
    const commit = ev?.pull_request?.head?.sha;
    if (typeof pr !== "number" || !Number.isInteger(pr) || pr < 1 || typeof commit !== "string" || !/^[0-9a-f]{40}$/.test(commit)) return null;
    return { pr, commit };
  } catch {
    return null;
  }
}
function collectPrCheck(repo, pr, lockfilePaths, readFile2, listDir2) {
  const lockfiles = [];
  for (const path of lockfilePaths) {
    const t = readFile2(path);
    if (t === null) continue;
    const entries = parseLockfile(path, t);
    if (entries === null) return { ok: false, path };
    const kept = /* @__PURE__ */ new Map();
    for (const e of entries) kept.set(`${e.name}@${e.version}`, { name: e.name, version: e.version });
    lockfiles.push({ path, packages: [...kept.values()] });
  }
  const workflows = [];
  const images = [];
  const addImages = (path, t) => {
    const read = supplyChain_exports.readImages(path, t);
    for (const u of read?.uses ?? []) images.push({ path, line: u.line, label: supplyChain_exports.imageLabel(u), name: u.name, digest: u.digest });
  };
  const wfNames = listDir2(".github/workflows").filter((n) => /\.ya?ml$/i.test(n)).sort().slice(0, PR_WORKFLOWS_MAX);
  for (const name of wfNames) {
    const path = `.github/workflows/${name}`;
    const t = readFile2(path);
    if (t === null) continue;
    const read = supplyChain_exports.readWorkflow(t);
    if (read) {
      const actions = read.uses.filter((u) => !u.firstParty).map((u) => ({ action: u.action, ref: u.ref }));
      workflows.push({ path, findings: [...read.findings], actions });
    }
    addImages(path, t);
  }
  const rootImageFiles = listDir2("").filter((n) => supplyChain_exports.imageFileSource(n) !== null).sort().slice(0, PR_ROOT_IMAGE_FILES_MAX);
  for (const path of rootImageFiles) {
    const t = readFile2(path);
    if (t !== null) addImages(path, t);
  }
  const mcp = [];
  for (const path of MCP_CONFIG_PATHS) {
    const t = readFile2(path);
    if (t === null) continue;
    const read = supplyChain_exports.readMcpConfig(t);
    if (!read) continue;
    mcp.push({
      path,
      findings: read.findings.map((f) => ({ kind: f.kind, server: f.server, subject: f.subject })),
      packages: read.packages.filter((p) => p.version !== null && p.version !== "latest").map((p) => ({ ecosystem: p.ecosystem, name: p.name, version: p.version }))
    });
  }
  return { ok: true, body: { version: 1, repo, commit: pr.commit, pr: pr.pr, lockfiles, workflows, images: images.slice(0, 200), mcp } };
}
function findingLine(f) {
  const what = typeof f.code === "string" ? PR_FINDING_TEXT[f.code] : void 0;
  if (!what || f.level !== "urgent" && f.level !== "notice") return null;
  const s = (v) => typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, " ").slice(0, 200) : "";
  const where = s(f.path) === "" ? "" : `${s(f.path)}${typeof f.line === "number" && f.line > 0 ? ` line ${f.line}` : ""}: `;
  return fill(PR_LINES["PRC-03"], { level: f.level === "urgent" ? "URGENT" : "Notice", where, what: fill(what, { subject: s(f.subject), detail: s(f.detail) }) });
}
async function runPrCheck(env, deps, key, origin, pr) {
  const paths = lockfilePathsOf(env.INPUT_LOCKFILES);
  if (paths === null) return 1;
  const got = collectPrCheck(env.GITHUB_REPOSITORY ?? "", pr, paths, deps.readFile, deps.listDir);
  if (!got.ok) {
    deps.log(fill(PR_LINES["PRC-07"], { path: got.path }));
    return 1;
  }
  const body = JSON.stringify(got.body);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt > 0) await deps.sleep(5e3);
    let res;
    try {
      res = await deps.fetch(`${origin}/api/billing/outside/pr-check`, {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json", accept: "application/json" },
        body
      });
    } catch {
      continue;
    }
    if (res.status === 429 || res.status >= 500) continue;
    let answer = null;
    try {
      answer = await res.json();
    } catch {
      answer = null;
    }
    if (res.status !== 200 || !answer || !Array.isArray(answer.findings)) {
      const code = typeof answer?.error === "string" ? String(answer.error).replace(/[^a-z_]/g, "").slice(0, 40) : "";
      deps.log(fill(PR_LINES["PRC-05"], { status: res.status, code }));
      return 1;
    }
    let urgent = 0;
    for (const f of answer.findings) {
      const line = findingLine(f ?? {});
      if (line === null) continue;
      if (f.level === "urgent") urgent += 1;
      deps.log(line);
    }
    const checked = answer.checked ?? {};
    for (const k of Object.keys(NOT_CHECKED_TEXT)) {
      if (checked[k] === false) deps.log(fill(PR_LINES["PRC-04"], { what: NOT_CHECKED_TEXT[k] }));
    }
    const counts = { pr: pr.pr, commit: pr.commit.slice(0, 7), packages: typeof answer.packages === "number" ? answer.packages : 0, workflows: got.body.workflows.length, images: got.body.images.length, urgent };
    deps.log(fill(urgent > 0 ? PR_LINES["PRC-02"] : PR_LINES["PRC-01"], counts));
    return urgent > 0 ? 1 : 0;
  }
  deps.log(PR_LINES["PRC-06"]);
  return 1;
}

// apps/watch/src/outside/repo/action/startupCheck.ts
var STARTUP_CHECK_ON = true;
var forTest;
function startupCheckIsOn() {
  return forTest ?? STARTUP_CHECK_ON;
}
var STARTUP_LINES = {
  "SUC-01": "Checked the AI tool start-up files: {files} found, none downloads and runs a script.",
  "SUC-02": "URGENT: {path} ({where}): {tool} runs a command on its own that downloads and runs a script. Remove it before anyone opens this branch.",
  "SUC-03": "Not checked: {path}, which could not be read in its own format."
};
var fill2 = (line, slots) => line.replace(/\{([a-z]+)\}/g, (m, k) => k in slots ? String(slots[k]) : m);
function runStartupCheck(readFile2, listDir2, log) {
  const hooks = listDir2(supplyChain_exports.STARTUP_HOOKS_DIR).filter((n) => /^[A-Za-z0-9._-]{1,100}$/.test(n)).sort().slice(0, supplyChain_exports.STARTUP_HOOKS_MAX).map((n) => `${supplyChain_exports.STARTUP_HOOKS_DIR}/${n}`);
  let files = 0;
  let urgent = 0;
  for (const path of [...supplyChain_exports.STARTUP_FILE_PATHS, ...hooks]) {
    const text = readFile2(path);
    if (text === null) continue;
    files += 1;
    const read = supplyChain_exports.readStartupFile(path, text);
    if (!read) {
      log(fill2(STARTUP_LINES["SUC-03"], { path }));
      continue;
    }
    for (const f of read.findings) {
      urgent += 1;
      log(fill2(STARTUP_LINES["SUC-02"], { path, where: f.where, tool: read.tool }));
    }
  }
  if (urgent === 0) log(fill2(STARTUP_LINES["SUC-01"], { files }));
  return urgent;
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
var fill3 = (line, slots) => line.replace(/\{([a-z]+)\}/g, (m, k) => k in slots ? String(slots[k]) : m);
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
  const asked = (env.INPUT_PR_CHECK ?? "").trim().toLowerCase() === "on";
  const startupUrgent = startupCheckIsOn() && asked && deps.listDir && (env.INPUT_KEY ?? "").trim() !== "" && siteOriginOf(env.INPUT_SITE) !== null ? runStartupCheck(deps.readFile, deps.listDir, deps.log) : 0;
  const code = await runActionModes(env, deps);
  return startupUrgent > 0 ? 1 : code;
}
async function runActionModes(env, deps) {
  const key = (env.INPUT_KEY ?? "").trim();
  const origin = siteOriginOf(env.INPUT_SITE);
  const repo = env.GITHUB_REPOSITORY ?? "";
  const commit = env.GITHUB_SHA ?? "";
  if (key === "" || origin === null) {
    deps.log(ACTION_LINES["RA-05"]);
    return 1;
  }
  if (prCheckIsOn() && deps.listDir && (env.INPUT_PR_CHECK ?? "").trim().toLowerCase() === "on") {
    const pr = pullRequestOf(env, deps.readFile);
    if (pr) {
      if (lockfilePathsOf(env.INPUT_LOCKFILES) === null) {
        deps.log(ACTION_LINES["RA-06"]);
        return 1;
      }
      return runPrCheck(env, { ...deps, listDir: deps.listDir }, key, origin, pr);
    }
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
    if (got.problem === "no_lockfile") deps.log(fill3(ACTION_LINES["RA-03"], { paths: paths.join(", ") }));
    else if (got.problem === "unreadable") deps.log(fill3(ACTION_LINES["RA-04"], { path: got.path ?? "" }));
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
      if (got.missing.length > 0) deps.log(fill3(ACTION_LINES["RA-10"], { paths: got.missing.join(", ") }));
      deps.log(fill3(ACTION_LINES["RA-01"], { packages: got.packages, files: got.body.lockfiles.length, commit: commit.slice(0, 7) }));
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
    deps.log(fill3(ACTION_LINES["RA-08"], { status: res.status, code }));
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
function listDir(path) {
  try {
    return (0, import_node_fs.readdirSync)((0, import_node_path.join)(workspace, path), { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name);
  } catch {
    return [];
  }
}
void runAction(process.env, {
  readFile,
  listDir,
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
