import * as fs from 'fs'
import * as path from 'path'

import readDirRecursive from 'fs-readdir-recursive'
import Parser from 'markdown-parser'
import promisify from 'es6-promisify'

const parser = new Parser()

const removeExtension = ext => filePath => {
  if (!filePath.endsWith(ext)) {
    throw new Error(`"${ext}" extension expected`)
  }
  return filePath.slice(0, -ext.length)
}
const removeMarkdownExtension = removeExtension('.md')

async function checkFile (markdownFiles, sourceDirPath, dirPath, fileName) {
  const filePath = path.join(sourceDirPath, dirPath, fileName)
  const markdownContent = String(fs.readFileSync(filePath))
  const {references} = await promisify(parser.parse, parser)(markdownContent)

  const markdownFilesWithoutExtension = markdownFiles.map(removeMarkdownExtension)
  const problems = references
    .filter(reference => !reference.href.startsWith('http'))
    .reduce((acc, reference) => {
      const targetFilePath = path.join(dirPath, reference.href)
      if (!targetFilePath.endsWith('.md') || !markdownFilesWithoutExtension.includes(removeMarkdownExtension(targetFilePath))) {
        acc.push(reference)
      }
      return acc
    }, [])
  return problems
}

async function checkFiles (markdownFiles, sourceDirPath) {
  const deadLinksByFilePath = {}
  for (let filePath of markdownFiles) {
    const dirPath = path.dirname(filePath)
    const fileName = path.basename(filePath)
    const deadLinks = await checkFile(markdownFiles, sourceDirPath, dirPath, fileName)
    if (deadLinks.length) {
      deadLinksByFilePath[filePath] = deadLinks
    }
  }
  return deadLinksByFilePath
}

export default function main (sourceDirPath) {
  const markdownFiles = readDirRecursive(sourceDirPath).filter(filePath => filePath.endsWith('.md'))
  checkFiles(markdownFiles, sourceDirPath).then(
    deadLinks => console.log(JSON.stringify(deadLinks, null, 2)),
    e => console.error(e.stack)
  )
}
