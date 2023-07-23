"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchRepos = void 0;
const core_1 = require("@actions/core");
const fetchRepos = (github, collection, username, after = ``) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const query = `
    query($login: String!, $after: String!) {
      user(login: $login) {
        starredRepositories(first: 100, after: $after) {
          nodes {
            nameWithOwner
            description
            primaryLanguage {
              name
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
          totalCount
        }
      }
    }
  `;
    const variables = {
        "login": username,
        "after": after
    };
    const data = yield github.graphql(query, variables);
    const starred = data.user.starredRepositories;
    starred.nodes.map(node => {
        const repo = {
            name: node.nameWithOwner,
            description: node.description || ``,
            language: node.primaryLanguage ? node.primaryLanguage.name : `Misc`
        };
        collection.push(repo);
    });
    (0, core_1.info)(`fetch repos count: ${collection.length}/${starred.totalCount}`);
    if ((_a = starred.pageInfo) === null || _a === void 0 ? void 0 : _a.hasNextPage) {
        yield (0, exports.fetchRepos)(github, collection, username, starred.pageInfo.endCursor);
    }
});
exports.fetchRepos = fetchRepos;
