#!/usr/bin/env node

import { promises as fs } from 'fs';
import os from 'os';
import {
  camelCase,
  capitalCase,
  constantCase,
  dotCase,
  headerCase,
  noCase,
  paramCase,
  pascalCase,
  sentenceCase,
  snakeCase
} from 'change-case';

const templateName = process.argv[2];
const varsArr = process.argv.slice(3);
const variables = varsArr.reduce((obj, arrV) => {
  const [key, value] = arrV.split('=');
  return {
    ...obj,
    [key]: value
  }
}, {});

async function start(templateName, path) {

  function getTemplateDirPath(filePath) {
    return `${os.homedir()}/.tmpl-gen/${filePath}`;
  }
  
  async function getTemplateFilesAndDirectories() {
    return await fs.readdir(getTemplateDirPath(templateName));
  }
  
  function getTemplateFilePath(file) {
    return `${getTemplateDirPath(templateName)}/${file}`;
  }
  
  async function getLStat(fileOrDir) {
    return (await fs.lstat(getTemplateFilePath(fileOrDir)));
  }
  
  async function separateDirsAndFiles(filesAndDirectories) {
    const files = [];
    const directories = [];
    for (const fileOrDir of filesAndDirectories) {
      const isFile = (await getLStat(fileOrDir)).isFile();
      const isDirectory = (await getLStat(fileOrDir)).isDirectory();
      if (isFile) {
        files.push(fileOrDir);
      } else if (isDirectory) {
        directories.push(fileOrDir);
      }
    }
    return [files, directories];
  }
  
  function replaceVarToValue(from, to, content) {
    return content.replaceAll(`%{${from}}`, to)
                  .replaceAll(`%{${from}|camelCase}`, camelCase(to))
                  .replaceAll(`%{${from}|capitalCase}`, capitalCase(to))
                  .replaceAll(`%{${from}|constantCase}`, constantCase(to))
                  .replaceAll(`%{${from}|dotCase}`, dotCase(to))
                  .replaceAll(`%{${from}|headerCase}`, headerCase(to))
                  .replaceAll(`%{${from}|noCase}`, noCase(to))
                  .replaceAll(`%{${from}|paramCase}`, paramCase(to))
                  .replaceAll(`%{${from}|pascalCase}`, pascalCase(to))
                  .replaceAll(`%{${from}|sentenceCase}`, sentenceCase(to))
                  .replaceAll(`%{${from}|snakeCase}`, snakeCase(to))

  }
  
  function replaceAllVariables(content) {
    let newContent = content;
    for (const name in variables) {
      newContent = replaceVarToValue(name, variables[name], newContent);
    }
    return newContent;
  }
  
  async function generateFile(file) {
    const newFileName = replaceAllVariables(file);
    const content = (await fs.readFile(getTemplateFilePath(file))).toString();
    const newContent = replaceAllVariables(content);
    fs.writeFile(`${path}${newFileName}`, newContent);
  }
  
  async function generateFiles(files) {
    files.forEach(async file => {
      await generateFile(file);
    });
  }

  async function generateDirsWithFiles(directories) {
    directories.forEach(directoryName => {
      const newDirName = replaceAllVariables(directoryName);
      fs.mkdir(`${path}/${newDirName}/`);
      start(`${templateName}/${directoryName}`, `${path}/${newDirName}/`);
    });
  }

  const filesAndDirectories = await getTemplateFilesAndDirectories();
  const [files, directories] = await separateDirsAndFiles(filesAndDirectories);
  generateFiles(files);
  generateDirsWithFiles(directories);
}

start(templateName, './');
