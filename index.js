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
      if (referenceHref.endsWith('.md')) {
        if (!isValidMarkdownFile(referenceHref)) {
          acc.push({reference, message: 'reference href has a ".md" extension but is not a valid Markdown file'})
        }
      } else {
        if (referenceHref.endsWith('.html')) {
          acc.push({reference, message: 'reference href has ".html" extension but it should have a ".md" extension'})
        } else if (!isDirectoryPath(referenceHref)) {
          acc.push({reference, message: 'reference href has no ".md" extension but is not a valid directory path'})
        }
      }
      return acc
    }, [])
  return problems
}

async function checkFiles (markdownFiles, sourceDirPath) {
  const problemsByFilePath = {}
  const directoryPaths = markdownFiles
    .filter(filePath => filePath.includes('/'))
    .map(filePath => filePath.split('/').slice(0, -1).join('/'))
  for (let filePath of markdownFiles) {
    const dirPath = path.dirname(filePath)
    const fileName = path.basename(filePath)
    const problems = await checkFile(markdownFiles, directoryPaths, sourceDirPath, dirPath, fileName)
    if (problems.length) {
      problemsByFilePath[filePath] = problems
    }
  }
  return problemsByFilePath
}

function renderProblems (problemsByFilePath) {
  if (Object.keys(problemsByFilePath).length === 0) {
    return
  }
  console.log('# Problems')
  for (const filePath in problemsByFilePath) {
    console.log(`\n## In file \`${filePath}\`\n`)
    for (const problem of problemsByFilePath[filePath]) {
      console.log(`- ${problem.message}: [${problem.reference.title}](${problem.reference.href})`)
    }
  }
}

export default function main (sourceDirPath) {
  const markdownFiles = readDirRecursive(sourceDirPath)
  checkFiles(markdownFiles, sourceDirPath).then(
    renderProblems,
    e => console.error(e.stack)
  )
}
