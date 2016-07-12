import * as fs from 'fs'
import * as path from 'path'

import readDirRecursive from 'fs-readdir-recursive'
import Parser from 'markdown-parser'
import promisify from 'es6-promisify'

const parser = new Parser()

const removeExtension = ext => filePath => {
  if (!filePath.endsWith(ext)) {
    throw new Error(`"${ext}" extension expected in "${filePath}"`)
  }
  return filePath.slice(0, -ext.length)
}
const removeMarkdownExtension = removeExtension('.md')

async function checkFile (markdownFiles, directoryPaths, sourceDirPath, dirPath, fileName) {
  function isDirectoryPath (path) {
    const cleanPath = path.endsWith('/')
      ? path.slice(0, -1)
      : path
    return directoryPaths.includes(cleanPath)
  }
  function isValidMarkdownFile (path) {
    return markdownFilesWithoutExtension.includes(removeMarkdownExtension(path))
  }

  const filePath = path.join(sourceDirPath, dirPath, fileName)
  const markdownContent = String(fs.readFileSync(filePath))
  const {references} = await promisify(parser.parse, parser)(markdownContent)

  const markdownFilesWithoutExtension = markdownFiles.map(removeMarkdownExtension)
  const problems = references
    .filter(reference => !reference.href.startsWith('http'))
    .reduce((acc, reference) => {
      const referenceHref = path.join(dirPath, reference.href)
      const hasMarkdownExtension = referenceHref.endsWith('.md')
      if (hasMarkdownExtension) {
        if (!isValidMarkdownFile(referenceHref)) {
          acc.push({reference, problem: 'Reference href has a ".md" extension but is not a valid Markdown file'})
        }
      } else {
        if (!isDirectoryPath(referenceHref)) {
          acc.push({reference, problem: 'Reference href has no ".md" extension but is not a valid directory path'})
        }
      }
      return acc
    }, [])
  return problems
}

async function checkFiles (markdownFiles, sourceDirPath) {
  const deadLinksByFilePath = {}
  const directoryPaths = markdownFiles
    .filter(filePath => filePath.includes('/'))
    .map(filePath => filePath.split('/').slice(0, -1).join('/'))
  for (let filePath of markdownFiles) {
    const dirPath = path.dirname(filePath)
    const fileName = path.basename(filePath)
    const deadLinks = await checkFile(markdownFiles, directoryPaths, sourceDirPath, dirPath, fileName)
    if (deadLinks.length) {
      deadLinksByFilePath[filePath] = deadLinks
    }
  }
  return deadLinksByFilePath
}

export default function main (sourceDirPath) {
  const markdownFiles = readDirRecursive(sourceDirPath)
  checkFiles(markdownFiles, sourceDirPath).then(
    deadLinks => console.log(JSON.stringify(deadLinks, null, 2)),
    e => console.error(e.stack)
  )
}
