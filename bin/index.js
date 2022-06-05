#!/usr/bin/env node

import { promises as fs, readFile } from 'fs';
import os from 'os';

const templateName = process.argv[2];
const varsArr = process.argv.slice(3);
const variables = varsArr.reduce((obj, arrV) => {
  const [key, value] = arrV.split('=');
  return {
    ...obj,
    [key]: value
  }
}, {});

function getTemplateFolderPath(filePath) {
  return `${os.homedir()}/.tmpl-gen/${filePath}`;
}

async function getTemplateFilesAndDirectories(templateName) {
  return await fs.readdir(getTemplateFolderPath(templateName));
}

function getTemplateFilePath(file) {
  return `${getTemplateFolderPath(templateName)}/${file}`;
}

async function getLStat(fileOrFolder) {
  return (await fs.lstat(getTemplateFilePath(fileOrFolder)));
}

async function separateFoldersAndFiles(filesAndDirectories) {
  const files = [];
  const directories = [];
  for (const fileOrFolder of filesAndDirectories) {
    const isFile = (await getLStat(fileOrFolder)).isFile();
    const isDirectory = (await getLStat(fileOrFolder)).isDirectory();
    if (isFile) {
      files.push(fileOrFolder);
    } else if (isDirectory) {
      directories.push(fileOrFolder);
    }
  }
  return [files, directories];
}

function replaceVarToValue(from, to, content) {
  return content.replaceAll(`%{${from}}`, to);
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
  fs.writeFile(newFileName, newContent);
}

async function generateFiles(files) {
  files.forEach(async file => {
    await generateFile(file);
  });
}

async function start() {
  const filesAndDirectories = await getTemplateFilesAndDirectories(templateName);
  const [files, directories] = await separateFoldersAndFiles(filesAndDirectories);
  generateFiles(files);
}

start();