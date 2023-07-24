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
const core_1 = require("@actions/core");
const github_1 = require("@actions/github");
const console_1 = require("console");
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = require("fs");
const mkdirp_1 = require("mkdirp");
const path_1 = require("path");
const fetchRepos_1 = require("./fetchRepos");
const renderToMd_1 = require("./renderToMd");
dotenv_1.default.config();
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const username = (0, core_1.getInput)(`username`);
    const repository = (0, core_1.getInput)(`repository`);
    const token = (0, core_1.getInput)(`token`);
    const targetDir = (0, core_1.getInput)(`targetDir`);
    const github = (0, github_1.getOctokit)(token);
    const collection = Array();
    yield (0, fetchRepos_1.fetchRepos)(github, collection, username);
    yield (0, mkdirp_1.mkdirp)(targetDir);
    const md = (0, renderToMd_1.renderToMd)(repository, collection);
    const mdFilename = (0, path_1.join)(targetDir, "Github Stars.md");
    (0, console_1.info)(`write file: "${mdFilename}"`);
    (0, console_1.info)(md);
    yield fs_1.promises.writeFile(mdFilename, md);
});
main();
