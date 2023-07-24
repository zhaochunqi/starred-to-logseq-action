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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchRepos = void 0;
const core_1 = require("@actions/core");
const moment_1 = __importDefault(require("moment"));
function formatDate(date) {
    return (0, moment_1.default)(date).format('YYYY-MM-DD dddd');
}
const fetchRepos = (github, collection, username, after = ``) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const query = `
    query($login: String!, $after: String!) {
      user(login: $login) {
        starredRepositories(
          orderBy: {field: STARRED_AT, direction: DESC},
          first: 100, 
          after: $after
        ) {
          edges {
            starredAt
            node {
              nameWithOwner
              description
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
    starred.edges.map(edges => {
        const repo = {
            name: edges.node.nameWithOwner,
            description: edges.node.description || ``,
            starredAt: formatDate(edges.starredAt),
        };
        collection.push(repo);
    });
    (0, core_1.info)(`fetch repos count: ${collection.length}/${starred.totalCount}`);
    if ((_a = starred.pageInfo) === null || _a === void 0 ? void 0 : _a.hasNextPage) {
        yield (0, exports.fetchRepos)(github, collection, username, starred.pageInfo.endCursor);
    }
});
exports.fetchRepos = fetchRepos;
